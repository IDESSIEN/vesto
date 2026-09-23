// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VestoEscrow
 * @notice Hybrid 7-layer lender protection escrow for invoice financing.
 *
 * Layers:
 *   L1 — Buyer acknowledgement required before lender can fund
 *   L2 — Admin pre-registers invoices with expected seller/amount/dueDate
 *   L3 — Admin (or oracle relay) calls approveRepayment after webhook detection + 24h buffer
 *   L4 — Admin can block a pending settlement within the buffer window
 *   L5 — Escrow reversal timer: lender can claimRefund after repaymentDeadline
 *   L6 — Buyer can repay directly in USDC (trustless fast path, 0.5% fee discount)
 *   L7 — Partial payment: proportional release + cure window
 *
 * Yield model (off-chain, reflected onchain via pendingClaims):
 *   - Platform fee: 2.8% of advanceAmount, retained by admin
 *   - Lender yield: set per invoice at registration (yieldBps, e.g. 1420 = 14.20%)
 *   - On settlement: lender receives advanceAmount + lenderYield
 *   - Seller receives advanceAmount minus platform fee (net advance)
 *   - On default: lender receives advanceAmount only (yield forfeited)
 */
contract VestoEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────── constants ──

    uint256 public constant PLATFORM_FEE_BPS  = 280;   // 2.80%
    uint256 public constant USDC_FAST_DISCOUNT = 50;   // 0.50% fee discount for USDC direct repayment
    uint256 public constant GRACE_PERIOD       = 14 days;
    uint256 public constant CURE_WINDOW        = 7 days;
    uint256 public constant PARTIAL_THRESHOLD  = 5000; // 50.00% in bps — below this, reject
    uint256 public constant BPS_DENOM          = 10_000;

    // ────────────────────────────────────────────────────────────── types ──

    enum Status {
        Open,               // registered, awaiting buyer ack + lender funding
        BuyerAcknowledged,  // buyer confirmed debt — lender can now fund
        Funded,             // lender capital locked in escrow
        PaymentDetected,    // BaaS webhook received, 24h buffer running (off-chain state, reflected here on approvePayout call)
        Settled,            // repayment approved, claims allocated
        PartialShortfall,   // partial payment received, cure window open
        Defaulted,          // repaymentDeadline passed, lender claimed refund
        Disputed,           // admin flagged for manual resolution
        Resolved            // dispute resolved
    }

    struct Invoice {
        address seller;
        address lender;
        uint256 advanceAmount;      // USDC amount lender locked in
        uint256 lenderYield;        // USDC yield allocated to lender on settlement
        uint256 platformFee;        // USDC fee allocated to admin on settlement
        Status  status;
        uint256 fundedAt;
        uint256 dueDate;
        uint256 repaymentDeadline;  // dueDate + GRACE_PERIOD — lender can claimRefund after this
        uint256 partialPaid;        // amount received so far (Layer 7)
        uint256 shortfallDeadline;  // partialPaid timestamp + CURE_WINDOW
        bool    buyerAcknowledged;  // Layer 1
    }

    // ─────────────────────────────────────────────────────────── storage ──

    address public immutable admin;
    IERC20  public immutable usdc;

    // Admin pre-registration (L2)
    mapping(bytes32 => bool)    public adminApproved;
    mapping(bytes32 => address) public expectedSeller;
    mapping(bytes32 => uint256) public expectedAmount;
    mapping(bytes32 => uint256) public expectedDueDate;
    mapping(bytes32 => uint256) public registeredYieldBps; // lender yield in bps

    // Core invoice data
    mapping(bytes32 => Invoice) private _invoices;

    // Pull-claim balances
    mapping(address => uint256) public pendingClaims;

    // ──────────────────────────────────────────────────────────── events ──

    event InvoiceRegistered(bytes32 indexed invoiceId, address indexed seller, uint256 amount, uint256 dueDate, uint256 yieldBps);
    event BuyerAcknowledged(bytes32 indexed invoiceId);
    event InvoiceFunded(bytes32 indexed invoiceId, address indexed lender, address indexed seller, uint256 amount, uint256 repaymentDeadline);
    event RepaymentApproved(bytes32 indexed invoiceId, address indexed seller, uint256 sellerAmount, address indexed lender, uint256 lenderAmount);
    event SettlementBlocked(bytes32 indexed invoiceId, string reason);
    event DirectRepayment(bytes32 indexed invoiceId, address indexed buyer, uint256 amount, uint256 discount);
    event PartialPaymentReceived(bytes32 indexed invoiceId, uint256 amountReceived, uint256 shortfallDeadline);
    event ShortfallCured(bytes32 indexed invoiceId);
    event LenderRefundClaimed(bytes32 indexed invoiceId, address indexed lender, uint256 amount);
    event DisputeFlagged(bytes32 indexed invoiceId);
    event DisputeResolved(bytes32 indexed invoiceId, bool refundLender, address indexed recipient, uint256 amount);
    event PendingClaimAdded(address indexed recipient, uint256 amount);
    event PlatformFeeCollected(bytes32 indexed invoiceId, uint256 amount);

    // ─────────────────────────────────────────────────────────── modifiers ──

    modifier onlyAdmin() {
        require(msg.sender == admin, "VestoEscrow: not admin");
        _;
    }

    modifier validAddress(address a) {
        require(a != address(0) && uint160(a) > 0x09, "VestoEscrow: invalid address");
        _;
    }

    // ──────────────────────────────────────────────────────── constructor ──

    constructor(address _admin, address _usdc)
        validAddress(_admin)
        validAddress(_usdc)
    {
        admin = _admin;
        usdc  = IERC20(_usdc);
    }

    // ─────────────────────────────────── L2: Admin invoice pre-registration ──

    /**
     * @notice Admin registers an invoice before it can be funded.
     * @param yieldBps  Lender yield in basis points (e.g. 1420 = 14.20%)
     */
    function adminRegisterInvoice(
        bytes32 invoiceId,
        address seller,
        uint256 amount,
        uint256 dueDate,
        uint256 yieldBps
    ) external onlyAdmin validAddress(seller) {
        require(amount > 0,                    "VestoEscrow: amount is zero");
        require(dueDate > block.timestamp,     "VestoEscrow: invalid due date");
        require(yieldBps <= 5000,              "VestoEscrow: yield exceeds 50%");
        require(!adminApproved[invoiceId],     "VestoEscrow: already registered");

        adminApproved[invoiceId]      = true;
        expectedSeller[invoiceId]     = seller;
        expectedAmount[invoiceId]     = amount;
        expectedDueDate[invoiceId]    = dueDate;
        registeredYieldBps[invoiceId] = yieldBps;

        emit InvoiceRegistered(invoiceId, seller, amount, dueDate, yieldBps);
    }

    // ──────────────────────────────────── L1: Buyer acknowledgement ──

    /**
     * @notice Records buyer acknowledgement. In V1 admin calls this on behalf of
     *         the buyer after verifying a signed email confirmation.
     *         In V2 the buyer signs directly with their wallet.
     */
    function acknowledgeBuyer(bytes32 invoiceId) external onlyAdmin {
        require(adminApproved[invoiceId],                           "VestoEscrow: not registered");
        Invoice storage inv = _invoices[invoiceId];
        require(inv.status == Status.Open,                         "VestoEscrow: not open");
        require(!inv.buyerAcknowledged,                            "VestoEscrow: already acknowledged");

        inv.buyerAcknowledged = true;
        inv.status = Status.BuyerAcknowledged;

        emit BuyerAcknowledged(invoiceId);
    }

    // ──────────────────────────────────────────── Lender funding ──

    /**
     * @notice Lender funds an invoice. Requires buyer acknowledgement (L1).
     */
    function fundInvoice(
        bytes32 invoiceId,
        address seller,
        uint256 amount
    ) external nonReentrant validAddress(seller) {
        require(uint160(msg.sender) > 0x09,        "VestoEscrow: invalid lender");
        require(amount > 0,                        "VestoEscrow: amount is zero");
        require(adminApproved[invoiceId],          "VestoEscrow: not admin-approved");
        require(seller == expectedSeller[invoiceId], "VestoEscrow: seller mismatch");
        require(amount == expectedAmount[invoiceId], "VestoEscrow: amount mismatch");

        Invoice storage inv = _invoices[invoiceId];
        // L1: buyer must have acknowledged
        require(inv.status == Status.BuyerAcknowledged, "VestoEscrow: buyer not acknowledged");
        require(inv.lender == address(0),           "VestoEscrow: already funded");

        uint256 dueDate = expectedDueDate[invoiceId];
        require(dueDate > block.timestamp,         "VestoEscrow: due date passed");

        // Compute yield and fee allocations
        uint256 yieldBps   = registeredYieldBps[invoiceId];
        uint256 lenderYield = (amount * yieldBps) / BPS_DENOM;
        uint256 platformFee = (amount * PLATFORM_FEE_BPS) / BPS_DENOM;

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        inv.seller             = seller;
        inv.lender             = msg.sender;
        inv.advanceAmount      = amount;
        inv.lenderYield        = lenderYield;
        inv.platformFee        = platformFee;
        inv.status             = Status.Funded;
        inv.fundedAt           = block.timestamp;
        inv.dueDate            = dueDate;
        inv.repaymentDeadline  = dueDate + GRACE_PERIOD; // L5 timer

        emit InvoiceFunded(invoiceId, msg.sender, seller, amount, inv.repaymentDeadline);
    }

    // ──────────────────────────────── L3/L4: Admin-triggered settlement ──

    /**
     * @notice Called by admin (or oracle relay) after BaaS webhook confirms full payment
     *         and the 24h buffer has elapsed with no block.
     *         For partial payments use approvePartialRepayment().
     */
    function approveRepayment(bytes32 invoiceId) external onlyAdmin nonReentrant {
        Invoice storage inv = _invoices[invoiceId];
        require(
            inv.status == Status.Funded || inv.status == Status.PaymentDetected,
            "VestoEscrow: invalid state for repayment"
        );
        require(inv.seller != address(0),  "VestoEscrow: invalid seller");
        require(inv.lender != address(0),  "VestoEscrow: invalid lender");

        _settleInvoice(invoiceId, inv, false);
    }

    /**
     * @notice Admin blocks a pending auto-settlement within the 24h buffer (L4).
     *         Moves invoice to Disputed for manual resolution.
     */
    function blockSettlement(bytes32 invoiceId, string calldata reason) external onlyAdmin {
        Invoice storage inv = _invoices[invoiceId];
        require(
            inv.status == Status.Funded || inv.status == Status.PaymentDetected,
            "VestoEscrow: cannot block in current state"
        );

        inv.status = Status.Disputed;

        emit SettlementBlocked(invoiceId, reason);
        emit DisputeFlagged(invoiceId);
    }

    // ──────────────────────────────────── L5: Escrow reversal timer ──

    /**
     * @notice Lender calls this after repaymentDeadline if buyer has not paid.
     *         Returns principal only; yield is forfeited on default.
     *         Requires no admin action — the safety net is trustless.
     */
    function claimRefund(bytes32 invoiceId) external nonReentrant {
        Invoice storage inv = _invoices[invoiceId];
        require(msg.sender == inv.lender,                      "VestoEscrow: not lender");
        require(inv.status == Status.Funded,                   "VestoEscrow: not in funded state");
        require(block.timestamp > inv.repaymentDeadline,       "VestoEscrow: deadline not passed");

        inv.status = Status.Defaulted;
        uint256 principal = inv.advanceAmount;

        pendingClaims[inv.lender] += principal;

        emit LenderRefundClaimed(invoiceId, inv.lender, principal);
        emit PendingClaimAdded(inv.lender, principal);
    }

    // ──────────────────────────────────── L6: USDC direct repayment ──

    /**
     * @notice Buyer repays directly in USDC — instant trustless settlement.
     *         A 0.5% fee discount is applied: the contract accepts
     *         `advanceAmount + lenderYield + discountedFee` from the buyer.
     *         No admin step required. No 24h buffer.
     */
    function buyerRepay(bytes32 invoiceId) external nonReentrant {
        Invoice storage inv = _invoices[invoiceId];
        require(inv.status == Status.Funded,      "VestoEscrow: not funded");
        require(block.timestamp <= inv.repaymentDeadline, "VestoEscrow: deadline passed");

        // Apply 0.5% discount to platform fee
        uint256 discountedFee = (inv.platformFee * (BPS_DENOM - USDC_FAST_DISCOUNT)) / BPS_DENOM;
        uint256 totalDue      = inv.advanceAmount + inv.lenderYield + discountedFee;
        uint256 discount      = inv.platformFee - discountedFee;

        usdc.safeTransferFrom(msg.sender, address(this), totalDue);

        emit DirectRepayment(invoiceId, msg.sender, totalDue, discount);

        _settleInvoice(invoiceId, inv, true);
    }

    // ──────────────────────────────────── L7: Partial payment handling ──

    /**
     * @notice Admin calls this when BaaS webhook reports a partial payment
     *         that is >= 50% of the required amount.
     *         Proportional lender capital is released immediately.
     *         Remaining shortfall enters a CURE_WINDOW cure period.
     * @param amountReceived  The USDC amount actually received (as reported by BaaS webhook)
     */
    function approvePartialRepayment(
        bytes32 invoiceId,
        uint256 amountReceived
    ) external onlyAdmin nonReentrant {
        Invoice storage inv = _invoices[invoiceId];
        require(inv.status == Status.Funded, "VestoEscrow: not funded");
        require(amountReceived > 0,          "VestoEscrow: zero amount");

        uint256 totalExpected = inv.advanceAmount + inv.lenderYield + inv.platformFee;
        uint256 pctBps        = (amountReceived * BPS_DENOM) / totalExpected;

        // Reject payments below 50% — likely fraud, trigger dispute
        require(pctBps >= PARTIAL_THRESHOLD, "VestoEscrow: payment below 50%, use flagDispute");

        if (pctBps >= BPS_DENOM) {
            // Full or over-payment — settle normally
            _settleInvoice(invoiceId, inv, false);
            return;
        }

        // Partial: release proportional lender principal + yield immediately
        uint256 lenderRelease   = ((inv.advanceAmount + inv.lenderYield) * pctBps) / BPS_DENOM;
        uint256 platformRelease = (inv.platformFee * pctBps) / BPS_DENOM;
        uint256 sellerRelease   = amountReceived - lenderRelease - platformRelease;
        if (sellerRelease > amountReceived) sellerRelease = 0; // underflow guard

        // Credit proportional claims
        if (lenderRelease > 0) {
            pendingClaims[inv.lender] += lenderRelease;
            emit PendingClaimAdded(inv.lender, lenderRelease);
        }
        if (sellerRelease > 0) {
            pendingClaims[inv.seller] += sellerRelease;
            emit PendingClaimAdded(inv.seller, sellerRelease);
        }
        if (platformRelease > 0) {
            pendingClaims[admin] += platformRelease;
            emit PlatformFeeCollected(invoiceId, platformRelease);
        }

        inv.partialPaid      += amountReceived;
        inv.shortfallDeadline = block.timestamp + CURE_WINDOW;
        inv.status            = Status.PartialShortfall;

        emit PartialPaymentReceived(invoiceId, amountReceived, inv.shortfallDeadline);
    }

    /**
     * @notice Admin calls this when the buyer cures the shortfall within the cure window.
     */
    function cureShortfall(bytes32 invoiceId) external onlyAdmin nonReentrant {
        Invoice storage inv = _invoices[invoiceId];
        require(inv.status == Status.PartialShortfall, "VestoEscrow: not in shortfall");
        require(block.timestamp <= inv.shortfallDeadline, "VestoEscrow: cure window expired");

        // Release remaining claims (already partially credited; this is the remainder)
        uint256 shortfall     = (inv.advanceAmount + inv.lenderYield + inv.platformFee) - inv.partialPaid;
        uint256 lenderRemainder  = shortfall > inv.lenderYield ? inv.lenderYield : shortfall;
        uint256 platformRemainder = inv.platformFee > 0 ? inv.platformFee - (inv.platformFee * inv.partialPaid / (inv.advanceAmount + inv.lenderYield + inv.platformFee)) : 0;

        if (lenderRemainder > 0) {
            pendingClaims[inv.lender] += lenderRemainder;
            emit PendingClaimAdded(inv.lender, lenderRemainder);
        }
        if (platformRemainder > 0) {
            pendingClaims[admin] += platformRemainder;
        }

        inv.status = Status.Settled;
        emit ShortfallCured(invoiceId);
    }

    // ─────────────────────────────────────── Dispute resolution ──

    function flagDispute(bytes32 invoiceId) external onlyAdmin {
        Invoice storage inv = _invoices[invoiceId];
        require(
            inv.status == Status.Funded ||
            inv.status == Status.PartialShortfall,
            "VestoEscrow: cannot dispute in current state"
        );
        inv.status = Status.Disputed;
        emit DisputeFlagged(invoiceId);
    }

    function resolveDispute(bytes32 invoiceId, bool refundLender) external onlyAdmin nonReentrant {
        Invoice storage inv = _invoices[invoiceId];
        require(inv.status == Status.Disputed, "VestoEscrow: not disputed");

        address recipient = refundLender ? inv.lender : inv.seller;
        require(uint160(recipient) > 0x09, "VestoEscrow: invalid recipient");

        inv.status = Status.Resolved;
        uint256 amount = inv.advanceAmount;
        pendingClaims[recipient] += amount;

        emit PendingClaimAdded(recipient, amount);
        emit DisputeResolved(invoiceId, refundLender, recipient, amount);
    }

    // ──────────────────────────────────────────── Pull claim ──

    /**
     * @notice Any party (seller, lender, admin) claims their allocated USDC.
     */
    function claimPayout() external nonReentrant {
        uint256 amount = pendingClaims[msg.sender];
        require(amount > 0, "VestoEscrow: no pending claim");
        pendingClaims[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, amount);
    }

    // ──────────────────────────────────────────── Views ──

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return _invoices[invoiceId];
    }

    function getRepaymentDeadline(bytes32 invoiceId) external view returns (uint256) {
        return _invoices[invoiceId].repaymentDeadline;
    }

    function isDefaulted(bytes32 invoiceId) external view returns (bool) {
        Invoice storage inv = _invoices[invoiceId];
        return inv.status == Status.Defaulted ||
               (inv.status == Status.Funded && block.timestamp > inv.repaymentDeadline);
    }

    // ──────────────────────────────────────────── Internal ──

    function _settleInvoice(bytes32 invoiceId, Invoice storage inv, bool applyDiscount) internal {
        uint256 fee        = applyDiscount
            ? (inv.platformFee * (BPS_DENOM - USDC_FAST_DISCOUNT)) / BPS_DENOM
            : inv.platformFee;
        uint256 lenderOut  = inv.advanceAmount + inv.lenderYield;
        uint256 sellerOut  = inv.advanceAmount > fee ? inv.advanceAmount - fee : 0;

        inv.status = Status.Settled;

        // Lender receives principal + yield
        if (lenderOut > 0) {
            pendingClaims[inv.lender] += lenderOut;
            emit PendingClaimAdded(inv.lender, lenderOut);
        }

        // Seller receives advance minus platform fee
        if (sellerOut > 0) {
            pendingClaims[inv.seller] += sellerOut;
            emit PendingClaimAdded(inv.seller, sellerOut);
        }

        // Admin collects platform fee
        if (fee > 0) {
            pendingClaims[admin] += fee;
            emit PlatformFeeCollected(invoiceId, fee);
        }

        emit RepaymentApproved(
            invoiceId,
            inv.seller, sellerOut,
            inv.lender,  lenderOut
        );
    }
}
