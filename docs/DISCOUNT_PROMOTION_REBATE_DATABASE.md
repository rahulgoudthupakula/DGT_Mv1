# Discount, promotion and rebate inventory

Snapshot: **2026-09-14, after Fleet production release**. Source: live PostgreSQL database **dgt**, public schema, plus current frontend/backend source. Metadata only; no customer, payment or credential records are exported.

This is a current-state inventory, not a pending-work document. No pending document was updated.

The database has **109 tables**. This document lists **all columns of 13 directly matching discount/promotion/rebate or price-group tables**, plus **10 supporting tables**. Tables were selected from a scan of every public column name and table name, then supplemented by related payment, invoice, cost and audit structures. Generic JSON/text payload contents were not scanned; their possible content is not asserted as dedicated schema.

## Important distinctions

- Purchase discount reduces item/vendor acquisition cost; invoice discount reduces the invoice amount; sales discount reduces a customer's sale; Fleet statement discount reduces the settlement. These are separate amounts and must not be added together as one discount.
- Promotions and price groups are definitions/pricing rules. Recorded sales discounts are in sales and sales_items. No per-sale-line promotion link exists in the inspected schema.
- **No dedicated rebate program, rebate item, rebate accrual, rebate claim or rebate payment table exists in dgt.** The existing product_store_prices.rebate_id is nullable and has no rebate foreign key. Rebate screens and report figures must not be mistaken for database-backed rebate records.
- **vendor_contacts stores contracts**, including volume discount fields. It is not named vendor_contracts in this database.
- Price-group selling price is related pricing, not automatically a discount. Fuel price reason “Promotion” is a label, not an automatic promotion rule.
- “Connected” below describes the noted fields; it does not mean every feature on that page is connected. Some report/rebate pages remain restricted by the app's layout-only guard.

## Pages and sections

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

### Older or non-routed source components

These also mention the subject but are not additional active routes in Index.tsx: grocery/OrderGuide.tsx (“Include Promotions”, replaced by Purchase Orders), grocery/RebateManagement.tsx, rebate/RebateAccrualPage.tsx, RebateControlsPage.tsx, RebateClaimsPage.tsx and RebatePaymentsPage.tsx. Shared tables, drawers and banners are included in the source-reference appendix below, not counted again as separate pages.

## Database table overview

| Table | Scope | Why included | Columns |
|---|---|---|---:|
| `everyday_closing` | Direct / related pricing | Daily total_discounts and the saved sales_snapshot. This aggregates recorded discounts; it is not a separate promotion engine. | 36 |
| `fleet_batches` | Direct / related pricing | Fleet statement_discount is an additional processor-statement deduction. It must not repeat discounts already included in POS sales. | 25 |
| `grocery_invoice_items` | Direct / related pricing | Invoice-line quantity, cost, discount and total fields. Column existence does not mean every field is editable in the current invoice UI. | 16 |
| `invoice_charges` | Direct / related pricing | Invoice-wide discounted_amount and charges used by manual/edit/view invoice workflows. | 14 |
| `price_groups` | Direct / related pricing | Shared group selling price. This is related pricing, not necessarily a discount. | 10 |
| `product_price_groups` | Direct / related pricing | Links items to their store price group; the item retains its individual selling price. | 7 |
| `product_store_prices` | Direct / related pricing | Individual item selling price and a nullable rebate_id field. There is no rebate table or foreign key for rebate_id in the inspected database. | 8 |
| `products` | Direct / related pricing | Item/case purchase cost and purchase discount. Net cost is derived from gross cost minus the discount for the selected purchase unit. | 19 |
| `promotion_products` | Direct / related pricing | Selected products and required quantities for promotions, including bundles and mix-and-match selection. | 7 |
| `promotions` | Direct / related pricing | Store promotion definitions, dates, discount value and buy/free quantities. These define offers; they do not prove a POS applied an offer. | 15 |
| `sales` | Direct / related pricing | Recorded receipt-level discount_amount alongside subtotal, tax and final amount. | 17 |
| `sales_items` | Direct / related pricing | Recorded line discount_amount with catalog/actual prices, gross amount and line total. No promotion_id or rebate_id on these sale lines. | 12 |
| `vendor_contacts` | Direct / related pricing | Despite the name, this table stores vendor CONTRACTS, including volume_discount_value, volume_discount_type and contract_type. | 17 |
| `invoices` | Supporting | Parent invoice identity, store, vendor, dates and PO link for invoice discounts. | 18 |
| `invoice_adjustments` | Supporting | Generic invoice adjustment records. No specifically named rebate/discount field; included as related financial context. | 7 |
| `sale_payments` | Supporting | Tender payments underlying sales and settlement batches. Does not itself store promotion or discount amounts. | 12 |
| `tender_types` | Supporting | Payment method dictionary, used with sale_payments. | 6 |
| `fleet_batch_payments` | Supporting | Exact source payments for Fleet batches and their statement discounts; duplicate payment membership is prohibited. | 3 |
| `product_vendors` | Supporting | Vendor/item relationship and cost context; not a discount-program definition. | 13 |
| `vendor_item_cost_history` | Supporting | Cost change history; not a separate rebate entitlement or payment ledger. | 11 |
| `vendor_audit_log` | Supporting | Vendor changes recorded as audit data; not an independent discount amount ledger. | 8 |
| `access_audit_events` | Supporting | Generic change history, including Fleet and promotion changes in structured audit payloads. | 9 |
| `fuel_prices` | Supporting | Gas price records can use Promotion as a change reason. This is a reason label, not automatic promotional pricing. | 10 |

## Complete columns and constraints

Column types, nullability, defaults and constraints below come directly from the live database. “YES” under Nullable means NULL is permitted.

### everyday_closing

Daily total_discounts and the saved sales_snapshot. This aggregates recorded discounts; it is not a separate promotion engine.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `everyday_closing_id` | bigint | NO | nextval('everyday_closing_everyday_closing_id_seq'::regclass) |
| 2 | `dgt_id` | character varying(50) | NO | — |
| 3 | `opening_datetime` | timestamp with time zone | NO | — |
| 4 | `closing_datetime` | timestamp with time zone | NO | — |
| 5 | `total_gross_sales` | numeric(12,2) | NO | 0 |
| 6 | `total_discounts` | numeric(12,2) | NO | 0 |
| 7 | `total_tax` | numeric(12,2) | NO | 0 |
| 8 | `total_net_sales` | numeric(12,2) | NO | 0 |
| 9 | `total_refunds` | numeric(12,2) | NO | 0 |
| 10 | `expected_cash` | numeric(12,2) | NO | 0 |
| 11 | `actual_cash` | numeric(12,2) | NO | 0 |
| 12 | `cash_variance` | numeric(12,2) | NO | 0 |
| 13 | `total_deposits` | numeric(12,2) | NO | 0 |
| 14 | `closed_by` | bigint | NO | — |
| 15 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 16 | `business_date` | date | NO | — |
| 17 | `closing_status` | character varying(16) | NO | 'CLOSED'::character varying |
| 18 | `opening_cash` | numeric(14,2) | NO | 0 |
| 19 | `cash_added` | numeric(14,2) | NO | 0 |
| 20 | `cash_drops` | numeric(14,2) | NO | 0 |
| 21 | `notes` | text | NO | ''::text |
| 22 | `is_sample` | boolean | NO | false |
| 23 | `sales_snapshot` | jsonb | YES | — |
| 24 | `opening_checks` | numeric(12,2) | YES | — |
| 25 | `closing_checks` | numeric(12,2) | YES | — |
| 26 | `card_jobber_settlement` | numeric(12,2) | YES | — |
| 27 | `card_bank_settlement` | numeric(12,2) | YES | — |
| 28 | `lottery_online_sales` | numeric(12,2) | YES | — |
| 29 | `lottery_online_cash` | numeric(12,2) | YES | — |
| 30 | `lottery_scratch_cash` | numeric(12,2) | YES | — |
| 31 | `lottery_settlement` | numeric(12,2) | YES | — |
| 32 | `lottery_adjustment` | numeric(12,2) | YES | — |
| 33 | `lottery_online_credit` | numeric(12,2) | YES | — |
| 34 | `lottery_scratch_credit` | numeric(12,2) | YES | — |
| 35 | `lottery_commission` | numeric(12,2) | YES | — |
| 36 | `lottery_balance` | numeric(12,2) | YES | — |

Constraints:

- `everyday_closing_cash_added_check`: `CHECK ((cash_added >= (0)::numeric))`
- `everyday_closing_cash_drops_check`: `CHECK ((cash_drops >= (0)::numeric))`
- `everyday_closing_closed_by_fkey`: `FOREIGN KEY (closed_by) REFERENCES users(user_id)`
- `everyday_closing_closing_checks_check`: `CHECK ((closing_checks >= (0)::numeric))`
- `everyday_closing_closing_status_check`: `CHECK (((closing_status)::text = ANY ((ARRAY['DRAFT'::character varying, 'CLOSED'::character varying])::text[])))`
- `everyday_closing_dgt_id_fkey`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `everyday_closing_opening_cash_check`: `CHECK ((opening_cash >= (0)::numeric))`
- `everyday_closing_opening_checks_check`: `CHECK ((opening_checks >= (0)::numeric))`
- `everyday_closing_pkey`: `PRIMARY KEY (everyday_closing_id)`

### fleet_batches

Fleet statement_discount is an additional processor-statement deduction. It must not repeat discounts already included in POS sales.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `batch_id` | bigint | NO | — |
| 2 | `dgt_id` | character varying(50) | NO | — |
| 3 | `provider_name` | character varying(120) | NO | — |
| 4 | `batch_reference` | character varying(100) | NO | — |
| 5 | `business_date` | date | NO | — |
| 6 | `source_kind` | character varying(20) | NO | 'MANUAL_GROUP'::character varying |
| 7 | `status` | character varying(12) | NO | 'OPEN'::character varying |
| 8 | `fleet_sales` | numeric(14,2) | NO | — |
| 9 | `gallons_sold` | numeric(16,3) | YES | — |
| 10 | `fuel_sales` | numeric(14,2) | YES | — |
| 11 | `volume_note` | character varying(1000) | YES | — |
| 12 | `transaction_count` | integer | NO | — |
| 13 | `statement_discount` | numeric(14,2) | YES | — |
| 14 | `processor_fee` | numeric(14,2) | YES | — |
| 15 | `actual_deposit` | numeric(14,2) | YES | — |
| 16 | `settlement_date` | date | YES | — |
| 17 | `settlement_reference` | character varying(160) | YES | — |
| 18 | `variance_review_note` | character varying(1000) | YES | — |
| 19 | `notes` | character varying(2000) | YES | — |
| 20 | `created_by` | bigint | NO | — |
| 21 | `settled_by` | bigint | YES | — |
| 22 | `reconciled_by` | bigint | YES | — |
| 23 | `request_key` | uuid | NO | — |
| 24 | `created_at` | timestamp with time zone | NO | now() |
| 25 | `updated_at` | timestamp with time zone | NO | now() |

Constraints:

- `fleet_batches_batch_reference_check`: `CHECK ((length(TRIM(BOTH FROM batch_reference)) > 0))`
- `fleet_batches_check`: `CHECK (((gallons_sold IS NULL) = (fuel_sales IS NULL)))`
- `fleet_batches_check1`: `CHECK (((gallons_sold IS NOT NULL) OR (COALESCE(length(TRIM(BOTH FROM volume_note)), 0) > 0)))`
- `fleet_batches_check2`: `CHECK (((settlement_date IS NULL) OR (settlement_date >= business_date)))`
- `fleet_batches_check3`: `CHECK ((((status)::text = 'OPEN'::text) OR ((statement_discount IS NOT NULL) AND (processor_fee IS NOT NULL) AND (actual_deposit IS NOT NULL) AND (settlement_date IS NOT NULL) AND (COALESCE(length(TRIM(BOTH FROM settlement_reference)), 0) > 0) AND (settled_by IS NOT NULL))))`
- `fleet_batches_check4`: `CHECK ((((status)::text <> 'RECONCILED'::text) OR ((reconciled_by IS NOT NULL) AND ((actual_deposit = ((fleet_sales - statement_discount) - processor_fee)) OR (COALESCE(length(TRIM(BOTH FROM variance_review_note)), 0) > 0)))))`
- `fleet_batches_created_by_fkey`: `FOREIGN KEY (created_by) REFERENCES users(user_id)`
- `fleet_batches_dgt_id_fkey`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `fleet_batches_dgt_id_request_key_key`: `UNIQUE (dgt_id, request_key)`
- `fleet_batches_pkey`: `PRIMARY KEY (batch_id)`
- `fleet_batches_processor_fee_check`: `CHECK ((processor_fee >= (0)::numeric))`
- `fleet_batches_provider_name_check`: `CHECK ((length(TRIM(BOTH FROM provider_name)) > 0))`
- `fleet_batches_reconciled_by_fkey`: `FOREIGN KEY (reconciled_by) REFERENCES users(user_id)`
- `fleet_batches_settled_by_fkey`: `FOREIGN KEY (settled_by) REFERENCES users(user_id)`
- `fleet_batches_source_kind_check`: `CHECK (((source_kind)::text = ANY ((ARRAY['MANUAL_GROUP'::character varying, 'POS_BATCH'::character varying])::text[])))`
- `fleet_batches_statement_discount_check`: `CHECK ((statement_discount >= (0)::numeric))`
- `fleet_batches_status_check`: `CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'SETTLED'::character varying, 'RECONCILED'::character varying])::text[])))`
- `fleet_batches_transaction_count_check`: `CHECK ((transaction_count >= 0))`

### grocery_invoice_items

Invoice-line quantity, cost, discount and total fields. Column existence does not mean every field is editable in the current invoice UI.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `grocery_invoice_item_id` | bigint | NO | nextval('grocery_invoice_items_grocery_invoice_item_id_seq'::regclass) |
| 2 | `invoice_id` | bigint | NO | — |
| 3 | `product_id` | bigint | NO | — |
| 4 | `vendor_item_code` | character varying(100) | YES | — |
| 5 | `quantity` | numeric(12,3) | NO | — |
| 6 | `unit_type` | character varying(50) | NO | — |
| 7 | `case_pack_quantity` | numeric(12,3) | YES | — |
| 8 | `unit_cost` | numeric(12,2) | NO | — |
| 9 | `item_line_discount` | numeric(12,2) | NO | 0 |
| 10 | `item_line_total` | numeric(12,2) | NO | — |
| 11 | `is_product_new` | boolean | NO | false |
| 12 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 13 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 14 | `msrp` | numeric(12,2) | YES | — |
| 15 | `received_quantity` | numeric(12,3) | YES | — |
| 16 | `line_tax` | numeric(12,2) | NO | 0 |

Constraints:

- `grocery_invoice_items_invoice_id_fkey`: `FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)`
- `grocery_invoice_items_line_tax_check`: `CHECK ((line_tax >= (0)::numeric))`
- `grocery_invoice_items_msrp_check`: `CHECK ((msrp >= (0)::numeric))`
- `grocery_invoice_items_pkey`: `PRIMARY KEY (grocery_invoice_item_id)`
- `grocery_invoice_items_product_id_fkey`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `grocery_invoice_items_received_quantity_check`: `CHECK ((received_quantity >= (0)::numeric))`

### invoice_charges

Invoice-wide discounted_amount and charges used by manual/edit/view invoice workflows.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `invoice_charge_id` | bigint | NO | nextval('invoice_charges_invoice_charge_id_seq'::regclass) |
| 2 | `invoice_id` | bigint | NO | — |
| 3 | `charge_type` | character varying(50) | NO | — |
| 4 | `sub_total` | numeric(12,2) | NO | — |
| 5 | `discounted_amount` | numeric(12,2) | NO | 0 |
| 6 | `other_charges` | numeric(12,2) | NO | 0 |
| 7 | `total_amount` | numeric(12,2) | NO | — |
| 8 | `status_id` | bigint | NO | — |
| 9 | `payment_status` | character varying(50) | NO | — |
| 10 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 11 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 12 | `freight_amount` | numeric(12,2) | NO | 0 |
| 13 | `fuel_surcharge` | numeric(12,2) | NO | 0 |
| 14 | `handling_fee` | numeric(12,2) | NO | 0 |

Constraints:

- `invoice_charges_freight_amount_check`: `CHECK ((freight_amount >= (0)::numeric))`
- `invoice_charges_fuel_surcharge_check`: `CHECK ((fuel_surcharge >= (0)::numeric))`
- `invoice_charges_handling_fee_check`: `CHECK ((handling_fee >= (0)::numeric))`
- `invoice_charges_invoice_id_fkey`: `FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)`
- `invoice_charges_pkey`: `PRIMARY KEY (invoice_charge_id)`
- `invoice_charges_status_id_fkey`: `FOREIGN KEY (status_id) REFERENCES status_types(status_type_id)`

### price_groups

Shared group selling price. This is related pricing, not necessarily a discount.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `price_group_id` | bigint | NO | nextval('price_groups_price_group_id_seq'::regclass) |
| 2 | `price_group_name` | character varying(150) | NO | — |
| 3 | `description` | character varying(500) | YES | — |
| 4 | `is_active` | boolean | NO | true |
| 5 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 6 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 7 | `group_price` | numeric(12,2) | NO | — |
| 8 | `dgt_id` | character varying(50) | NO | — |
| 9 | `creation_key` | uuid | YES | — |
| 10 | `creation_payload` | jsonb | YES | — |

Constraints:

- `chk_price_groups_group_price`: `CHECK ((group_price >= (0)::numeric))`
- `fk_price_groups_store`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `price_group_create_key`: `UNIQUE (dgt_id, creation_key)`
- `price_group_store_key`: `UNIQUE (price_group_id, dgt_id)`
- `price_groups_pkey`: `PRIMARY KEY (price_group_id)`
- `uq_price_groups_store_name`: `UNIQUE (dgt_id, price_group_name)`

### product_price_groups

Links items to their store price group; the item retains its individual selling price.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `product_price_group_id` | bigint | NO | nextval('product_price_groups_product_price_group_id_seq'::regclass) |
| 2 | `price_group_id` | bigint | NO | — |
| 3 | `product_id` | bigint | NO | — |
| 4 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 5 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 6 | `dgt_id` | character varying(50) | NO | — |
| 7 | `is_active` | boolean | NO | true |

Constraints:

- `fk_product_price_groups_price_group`: `FOREIGN KEY (price_group_id) REFERENCES price_groups(price_group_id)`
- `fk_product_price_groups_product`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `price_group_link_store`: `FOREIGN KEY (price_group_id, dgt_id) REFERENCES price_groups(price_group_id, dgt_id)`
- `price_group_product_store`: `FOREIGN KEY (product_id, dgt_id) REFERENCES products(product_id, dgt_id)`
- `product_price_groups_pkey`: `PRIMARY KEY (product_price_group_id)`
- `uq_product_price_groups`: `UNIQUE (price_group_id, product_id)`

### product_store_prices

Individual item selling price and a nullable rebate_id field. There is no rebate table or foreign key for rebate_id in the inspected database.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `store_price_id` | bigint | NO | nextval('product_store_prices_store_price_id_seq'::regclass) |
| 2 | `dgt_id` | character varying(50) | NO | — |
| 3 | `product_id` | bigint | NO | — |
| 4 | `retail_price` | numeric(12,2) | NO | — |
| 5 | `is_active` | boolean | NO | true |
| 6 | `rebate_id` | bigint | YES | — |
| 7 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 8 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `chk_product_store_prices_retail_price`: `CHECK ((retail_price >= (0)::numeric))`
- `fk_product_store_prices_product`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `fk_product_store_prices_store`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `pricebook_price_product_store_fk`: `FOREIGN KEY (product_id, dgt_id) REFERENCES products(product_id, dgt_id)`
- `product_store_prices_pkey`: `PRIMARY KEY (store_price_id)`
- `uq_product_store_prices_store_product`: `UNIQUE (dgt_id, product_id)`

### products

Item/case purchase cost and purchase discount. Net cost is derived from gross cost minus the discount for the selected purchase unit.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `product_id` | bigint | NO | nextval('products_product_id_seq'::regclass) |
| 2 | `store_sub_department_id` | bigint | NO | — |
| 3 | `product_name` | character varying(200) | NO | — |
| 4 | `product_sku` | character varying(100) | NO | — |
| 5 | `is_returnable` | boolean | NO | false |
| 6 | `brand_id` | bigint | YES | — |
| 7 | `unit_of_measure` | character varying(50) | YES | — |
| 8 | `is_active` | boolean | NO | true |
| 9 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 10 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 11 | `is_taxable` | boolean | NO | true |
| 12 | `is_ebt` | boolean | NO | false |
| 13 | `dgt_id` | character varying(50) | NO | — |
| 14 | `is_age_restricted` | boolean | YES | — |
| 15 | `reorder_level` | numeric(12,3) | YES | — |
| 16 | `purchase_unit` | character varying(10) | YES | — |
| 17 | `units_per_case` | integer | YES | — |
| 18 | `purchase_gross_cost` | numeric(12,2) | YES | — |
| 19 | `purchase_discount` | numeric(12,2) | YES | — |

Constraints:

- `fk_products_brand`: `FOREIGN KEY (brand_id) REFERENCES brands(brand_id)`
- `fk_products_store_sub_department`: `FOREIGN KEY (store_sub_department_id) REFERENCES store_sub_departments(store_sub_department_id)`
- `pricebook_case_quantity`: `CHECK (((units_per_case IS NULL) OR (units_per_case > 0)))`
- `pricebook_product_department_fk`: `FOREIGN KEY (store_sub_department_id, dgt_id) REFERENCES store_sub_departments(store_sub_department_id, dgt_id)`
- `pricebook_product_store_fk`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `pricebook_product_store_key`: `UNIQUE (product_id, dgt_id)`
- `pricebook_purchase_basis`: `CHECK ((((purchase_gross_cost IS NULL) OR (purchase_unit IS NOT NULL)) AND (((purchase_unit)::text IS DISTINCT FROM 'CASE'::text) OR (units_per_case IS NOT NULL))))`
- `pricebook_purchase_cost`: `CHECK ((((purchase_gross_cost IS NULL) AND (purchase_discount IS NULL)) OR ((purchase_gross_cost IS NOT NULL) AND (purchase_discount IS NOT NULL) AND (purchase_gross_cost >= (0)::numeric) AND (purchase_discount >= (0)::numeric) AND (purchase_discount <= purchase_gross_cost))))`
- `pricebook_purchase_unit`: `CHECK (((purchase_unit IS NULL) OR ((purchase_unit)::text = ANY ((ARRAY['ITEM'::character varying, 'CASE'::character varying])::text[]))))`
- `pricebook_reorder_nonnegative`: `CHECK (((reorder_level IS NULL) OR (reorder_level >= (0)::numeric)))`
- `products_pkey`: `PRIMARY KEY (product_id)`
- `uq_products_store_sku`: `UNIQUE (dgt_id, product_sku)`

### promotion_products

Selected products and required quantities for promotions, including bundles and mix-and-match selection.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `promotion_product_id` | bigint | NO | nextval('promotion_products_promotion_product_id_seq'::regclass) |
| 2 | `promotion_id` | bigint | NO | — |
| 3 | `product_id` | bigint | NO | — |
| 4 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 5 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 6 | `dgt_id` | character varying(50) | NO | — |
| 7 | `required_quantity` | integer | NO | 1 |

Constraints:

- `fk_promotion_products_product`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `fk_promotion_products_promotion`: `FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id)`
- `promotion_link_store_fk`: `FOREIGN KEY (promotion_id, dgt_id) REFERENCES promotions(promotion_id, dgt_id)`
- `promotion_product_store_fk`: `FOREIGN KEY (product_id, dgt_id) REFERENCES products(product_id, dgt_id)`
- `promotion_products_pkey`: `PRIMARY KEY (promotion_product_id)`
- `promotion_products_required_quantity_check`: `CHECK ((required_quantity > 0))`
- `uq_promotion_products`: `UNIQUE (promotion_id, product_id)`

### promotions

Store promotion definitions, dates, discount value and buy/free quantities. These define offers; they do not prove a POS applied an offer.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `promotion_id` | bigint | NO | nextval('promotions_promotion_id_seq'::regclass) |
| 2 | `dgt_id` | character varying(50) | NO | — |
| 3 | `promotion_name` | character varying(150) | NO | — |
| 4 | `promotion_type` | character varying(50) | NO | — |
| 5 | `start_date` | timestamp with time zone | NO | — |
| 6 | `end_date` | timestamp with time zone | NO | — |
| 7 | `status` | character varying(30) | NO | 'ACTIVE'::character varying |
| 8 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 9 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 10 | `discount_value` | numeric(12,2) | YES | — |
| 11 | `buy_quantity` | integer | YES | — |
| 12 | `free_quantity` | integer | YES | — |
| 13 | `is_active` | boolean | NO | true |
| 14 | `creation_key` | uuid | YES | — |
| 15 | `creation_payload` | jsonb | YES | — |

Constraints:

- `chk_promotions_dates`: `CHECK ((end_date >= start_date))`
- `chk_promotions_discount_value`: `CHECK (((discount_value IS NULL) OR (discount_value >= (0)::numeric)))`
- `fk_promotions_store`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `promotion_creation_key`: `UNIQUE (dgt_id, creation_key)`
- `promotion_store_key`: `UNIQUE (promotion_id, dgt_id)`
- `promotions_buy_quantity_check`: `CHECK ((buy_quantity > 0))`
- `promotions_free_quantity_check`: `CHECK ((free_quantity > 0))`
- `promotions_pkey`: `PRIMARY KEY (promotion_id)`

### sales

Recorded receipt-level discount_amount alongside subtotal, tax and final amount.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `sale_id` | bigint | NO | — |
| 2 | `store_id` | character varying | NO | — |
| 3 | `cashier_id` | bigint | NO | — |
| 4 | `terminal_id` | bigint | NO | — |
| 5 | `receipt_no` | character varying(100) | NO | — |
| 6 | `transaction_id` | character varying(100) | NO | — |
| 7 | `transaction_type` | character varying(20) | NO | — |
| 8 | `sale_status` | character varying(20) | NO | — |
| 9 | `sale_datetime` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 10 | `subtotal` | numeric(14,2) | NO | 0 |
| 11 | `taxable_amount` | numeric(14,2) | NO | 0 |
| 12 | `tax_amount` | numeric(14,2) | NO | 0 |
| 13 | `discount_amount` | numeric(14,2) | NO | 0 |
| 14 | `total_amount` | numeric(14,2) | NO | 0 |
| 15 | `total_items` | integer | NO | 0 |
| 16 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 17 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `chk_sales_status`: `CHECK (((sale_status)::text = ANY ((ARRAY['OPEN'::character varying, 'COMPLETED'::character varying, 'VOIDED'::character varying, 'REFUNDED'::character varying])::text[])))`
- `chk_sales_transaction_type`: `CHECK (((transaction_type)::text = ANY ((ARRAY['SALE'::character varying, 'RETURN'::character varying, 'VOID'::character varying, 'REFUND'::character varying])::text[])))`
- `fk_sales_cashier`: `FOREIGN KEY (cashier_id) REFERENCES employees(employee_id)`
- `fk_sales_store`: `FOREIGN KEY (store_id) REFERENCES stores(dgt_id)`
- `fk_sales_terminal`: `FOREIGN KEY (terminal_id) REFERENCES pos_terminals(terminal_id)`
- `sales_pkey`: `PRIMARY KEY (sale_id)`
- `uq_sales_store_receipt`: `UNIQUE (store_id, receipt_no)`
- `uq_sales_transaction_id`: `UNIQUE (transaction_id)`

### sales_items

Recorded line discount_amount with catalog/actual prices, gross amount and line total. No promotion_id or rebate_id on these sale lines.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `sales_item_id` | bigint | NO | — |
| 2 | `sale_id` | bigint | NO | — |
| 3 | `product_id` | bigint | NO | — |
| 4 | `quantity` | numeric(12,3) | NO | — |
| 5 | `catalog_price` | numeric(14,2) | NO | 0 |
| 6 | `unit_price` | numeric(14,2) | NO | 0 |
| 7 | `gross_amount` | numeric(14,2) | NO | 0 |
| 8 | `discount_amount` | numeric(14,2) | NO | 0 |
| 9 | `taxable_amount` | numeric(14,2) | NO | 0 |
| 10 | `tax_amount` | numeric(14,2) | NO | 0 |
| 11 | `line_total` | numeric(14,2) | NO | 0 |
| 12 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `chk_sales_items_quantity`: `CHECK ((quantity <> (0)::numeric))`
- `fk_sales_items_product`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `fk_sales_items_sale`: `FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE`
- `sales_items_pkey`: `PRIMARY KEY (sales_item_id)`

### vendor_contacts

Despite the name, this table stores vendor CONTRACTS, including volume_discount_value, volume_discount_type and contract_type.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `contact_id` | bigint | NO | — |
| 2 | `vendor_id` | bigint | NO | — |
| 3 | `dgt_id` | character varying(50) | NO | — |
| 4 | `contract_number` | character varying(100) | YES | — |
| 5 | `start_date` | date | YES | — |
| 6 | `end_date` | date | YES | — |
| 7 | `volume_threshold` | numeric(10,2) | YES | — |
| 8 | `volume_discount_value` | numeric(10,2) | YES | — |
| 9 | `volume_discount_type` | character varying(50) | YES | — |
| 10 | `return_window_days` | integer | YES | — |
| 11 | `status` | character varying(50) | YES | — |
| 12 | `document_url` | character varying(500) | YES | — |
| 13 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 14 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 15 | `force_end_date` | date | YES | — |
| 16 | `contract_type` | character varying(100) | YES | — |
| 17 | `return_policy` | character varying(1000) | YES | — |

Constraints:

- `fk_vendor_contacts_store`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `fk_vendor_contacts_vendor`: `FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)`
- `pk_vendor_contacts`: `PRIMARY KEY (contact_id)`
- `vendor_contract_store_fk`: `FOREIGN KEY (vendor_id, dgt_id) REFERENCES vendors(vendor_id, dgt_id)`
- `vendor_contract_type_allowed`: `CHECK (((contract_type)::text = ANY ((ARRAY['Purchase / Supply Agreement'::character varying, 'Fixed Price Contract'::character varying, 'Tiered / Volume Pricing Contract'::character varying, 'Cost-Plus Contract'::character varying, 'Volume Incentive Contract'::character varying, 'Exclusive Supply Contract'::character varying, 'Preferred Vendor Agreement'::character varying, 'Delivery / Distribution Agreement'::character varying, 'Lease Agreement'::character varying, 'Maintenance / Service Contract'::character varying, 'Marketing / Display Agreement'::character varying, 'Slotting / Placement Agreement'::character varying])::text[])))`

### invoices

Parent invoice identity, store, vendor, dates and PO link for invoice discounts.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `invoice_id` | bigint | NO | nextval('invoices_invoice_id_seq'::regclass) |
| 2 | `dgt_id` | character varying(50) | NO | — |
| 3 | `vendor_id` | bigint | NO | — |
| 4 | `invoice_number` | character varying(100) | NO | — |
| 5 | `invoice_type` | character varying(50) | NO | — |
| 6 | `invoice_date` | date | NO | — |
| 7 | `received_date` | date | YES | — |
| 8 | `due_date` | date | YES | — |
| 9 | `received_by` | bigint | NO | — |
| 10 | `approved_by` | bigint | YES | — |
| 11 | `approved_at` | timestamp with time zone | YES | — |
| 12 | `purchase_order_id` | bigint | YES | — |
| 13 | `delivery_time` | time without time zone | YES | — |
| 14 | `driver_name` | character varying(200) | YES | — |
| 15 | `driver_number` | character varying(100) | YES | — |
| 16 | `route_id` | character varying(100) | YES | — |
| 17 | `payment_terms` | character varying(200) | YES | — |
| 18 | `notes` | character varying(4000) | YES | — |

Constraints:

- `invoices_approved_by_fkey`: `FOREIGN KEY (approved_by) REFERENCES users(user_id)`
- `invoices_dgt_id_fkey`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `invoices_pkey`: `PRIMARY KEY (invoice_id)`
- `invoices_purchase_order_fk`: `FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id)`
- `invoices_received_by_fkey`: `FOREIGN KEY (received_by) REFERENCES users(user_id)`
- `invoices_vendor_id_fkey`: `FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)`

### invoice_adjustments

Generic invoice adjustment records. No specifically named rebate/discount field; included as related financial context.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `invoice_adjustment_id` | bigint | NO | nextval('invoice_adjustments_invoice_adjustment_id_seq'::regclass) |
| 2 | `invoice_id` | bigint | NO | — |
| 3 | `adjustment_type` | character varying(50) | NO | — |
| 4 | `adjusted_amount` | numeric(12,2) | NO | — |
| 5 | `reason` | character varying(500) | YES | — |
| 6 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 7 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `invoice_adjustments_invoice_id_fkey`: `FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)`
- `invoice_adjustments_pkey`: `PRIMARY KEY (invoice_adjustment_id)`

### sale_payments

Tender payments underlying sales and settlement batches. Does not itself store promotion or discount amounts.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `sale_payment_id` | bigint | NO | — |
| 2 | `sale_id` | bigint | NO | — |
| 3 | `tender_type_id` | bigint | NO | — |
| 4 | `payment_amount` | numeric(14,2) | NO | — |
| 5 | `payment_status` | character varying(20) | NO | — |
| 6 | `card_brand` | character varying(50) | YES | — |
| 7 | `card_last4` | character varying(4) | YES | — |
| 8 | `processor_reference` | character varying(255) | YES | — |
| 9 | `authorization_code` | character varying(100) | YES | — |
| 10 | `payment_datetime` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 11 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 12 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `chk_sale_payment_card_last4`: `CHECK (((card_last4 IS NULL) OR ((card_last4)::text ~ '^[0-9]{4}$'::text)))`
- `chk_sale_payment_status`: `CHECK (((payment_status)::text = ANY ((ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'VOIDED'::character varying, 'REFUNDED'::character varying])::text[])))`
- `fk_sale_payments_sale`: `FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE`
- `fk_sale_payments_tender`: `FOREIGN KEY (tender_type_id) REFERENCES tender_types(tender_type_id)`
- `sale_payments_pkey`: `PRIMARY KEY (sale_payment_id)`

### tender_types

Payment method dictionary, used with sale_payments.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `tender_type_id` | bigint | NO | — |
| 2 | `tender_code` | character varying(50) | NO | — |
| 3 | `tender_name` | character varying(100) | NO | — |
| 4 | `is_active` | boolean | NO | true |
| 5 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 6 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `tender_types_pkey`: `PRIMARY KEY (tender_type_id)`
- `uq_tender_types_code`: `UNIQUE (tender_code)`

### fleet_batch_payments

Exact source payments for Fleet batches and their statement discounts; duplicate payment membership is prohibited.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `batch_id` | bigint | NO | — |
| 2 | `sale_payment_id` | bigint | NO | — |
| 3 | `payment_amount_snapshot` | numeric(14,2) | NO | — |

Constraints:

- `fleet_batch_payments_batch_id_fkey`: `FOREIGN KEY (batch_id) REFERENCES fleet_batches(batch_id)`
- `fleet_batch_payments_pkey`: `PRIMARY KEY (batch_id, sale_payment_id)`
- `fleet_batch_payments_sale_payment_id_fkey`: `FOREIGN KEY (sale_payment_id) REFERENCES sale_payments(sale_payment_id)`
- `fleet_batch_payments_sale_payment_id_key`: `UNIQUE (sale_payment_id)`

### product_vendors

Vendor/item relationship and cost context; not a discount-program definition.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `product_vendor_id` | bigint | NO | nextval('product_vendors_product_vendor_id_seq'::regclass) |
| 2 | `product_id` | bigint | NO | — |
| 3 | `vendor_id` | bigint | NO | — |
| 4 | `vendor_sku` | character varying(100) | YES | — |
| 5 | `unit_type` | character varying(50) | YES | — |
| 6 | `unit_of_measure` | character varying(50) | YES | — |
| 7 | `unit_cost` | numeric(12,2) | NO | — |
| 8 | `is_primary` | boolean | NO | false |
| 9 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 10 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 11 | `dgt_id` | character varying(50) | NO | — |
| 12 | `case_pack_quantity` | integer | YES | — |
| 13 | `minimum_order_quantity` | numeric(12,3) | YES | — |

Constraints:

- `chk_product_vendors_unit_cost`: `CHECK ((unit_cost >= (0)::numeric))`
- `fk_product_vendors_product`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `fk_product_vendors_vendor`: `FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)`
- `pricebook_vendor_link_product_fk`: `FOREIGN KEY (product_id, dgt_id) REFERENCES products(product_id, dgt_id)`
- `pricebook_vendor_link_vendor_fk`: `FOREIGN KEY (vendor_id, dgt_id) REFERENCES vendors(vendor_id, dgt_id)`
- `product_vendors_case_pack_quantity_check`: `CHECK ((case_pack_quantity > 0))`
- `product_vendors_minimum_order_quantity_check`: `CHECK ((minimum_order_quantity > (0)::numeric))`
- `product_vendors_pkey`: `PRIMARY KEY (product_vendor_id)`
- `uq_product_vendors_product_vendor`: `UNIQUE (product_id, vendor_id)`

### vendor_item_cost_history

Cost change history; not a separate rebate entitlement or payment ledger.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `cost_history_id` | bigint | NO | — |
| 2 | `product_id` | bigint | NO | — |
| 3 | `vendor_id` | bigint | NO | — |
| 4 | `old_cost` | numeric(10,2) | YES | — |
| 5 | `new_cost` | numeric(10,2) | YES | — |
| 6 | `change_percentage` | numeric(10,2) | YES | — |
| 7 | `effective_date` | date | YES | — |
| 8 | `change_source` | character varying(100) | YES | — |
| 9 | `changed_by` | bigint | YES | — |
| 10 | `created_date` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 11 | `updated_date` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `fk_vendor_item_cost_history_product`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `fk_vendor_item_cost_history_vendor`: `FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)`
- `pk_vendor_item_cost_history`: `PRIMARY KEY (cost_history_id)`

### vendor_audit_log

Vendor changes recorded as audit data; not an independent discount amount ledger.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `audit_id` | bigint | NO | — |
| 2 | `vendor_id` | bigint | NO | — |
| 3 | `product_id` | bigint | YES | — |
| 4 | `dgt_id` | character varying(50) | NO | — |
| 5 | `action_type` | character varying(100) | YES | — |
| 6 | `details` | character varying(500) | YES | — |
| 7 | `cost_history_id` | bigint | YES | — |
| 8 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `fk_vendor_audit_log_cost_history`: `FOREIGN KEY (cost_history_id) REFERENCES vendor_item_cost_history(cost_history_id)`
- `fk_vendor_audit_log_product`: `FOREIGN KEY (product_id) REFERENCES products(product_id)`
- `fk_vendor_audit_log_store`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `fk_vendor_audit_log_vendor`: `FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)`
- `pk_vendor_audit_log`: `PRIMARY KEY (audit_id)`

### access_audit_events

Generic change history, including Fleet and promotion changes in structured audit payloads.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `event_id` | bigint | NO | — |
| 2 | `company_id` | bigint | NO | — |
| 3 | `dgt_id` | character varying(50) | YES | — |
| 4 | `actor_user_id` | bigint | NO | — |
| 5 | `event_type` | character varying(100) | NO | — |
| 6 | `target_type` | character varying(100) | NO | — |
| 7 | `target_id` | character varying(100) | YES | — |
| 8 | `changes` | jsonb | NO | '{}'::jsonb |
| 9 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `access_audit_events_actor_user_id_fkey`: `FOREIGN KEY (actor_user_id) REFERENCES users(user_id)`
- `access_audit_events_company_id_fkey`: `FOREIGN KEY (company_id) REFERENCES companies(company_id)`
- `access_audit_events_dgt_id_fkey`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `access_audit_events_pkey`: `PRIMARY KEY (event_id)`

### fuel_prices

Gas price records can use Promotion as a change reason. This is a reason label, not automatic promotional pricing.

| # | Column | Type | Nullable | Default |
|---:|---|---|---|---|
| 1 | `fuel_price_id` | bigint | NO | nextval('fuel_prices_fuel_price_id_seq'::regclass) |
| 2 | `dgt_id` | character varying(50) | NO | — |
| 3 | `fuel_grade_id` | bigint | NO | — |
| 4 | `cash_price` | numeric(10,3) | NO | — |
| 5 | `credit_price` | numeric(10,3) | NO | — |
| 6 | `effective_from` | timestamp with time zone | NO | — |
| 7 | `effective_to` | timestamp with time zone | YES | — |
| 8 | `changed_by` | bigint | NO | — |
| 9 | `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| 10 | `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Constraints:

- `fk_fuel_prices_changed_by`: `FOREIGN KEY (changed_by) REFERENCES users(user_id)`
- `fk_fuel_prices_grade`: `FOREIGN KEY (fuel_grade_id) REFERENCES fuel_grades(fuel_grade_id)`
- `fk_fuel_prices_store`: `FOREIGN KEY (dgt_id) REFERENCES stores(dgt_id)`
- `fuel_prices_pkey`: `PRIMARY KEY (fuel_price_id)`

## Source-reference appendix

All frontend component/page files matching discount, promotion, rebate, coupon or markdown at this snapshot. Multiple files can implement the same page; a match can be a disabled field, old component or shared label.

- [Frontend/src/components/DashboardHeader.tsx](../Frontend/src/components/DashboardHeader.tsx): lines 126, 130
- [Frontend/src/components/ImportFromParentBanner.tsx](../Frontend/src/components/ImportFromParentBanner.tsx): lines 32, 37, 38, 39, 40, 41, 44, 45, 46, 47, 48, 51 …
- [Frontend/src/components/closing/store-edit/MoneyInSection.tsx](../Frontend/src/components/closing/store-edit/MoneyInSection.tsx): lines 114
- [Frontend/src/components/gas/price/RecordPriceChangeDrawer.tsx](../Frontend/src/components/gas/price/RecordPriceChangeDrawer.tsx): lines 117
- [Frontend/src/components/gas/price/gasPriceData.ts](../Frontend/src/components/gas/price/gasPriceData.ts): lines 3
- [Frontend/src/components/grocery/OrderGuide.tsx](../Frontend/src/components/grocery/OrderGuide.tsx): lines 101, 495, 498, 499, 502
- [Frontend/src/components/grocery/OrdersInvoices.tsx](../Frontend/src/components/grocery/OrdersInvoices.tsx): lines 91, 129, 162, 164, 225, 263, 272, 275, 312, 313, 572, 575 …
- [Frontend/src/components/grocery/RebateManagement.tsx](../Frontend/src/components/grocery/RebateManagement.tsx): lines 47, 48, 51, 54, 66, 78, 87, 88, 93, 95, 104, 106 …
- [Frontend/src/components/grocery/StockAdjustments.tsx](../Frontend/src/components/grocery/StockAdjustments.tsx): lines 133, 134, 150, 151, 164, 165, 178, 179, 192, 193, 206, 207 …
- [Frontend/src/components/grocery/VendorContracts.tsx](../Frontend/src/components/grocery/VendorContracts.tsx): lines 12, 13, 26, 27, 31, 32, 40, 43
- [Frontend/src/components/grocery/VendorList.tsx](../Frontend/src/components/grocery/VendorList.tsx): lines 168, 169, 179, 180, 190, 191
- [Frontend/src/components/grocery/VendorProfile.tsx](../Frontend/src/components/grocery/VendorProfile.tsx): lines 67, 74, 81, 88, 95, 102, 110, 405, 410, 413
- [Frontend/src/components/grocery/ViewInvoice.tsx](../Frontend/src/components/grocery/ViewInvoice.tsx): lines 51, 86, 294
- [Frontend/src/components/grocery/rebate/AddRebateProgramDialog.tsx](../Frontend/src/components/grocery/rebate/AddRebateProgramDialog.tsx): lines 15, 18, 20, 23, 36, 51, 63, 66, 78, 91, 116, 233
- [Frontend/src/components/grocery/rebate/RebateAccrualPage.tsx](../Frontend/src/components/grocery/rebate/RebateAccrualPage.tsx): lines 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26 …
- [Frontend/src/components/grocery/rebate/RebateClaimsPage.tsx](../Frontend/src/components/grocery/rebate/RebateClaimsPage.tsx): lines 20, 21, 26, 42, 46, 52, 53, 65, 81
- [Frontend/src/components/grocery/rebate/RebateClaimsPaymentsPage.tsx](../Frontend/src/components/grocery/rebate/RebateClaimsPaymentsPage.tsx): lines 20, 42, 45, 47, 79, 81, 360, 361, 396, 516
- [Frontend/src/components/grocery/rebate/RebateControlsPage.tsx](../Frontend/src/components/grocery/rebate/RebateControlsPage.tsx): lines 12, 13, 17, 21, 69, 70
- [Frontend/src/components/grocery/rebate/RebateItemsPage.tsx](../Frontend/src/components/grocery/rebate/RebateItemsPage.tsx): lines 28, 30, 34, 37, 40, 44, 45, 47, 48, 49, 50, 51 …
- [Frontend/src/components/grocery/rebate/RebateManagementPage.tsx](../Frontend/src/components/grocery/rebate/RebateManagementPage.tsx): lines 4, 5, 6, 7, 8, 11, 13, 17, 18, 25, 27, 33 …
- [Frontend/src/components/grocery/rebate/RebatePaymentsPage.tsx](../Frontend/src/components/grocery/rebate/RebatePaymentsPage.tsx): lines 10, 25, 27, 33, 34
- [Frontend/src/components/grocery/rebate/RebateProgramDetailsPage.tsx](../Frontend/src/components/grocery/rebate/RebateProgramDetailsPage.tsx): lines 14, 16, 65, 81, 83, 84, 89, 99, 104, 140, 156, 163 …
- [Frontend/src/components/grocery/rebate/RebateProgramsPage.tsx](../Frontend/src/components/grocery/rebate/RebateProgramsPage.tsx): lines 20, 21, 25, 27, 28, 29, 30, 31, 32, 33, 34, 35 …
- [Frontend/src/components/grocery/rebate/RebateReportsPage.tsx](../Frontend/src/components/grocery/rebate/RebateReportsPage.tsx): lines 10, 12, 14, 19, 20, 21, 22, 23, 24, 25, 26, 74 …
- [Frontend/src/components/grocery/rebate/rebateTypes.ts](../Frontend/src/components/grocery/rebate/rebateTypes.ts): lines 1, 7, 12, 29, 44, 63
- [Frontend/src/components/grocery/reports/ProfitMarginView.tsx](../Frontend/src/components/grocery/reports/ProfitMarginView.tsx): lines 23, 29, 40, 53, 66, 72, 73, 74, 75, 76, 77, 78 …
- [Frontend/src/components/grocery/reports/PurchaseInvoiceReport.tsx](../Frontend/src/components/grocery/reports/PurchaseInvoiceReport.tsx): lines 24, 30, 36, 42, 48, 54, 60, 66, 86, 89, 180, 181
- [Frontend/src/components/grocery/reports/PurchaseInvoiceSummaryTable.tsx](../Frontend/src/components/grocery/reports/PurchaseInvoiceSummaryTable.tsx): lines 34, 242
- [Frontend/src/components/grocery/reports/SingleItemPurchaseHistory.tsx](../Frontend/src/components/grocery/reports/SingleItemPurchaseHistory.tsx): lines 31, 38, 45, 52, 59, 66, 73, 80
- [Frontend/src/components/grocery/reports/SingleItemPurchaseTable.tsx](../Frontend/src/components/grocery/reports/SingleItemPurchaseTable.tsx): lines 36, 74, 77, 97, 155, 158, 188
- [Frontend/src/components/live-counter/LiveCounterPage.tsx](../Frontend/src/components/live-counter/LiveCounterPage.tsx): lines 39
- [Frontend/src/components/live-counter/LiveTransactionDrawer.tsx](../Frontend/src/components/live-counter/LiveTransactionDrawer.tsx): lines 9, 10
- [Frontend/src/components/live-counter/liveActivityData.ts](../Frontend/src/components/live-counter/liveActivityData.ts): lines 2, 3, 4, 7
- [Frontend/src/components/pricebook/BulkUpdatePage.tsx](../Frontend/src/components/pricebook/BulkUpdatePage.tsx): lines 20, 24, 36, 40, 44, 56, 57, 58, 60, 84, 85, 88 …
- [Frontend/src/components/pricebook/ItemsPage.tsx](../Frontend/src/components/pricebook/ItemsPage.tsx): lines 22, 43, 46, 50, 58, 60, 61, 104, 197, 200, 202, 203 …
- [Frontend/src/components/pricebook/PromotionsPage.tsx](../Frontend/src/components/pricebook/PromotionsPage.tsx): lines 19, 20, 22, 23, 24, 25, 26, 28, 29, 35, 38, 39 …
- [Frontend/src/components/reports/NetWorthPage.tsx](../Frontend/src/components/reports/NetWorthPage.tsx): lines 24, 136
- [Frontend/src/components/reports/pos-report/PosReportsHub.tsx](../Frontend/src/components/reports/pos-report/PosReportsHub.tsx): lines 51, 52, 53, 54, 55, 56, 57, 58, 99, 100, 101, 102 …
- [Frontend/src/components/tender/fleet-cards/FleetCardsPage.tsx](../Frontend/src/components/tender/fleet-cards/FleetCardsPage.tsx): lines 33, 64, 84, 146, 179, 194, 229, 238
- [Frontend/src/components/tender/fleet-cards/FleetDialogs.tsx](../Frontend/src/components/tender/fleet-cards/FleetDialogs.tsx): lines 27, 28, 29, 32, 33, 38
- [Frontend/src/components/tender/fleet-cards/fleetData.ts](../Frontend/src/components/tender/fleet-cards/fleetData.ts): lines 7, 15
- [Frontend/src/pages/Index.tsx](../Frontend/src/pages/Index.tsx): lines 14, 40, 126, 234, 235, 331, 525, 526, 569, 570
