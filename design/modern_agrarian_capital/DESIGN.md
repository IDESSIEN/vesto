---
name: Modern Agrarian Capital
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#43474d'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#74777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#466080'
  primary: '#001d37'
  on-primary: '#ffffff'
  primary-container: '#16324f'
  on-primary-container: '#809abd'
  inverse-primary: '#aec9ed'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#2c1700'
  on-tertiary: '#ffffff'
  tertiary-container: '#482900'
  on-tertiary-container: '#d88500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#aec9ed'
  on-primary-fixed: '#001d37'
  on-primary-fixed-variant: '#2e4867'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffddbb'
  tertiary-fixed-dim: '#ffb868'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
  success-shamrock: '#059669'
  surface-card: '#ffffff'
  border-subtle: '#e2e8f0'
  border-strong: '#cbd5e1'
  warning-amber-soft: '#fef3c7'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  numeric-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  numeric-metric-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  spacing-2xs: 0.25rem
  spacing-xs: 0.5rem
  spacing-sm: 0.75rem
  spacing-md: 1rem
  spacing-lg: 1.25rem
  spacing-xl: 1.5rem
  spacing-2xl: 2rem
  spacing-3xl: 2.5rem
  gutter-mobile: 1rem
  margin-mobile: 1rem
  gutter-desktop: 1.5rem
  margin-desktop: 2rem
---

## Brand & Style

This design system targets micro-entrepreneurs, localized retail shopkeepers, and agricultural exporters who require rapid, non-predatory liquidity against issued invoices. The core visual philosophy unites institutional financial rigor with agricultural warmth—balancing deep, ink-like trust with natural, sunlit tones. The emotional experience balances dependability, momentum, and operational clarity. It avoids cold silicon-valley abstraction in favor of tactile certainty, high legibility under outdoor glare, and unambiguous verification markers.

The aesthetic fuses **Corporate/Modern fintech precision** with **Tactile micro-details**:
- Crisp, low-contrast hairline borders that mirror commercial ledgers.
- Warm, earthen paper-like surfaces instead of stark sterile whites.
- Tangible physical weight in cards and buttons, giving digital transactions the grounded certainty of a countersigned bill of lading.
- High-contrast typography paired with intuitive spatial groupings for fast assessment on low-cost or field-weathered mobile screens.

## Colors

The color architecture is built around functional hierarchy and high outdoor readability:

- **Primary (`#16324f` - Deep Space Blue)**: The bedrock color. Applied to authoritative headers, key numeric values, primary interactive CTA states, and active tab indicators. Communicates institutional permanence and safety.
- **Secondary (`#475569` - Blue Slate)**: Used for secondary labels, table headers, document metadata, non-active step trackers, and structural micro-dividers.
- **Tertiary (`#e08a00` - Amber Earth)**: The growth and tier accelerator. Applied to credit tier milestones, pending verification tags, action-required notifications, and dynamic loan progress trackers.
- **Neutral (`#faf8f5` - Bright Snow)**: The canvas ground. A warm, linen-adjacent tone that reduces eye strain under direct sun and differentiates the product from cold, sterile white-label banking software.
- **Success Shamrock (`#059669`)**: Reserved strictly for financial confirmation, cleared invoices, verified identity states, and unlocked payout balances. Never used decoratively.

Surface tiers utilize `#ffffff` on `#faf8f5` with fine hairline borders (`#e2e8f0`) to establish tactile card boundaries without harsh, heavy dropshadows.

## Typography

The typographic pairing balances approachable geometric clarity with utilitarian rigor:

- **Display & Headlines (`Plus Jakarta Sans`)**: Delivers friendly, modern authority. Its open apertures and structured geometries ensure that large sums, limit amounts, and tier progression titles feel optimistic and secure.
- **Body & Data Grid (`Inter`)**: Serves as the operational workhorse for multi-line invoice lists, breakdown terms, fee schedules, and input labels. Its neutral character and exceptional kerning optimize legibility on sub-optimal mobile viewports.
- **Tabular Figures & Metrics**: Currency values and limit gauges (`numeric-metric`) require `Plus Jakarta Sans` set with `tnum` (tabular lining figures) enabled via CSS feature settings to guarantee vertical alignment of decimal balances and currency symbols across lists.
- **Labeling Rule**: Uppercase micro-labels (`label-sm`) use an expanded letter spacing of `0.04em` to preserve scannability when denoting invoice statuses such as `VERIFIED`, `PENDING DISBURSAL`, or `OVERDUE`.

## Layout & Spacing

The layout is optimized for single-hand mobile operation in busy marketplace environments:

- **Grid Architecture**: Mobile viewports use a 4-column fluid layout with `16px` (`spacing-md`) screen gutters and an outer safe margin of `16px`. Desktop and tablet dashboards scale to an 8-column or 12-column layout bounded to a max-width of `720px` for focused financing flows, and `1140px` for multi-invoice ledger screens.
- **Vertical Rhythm**: Built upon a strict `4px` sub-grid and an `8px` dominant rhythm. Spacing between distinct financial sections must be `24px` (`spacing-xl`) or `32px` (`spacing-2xl`), while internal card components maintain an internal padding of `16px` to `20px` to maximize touch comfort.
- **Thumb Zone Design**: Primary action buttons, fast photo upload drawers, and confirmation sliders are pinned within the bottom 25% of the mobile viewport, complete with safe-area hardware insets.

## Elevation & Depth

Visual hierarchy emphasizes tactile structure through physical paper grounding and crisp layering rather than heavy ambient blur:

- **Surface Layering**: 
  - Canvas base sits at `#faf8f5`.
  - Actionable cards and entry surfaces rest on `#ffffff`.
  - Nested components (e.g., calculation breakdowns, document preview containers) sit on `#faf8f5` or tinted slate (`rgba(71, 85, 105, 0.04)`).
- **Hairline Framing**: Every elevated surface carries a crisp, 1px perimeter border using `#e2e8f0` (or `rgba(22, 50, 79, 0.08)`). This ensures sharp separation even when sunlight washes out display contrast.
- **Shadow System**:
  - **Flat / Base**: `border: 1px solid #e2e8f0; box-shadow: none;` (Default cards and lists).
  - **Raised / Interactive**: `box-shadow: 0 1px 3px 0 rgba(22, 50, 79, 0.06), 0 1px 2px -1px rgba(22, 50, 79, 0.04);` (Invoice rows, selectable limit tiers).
  - **Floating / Sheet**: `box-shadow: 0 10px 15px -3px rgba(22, 50, 79, 0.08), 0 4px 6px -4px rgba(22, 50, 79, 0.03);` (Bottom sheets, invoice capture viewfinders, confirmation dialogs).

## Shapes

The design system adopts a **Rounded** shape language (`roundedness: 2`):

- **Cards and Containers**: Bound to `12px` to `16px` radius (`rounded-lg` to `rounded-xl`). This softens complex financial data, making verification hurdles feel approachable while maintaining architectural order.
- **Buttons and Input Fields**: Constructed with a `10px` to `12px` corner radius, creating a comfortable, tap-friendly silhouette that matches modern mobile OS guidelines.
- **Pill Badges**: Status markers (`VERIFIED`, `IN REVIEW`), tier chips, and numerical step counters use full pill styling (`rounded-full` / `9999px`) to immediately distinguish meta information from interactive square-corner inputs.

## Components

### Buttons
- **Primary**: Solid Deep Space Blue (`#16324f`) background, `#ffffff` text, font weight 600, height 52px for mobile hit-target confidence. Active tap scale down to `0.98` with subtle tactile feedback.
- **Secondary / Outline**: 1.5px border in Blue Slate (`#475569`), transparent background, `#16324f` text.
- **Success / Cash-out**: Shamrock Green (`#059669`) background with white text, used strictly for "Withdraw Funds" and "Accept Advance".

### Cards & Limit Tiers
- **Invoice Overview Card**: White surface (`#ffffff`), 1px subtle border, 16px internal padding. Left edge features a 4px vertical status indicator bar (Shamrock Green for verified, Amber Earth for in-review).
- **Limit Tier Card**: Displays current limit progression (e.g., "$500 to $5,000"). Contains an embedded two-tone progress bar with background `rgba(71, 85, 105, 0.1)` and fill in `#e08a00` or `#059669`. Unlocked milestones use green checkmark medallions; locked milestones use light blue-slate padlocks.

### Stepped Verification Tracker
- Horizontal step flow with connected 2px path lines. Completed nodes are Shamrock Green with white checks; active nodes are Deep Space Blue with a pulsing amber outer ring; upcoming nodes are outlined in `#cbd5e1`.
- Step names are set in `label-sm` with active steps in `label-md` weight.

### Upload Dropzone & Camera Viewfinder
- High-contrast dashed border (`2px dashed #475569` at 40% opacity) on `#ffffff` canvas.
- Features dual action buttons: "Take Document Photo" and "Upload PDF/Receipt".
- Document Preview Mode: Replaces dropzone with a 4:3 cropped thumbnail, showing an extraction progress ring, document file name, detected invoice total, and a "Retake" button.

### Form Inputs & Checkboxes
- **Input Fields**: 48px height, 1px border (`#cbd5e1`), resting background `#ffffff`. Focused state transitions to a 2px Deep Space Blue outline with zero ambient bloom. Placeholder text sits in Blue Slate (`#475569`) at 60% opacity.
- **Checkboxes & Radios**: 20x20px dimension with 4px border radius. Selected state uses `#16324f` fill with an off-white crisp checkmark icon.

### Instructional Ledger Cards
- Informative micro-banners with Amber Earth soft background (`#fef3c7`), a 1px border (`#fde68a`), Deep Space Blue typography, and concise copy detailing required shipping documents or payment settlement terms.