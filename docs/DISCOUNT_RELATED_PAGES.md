# Discount-related pages

Snapshot: 2026-09-14 after Fleet release. Includes directly connected fields, sample report layouts and disabled rebate fields.

| Page / section | Discount-related use | Current connection | Source |
|---|---|---|---|
| Price Book → Items → Add/Edit Item | Unit/case gross cost, Discount and calculated net cost. | Connected | [ItemsPage.tsx](../Frontend/src/components/pricebook/ItemsPage.tsx) |
| Price Book → Bulk update | Purchase discounts, item pricing and assignment to existing promotions/price groups. | Connected | [BulkUpdatePage.tsx](../Frontend/src/components/pricebook/BulkUpdatePage.tsx) |
| Price Book → Promotions | Create/edit/deactivate promotion definitions and selected items. | Connected definitions; actual POS execution is separate | [PromotionsPage.tsx](../Frontend/src/components/pricebook/PromotionsPage.tsx) |
| Price Book → Price groups | Shared selling price for grouped items; related pricing, not necessarily a discount. | Connected | [PriceGroupsPage.tsx](../Frontend/src/components/pricebook/PriceGroupsPage.tsx) |
| Price Book → Vendor management → Contracts | Volume Discount amount/type. Rebate Linkage field is disabled. | Discount fields connected; rebate linkage disabled | [VendorContracts.tsx](../Frontend/src/components/grocery/VendorContracts.tsx) |
| Price Book → Vendor management → Vendor profile | Rebate Programs links/summary in vendor profile. | Sample/profile UI references; not a persisted rebate program ledger | [VendorProfile.tsx](../Frontend/src/components/grocery/VendorProfile.tsx) |
| Grocery → Edit & view invoices → manual/edit invoice | Invoice Discount; Rebate Ref is disabled. | Invoice discount connected; rebate reference disabled | [OrdersInvoices.tsx](../Frontend/src/components/grocery/OrdersInvoices.tsx) |
| Grocery → Edit & view invoices → View Invoice | Saved Discount in Additional Charges. | Connected | [ViewInvoice.tsx](../Frontend/src/components/grocery/ViewInvoice.tsx) |
| Live Activity / Live Counter → transaction details | Discount markers and amounts on recorded receipts/items. | Connected to recorded sales | [LiveCounterPage.tsx](../Frontend/src/components/live-counter/LiveCounterPage.tsx) |
| Everyday Closing Reports → business date details | Stored discount totals in closing data; Purchase Rebates field is blank. | Discount aggregation connected; Purchase Rebates placeholder | [MoneyInSection.tsx](../Frontend/src/components/closing/store-edit/MoneyInSection.tsx) |
| Tender Types → Fleet cards | Statement discount, fee and expected/received settlement. | Connected and released 2026-09-14 | [FleetCardsPage.tsx](../Frontend/src/components/tender/fleet-cards/FleetCardsPage.tsx) |
| Price Book → Rebate management → Programs / program details | Rebate rates, qualifying rules and item selection; Add Rebate Program. | Sample/local UI, not connected to a rebate database ledger | [RebateManagementPage.tsx](../Frontend/src/components/grocery/rebate/RebateManagementPage.tsx) |
| Price Book → Rebate management → Rebate Items | Item rebate information. | Sample/local UI | [RebateItemsPage.tsx](../Frontend/src/components/grocery/rebate/RebateItemsPage.tsx) |
| Price Book → Rebate management → Claims & Payments | Claim/payment workflow layout. | Sample/local UI | [RebateClaimsPaymentsPage.tsx](../Frontend/src/components/grocery/rebate/RebateClaimsPaymentsPage.tsx) |
| Price Book → Rebate management → Rebate Reports | Rebate reporting layout. | Sample/local UI | [RebateReportsPage.tsx](../Frontend/src/components/grocery/rebate/RebateReportsPage.tsx) |
| Grocery → Reports → Purchase Invoice Summary | Rebate totals and invoice-detail rebate amount. | Sample report | [PurchaseInvoiceReport.tsx](../Frontend/src/components/grocery/reports/PurchaseInvoiceReport.tsx) |
| Grocery → Reports → Single Item Purchase History | Rebate and net cost by invoice/item. | Sample report | [SingleItemPurchaseHistory.tsx](../Frontend/src/components/grocery/reports/SingleItemPurchaseHistory.tsx) |
| Grocery → Reports → Profit → margin view | Rebate impact by item/department/vendor. | Sample report | [ProfitMarginView.tsx](../Frontend/src/components/grocery/reports/ProfitMarginView.tsx) |
| Grocery → Inventory adjustment | Rebate and related margin columns exist; API mapping currently leaves rebate blank. | Inventory is connected; rebate values are blank | [StockAdjustments.tsx](../Frontend/src/components/grocery/StockAdjustments.tsx) |
| Sales and Performance Reports → POS report → Department Sales | Discount and Promotions columns in department summary. | Sample report | [PosReportsHub.tsx](../Frontend/src/components/reports/pos-report/PosReportsHub.tsx) |
| Sales and Performance Reports → POS report → Gas Sales | Discount columns in summary/date/day-of-week/month views. | Sample report | [PosReportsHub.tsx](../Frontend/src/components/reports/pos-report/PosReportsHub.tsx) |
| Sales and Performance Reports → Net worth | Vendor Rebates Receivable. | Sample report | [NetWorthPage.tsx](../Frontend/src/components/reports/NetWorthPage.tsx) |
| Gas → Gas price → Record Price Change | Promotion option as the reason for a manual price change. | Connected reason label only | [RecordPriceChangeDrawer.tsx](../Frontend/src/components/gas/price/RecordPriceChangeDrawer.tsx) |

Full schema and source appendix: [Database inventory](DISCOUNT_PROMOTION_REBATE_DATABASE.md).
