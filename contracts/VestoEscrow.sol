// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VestoEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Open,
        Funded,
        Repaid,
        Disputed,
        Resolved
    }

    struct Invoice {
        address seller;
        address lender;
        uint256 advanceAmount;
        Status status;
        uint256 fundedAt;
        uint256 dueDate;
    }

    address public immutable admin;
    IERC20 public immutable usdc;

    mapping(bytes32 invoiceId => Invoice) private invoices;
    mapping(bytes32 invoiceId => bool) public adminApproved;
    mapping(bytes32 invoiceId => address) public expectedSeller;
    mapping(bytes32 invoiceId => uint256) public expectedAmount;
    mapping(bytes32 invoiceId => uint256) public expectedDueDate;
    mapping(address recipient => uint256 amount) public pendingClaims;

    event InvoiceFunded(bytes32 indexed invoiceId, address indexed lender, address indexed seller, uint256 amount, uint256 dueDate);
    event RepaymentApproved(bytes32 indexed invoiceId, address indexed seller, uint256 amount);
    event DisputeFlagged(bytes32 indexed invoiceId);
    event DisputeResolved(bytes32 indexed invoiceId, bool refundLender, address recipient, uint256 amount);
    event PendingClaimAdded(address indexed recipient, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "VestoEscrow: caller is not admin");
        _;
    }

    constructor(address _admin, address _usdc) {
        require(_admin != address(0), "VestoEscrow: admin is zero address");
        require(_usdc != address(0), "VestoEscrow: usdc is zero address");

        admin = _admin;
        usdc = IERC20(_usdc);
    }

    function adminRegisterInvoice(bytes32 invoiceId, address seller, uint256 amount, uint256 dueDate) external onlyAdmin {
        require(seller != address(0) && uint160(seller) > 0x09, "VestoEscrow: invalid seller address");
        require(amount > 0, "VestoEscrow: amount is zero");
        require(dueDate > block.timestamp, "VestoEscrow: invalid due date");

        adminApproved[invoiceId] = true;
        expectedSeller[invoiceId] = seller;
        expectedAmount[invoiceId] = amount;
        expectedDueDate[invoiceId] = dueDate;
    }

    function fundInvoice(bytes32 invoiceId, address seller, uint256 amount) external nonReentrant {
        require(seller != address(0) && uint160(seller) > 0x09, "VestoEscrow: invalid seller address");
        require(uint160(msg.sender) > 0x09, "VestoEscrow: invalid lender address");
        require(amount > 0, "VestoEscrow: amount is zero");
        require(adminApproved[invoiceId], "VestoEscrow: not admin-approved");
        require(seller == expectedSeller[invoiceId], "VestoEscrow: seller mismatch");
        require(amount == expectedAmount[invoiceId], "VestoEscrow: amount mismatch");

        uint256 dueDate = expectedDueDate[invoiceId];
        require(dueDate > block.timestamp, "VestoEscrow: invalid due date");

        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == Status.Open, "VestoEscrow: invoice not open");
        require(invoice.lender == address(0), "VestoEscrow: invoice already funded");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        invoice.seller = seller;
        invoice.lender = msg.sender;
        invoice.advanceAmount = amount;
        invoice.status = Status.Funded;
        invoice.fundedAt = block.timestamp;
        invoice.dueDate = dueDate;

        emit InvoiceFunded(invoiceId, msg.sender, seller, amount, dueDate);
    }

    function approveRepayment(bytes32 invoiceId) external onlyAdmin nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == Status.Funded, "VestoEscrow: invoice not funded");
        require(invoice.seller != address(0) && uint160(invoice.seller) > 0x09, "VestoEscrow: invalid seller address");

        invoice.status = Status.Repaid;
        pendingClaims[invoice.seller] += invoice.advanceAmount;

        emit PendingClaimAdded(invoice.seller, invoice.advanceAmount);
        emit RepaymentApproved(invoiceId, invoice.seller, invoice.advanceAmount);
    }

    function flagDispute(bytes32 invoiceId) external onlyAdmin {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == Status.Funded, "VestoEscrow: invoice not funded");

        invoice.status = Status.Disputed;

        emit DisputeFlagged(invoiceId);
    }

    function resolveDispute(bytes32 invoiceId, bool refundLender) external onlyAdmin nonReentrant {
        Invoice storage invoice = invoices[invoiceId];
        require(invoice.status == Status.Disputed, "VestoEscrow: invoice not disputed");

        address recipient = refundLender ? invoice.lender : invoice.seller;
        require(recipient != address(0) && uint160(recipient) > 0x09, "VestoEscrow: invalid recipient address");

        invoice.status = Status.Resolved;
        pendingClaims[recipient] += invoice.advanceAmount;

        emit PendingClaimAdded(recipient, invoice.advanceAmount);
        emit DisputeResolved(invoiceId, refundLender, recipient, invoice.advanceAmount);
    }

    function claimPayout() external nonReentrant {
        uint256 amount = pendingClaims[msg.sender];
        require(amount > 0, "VestoEscrow: no pending claim");

        pendingClaims[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, amount);
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }
}
