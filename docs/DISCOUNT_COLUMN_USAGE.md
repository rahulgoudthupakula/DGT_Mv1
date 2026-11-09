# Discount, promotion and rebate: column usage

Source/schema audit: September 14, 2026. The earlier 23-table inventory includes 13 directly related tables and 10 supporting tables; it does not mean 23 separate discount systems are implemented. This document covers all 300 columns.

“Workflow reference” means the column name occurs in source files that directly access that table. It is source evidence, not proof of a visible editable field or a runtime execution. “No explicit reference” means the schema has the field but this audit did not establish current use; generic CRUD, SELECT * and future integrations must not be assumed connected. IDs and timestamps are supporting metadata, not discount controls.

## everyday_closing

**Where:** Daily Closing → Business Date Details. **Purpose:** Saves daily sales totals, cash reconciliation, settlement readings and the closed-day snapshot.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `everyday_closing_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `opening_datetime` | Opening date/time on the closing record. | Workflow reference |
| `closing_datetime` | Closing date/time. | Workflow reference |
| `total_gross_sales` | Daily recorded gross sales total. | Workflow reference |
| `total_discounts` | Daily discount total derived from recorded sales. | Workflow reference |
| `total_tax` | Daily recorded tax total. | Workflow reference |
| `total_net_sales` | Daily recorded net sales total. | Workflow reference |
| `total_refunds` | Daily recorded refund total. | Workflow reference |
| `expected_cash` | Calculated expected cash for reconciliation. | Workflow reference |
| `actual_cash` | Counted closing cash. | Workflow reference |
| `cash_variance` | Difference between counted and expected cash. | Workflow reference |
| `total_deposits` | Deposit total on the closing record. | Workflow reference |
| `closed_by` | User who closed the day. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |
| `business_date` | Store business date represented by this record. | Workflow reference |
| `closing_status` | Draft/closed state. | Workflow reference |
| `opening_cash` | Opening cash for this business day. | Workflow reference |
| `cash_added` | Cash additions recorded for the day. | Workflow reference |
| `cash_drops` | Cash removed/dropped during the day. | Workflow reference |
| `notes` | Saved explanatory notes. | Workflow reference |
| `is_sample` | Marks sample/test closing data. | Workflow reference |
| `sales_snapshot` | Saved sales detail/totals snapshot for a closing. | Workflow reference |
| `opening_checks` | Checks carried into the day. | Workflow reference |
| `closing_checks` | Checks remaining at closing. | Workflow reference |
| `card_jobber_settlement` | Card settlement credited through the jobber invoice. | Workflow reference |
| `card_bank_settlement` | Card settlement credited to the bank. | Workflow reference |
| `lottery_online_sales` | Saved daily-closing lottery online sales reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_online_cash` | Saved daily-closing lottery online cash reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_scratch_cash` | Saved daily-closing lottery scratch cash reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_settlement` | Saved daily-closing lottery settlement reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_adjustment` | Saved daily-closing lottery adjustment reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_online_credit` | Saved daily-closing lottery online credit reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_scratch_credit` | Saved daily-closing lottery scratch credit reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_commission` | Saved daily-closing lottery commission reading; this does not connect the separate lottery pack-management tables. | Workflow reference |
| `lottery_balance` | Saved daily-closing lottery balance reading; this does not connect the separate lottery pack-management tables. | Workflow reference |

**Source evidence:** `dailyclosing/scoped/ClosingReconciliation.java`, `dailyclosing/scoped/StoreClosingController.java`.

## fleet_batches

**Where:** Tender Types → Fleet Cards. **Purpose:** Groups fleet payments and reconciles provider deductions against the actual deposit.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `batch_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `provider_name` | Fleet provider display name. | Workflow reference |
| `batch_reference` | Batch reference shown in settlement history. | Workflow reference |
| `business_date` | Store business date represented by this record. | Workflow reference |
| `source_kind` | Origin of the batch, such as recorded payments/manual entry. | No explicit reference found; not confirmed connected |
| `status` | Stored workflow status; interpretation depends on the table. | Workflow reference |
| `fleet_sales` | Fleet payment sales total in the batch. | Workflow reference |
| `gallons_sold` | Recorded fuel volume for the batch. | Workflow reference |
| `fuel_sales` | Fuel sales amount associated with the fleet batch. | Workflow reference |
| `volume_note` | Explanation of fleet fuel volume. | Workflow reference |
| `transaction_count` | Number of transactions in the batch. | Workflow reference |
| `statement_discount` | Fleet-provider statement deduction used during settlement reconciliation. | Workflow reference |
| `processor_fee` | Fleet-provider processing fee deduction. | Workflow reference |
| `actual_deposit` | Actual received settlement deposit. | Workflow reference |
| `settlement_date` | Date settlement was received. | Workflow reference |
| `settlement_reference` | Settlement reference for matching. | Workflow reference |
| `variance_review_note` | Explanation of a settlement discrepancy. | Workflow reference |
| `notes` | Saved explanatory notes. | Workflow reference |
| `created_by` | User who performed the created action. | Workflow reference |
| `settled_by` | User who performed the settled action. | Workflow reference |
| `reconciled_by` | User who performed the reconciled action. | Workflow reference |
| `request_key` | Request retry/idempotency key. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |

**Source evidence:** `tender/controller/FleetController.java`.

## grocery_invoice_items

**Where:** Grocery → Edit & View Invoices; New Arrivals. **Purpose:** Stores invoice product lines, quantities, costs and MSRP; approved receiving feeds inventory.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `grocery_invoice_item_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `invoice_id` | Links to the invoice header. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `vendor_item_code` | Vendor reference/code for the invoice item. | Workflow reference |
| `quantity` | Recorded item quantity. | Workflow reference |
| `unit_type` | Unit used for purchasing/invoicing, such as item or case. | Workflow reference |
| `case_pack_quantity` | Individual units per invoice/vendor case. | Workflow reference |
| `unit_cost` | Purchase cost per specified unit. | Workflow reference |
| `item_line_discount` | Existing line-discount column; current invoice discount is saved at invoice_charges.discounted_amount. | Not connected in current invoice workflow |
| `item_line_total` | Saved invoice line amount. | Workflow reference |
| `is_product_new` | Identifies an invoice line containing a new product for New Arrivals. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |
| `msrp` | Invoice suggested retail used for a new item until its selling price is assigned. | Workflow reference |
| `received_quantity` | Quantity actually received; distinct from invoiced quantity. | Workflow reference |
| `line_tax` | Tax recorded for this invoice line. | Workflow reference |

**Source evidence:** `pricebook/VendorPricingController.java`, `pricebook/ItemSellingPrice.java`, `pricebook/StoreNewArrivalsController.java`, `pricebook/VendorCostController.java`.

## invoice_charges

**Where:** Invoice → Additional Charges and Summary. **Purpose:** Stores invoice-level discount, freight, fuel surcharge, handling and totals.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `invoice_charge_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `invoice_id` | Links to the invoice header. | Workflow reference |
| `charge_type` | Schema field for charge type. Current user-facing behavior is not established by its name alone. | Workflow reference |
| `sub_total` | Saved invoice subtotal. | Workflow reference |
| `discounted_amount` | Invoice-level discount entered under Additional Charges. | Workflow reference |
| `other_charges` | Other/combined invoice charge amount; retained by the invoice charge model. | Workflow reference |
| `total_amount` | Saved final amount for the receipt/invoice charges. | Workflow reference |
| `status_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `payment_status` | Stored payment state. | Workflow reference |
| `created_at` | Record creation timestamp. | No explicit reference found; not confirmed connected |
| `updated_at` | Last update timestamp. | Workflow reference |
| `freight_amount` | Invoice freight charge. | Workflow reference |
| `fuel_surcharge` | Invoice fuel surcharge. | Workflow reference |
| `handling_fee` | Invoice handling charge. | Workflow reference |

**Source evidence:** `pricebook/StoreInvoiceEntryController.java`.

## price_groups

**Where:** Price Book → Price Groups. **Purpose:** Stores the shared selling price; this is a group price, not a separate discount rule.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `price_group_id` | Links to / identifies the shared-price group. | Workflow reference |
| `price_group_name` | Displayed group name. | Workflow reference |
| `description` | Saved group description. | Workflow reference |
| `is_active` | Whether this record or membership is active. | Workflow reference |
| `created_at` | Record creation timestamp. | No explicit reference found; not confirmed connected |
| `updated_at` | Last update timestamp. | Workflow reference |
| `group_price` | Shared selling price applied to active members of this group. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `creation_key` | Creation retry/idempotency key. | Workflow reference |
| `creation_payload` | Saved creation payload used to validate repeated creation requests. | Workflow reference |

**Source evidence:** `pricebook/ItemSellingPrice.java`, `pricebook/BulkItemLinks.java`, `pricebook/StorePriceGroupController.java`, `pricebook/PriceBookController.java`.

## product_price_groups

**Where:** Price Groups; Items; Bulk Update. **Purpose:** Links an item to its price group. Group pricing applies while membership is active; individual retail remains saved.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `product_price_group_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `price_group_id` | Links to / identifies the shared-price group. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `created_at` | Record creation timestamp. | No explicit reference found; not confirmed connected |
| `updated_at` | Last update timestamp. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `is_active` | Whether this record or membership is active. | Workflow reference |

**Source evidence:** `pricebook/ItemSellingPrice.java`, `pricebook/BulkItemLinks.java`, `pricebook/StorePriceGroupController.java`, `pricebook/PriceBookController.java`.

## product_store_prices

**Where:** Price Book → Items / Bulk Update. **Purpose:** Stores the individual item retail price for that store.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `store_price_id` | Record identifier or relation key supporting this table. | No explicit reference found; not confirmed connected |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `retail_price` | Saved individual selling price; retained while a group price applies. | Workflow reference |
| `is_active` | Whether this record or membership is active. | Workflow reference |
| `rebate_id` | Nullable rebate reference; no foreign key or implemented rebate ledger was found. | Not connected |
| `created_at` | Record creation timestamp. | No explicit reference found; not confirmed connected |
| `updated_at` | Last update timestamp. | Workflow reference |

**Source evidence:** `pricebook/StoreReductionController.java`, `pricebook/StorePriceGroupController.java`, `pricebook/PriceBookController.java`.

## products

**Where:** Price Book → Add/Edit Item / Bulk Update. **Purpose:** Stores item identity, flags, purchase-unit cost breakdown and purchase discount.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `product_id` | Links to the item record. | Workflow reference |
| `store_sub_department_id` | Item sub-department assignment. | Workflow reference |
| `product_name` | Item display name. | Workflow reference |
| `product_sku` | Store item SKU. | Workflow reference |
| `is_returnable` | Whether the item can be returned. | Workflow reference |
| `brand_id` | Optional link to brands; the current brand table is empty and has no connected workflow found. | Reference only / no connected brand workflow |
| `unit_of_measure` | Stored item/purchasing unit. | Workflow reference |
| `is_active` | Whether this record or membership is active. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |
| `is_taxable` | Item taxable flag. | Workflow reference |
| `is_ebt` | Item EBT eligibility flag. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `is_age_restricted` | Item age-restriction flag. | Workflow reference |
| `reorder_level` | Item reorder stock threshold. | Workflow reference |
| `purchase_unit` | Purchase cost unit, such as item or case. | Workflow reference |
| `units_per_case` | Number of individual units in one case. | Workflow reference |
| `purchase_gross_cost` | Gross purchase cost for the selected purchase unit, before purchase discount. | Workflow reference |
| `purchase_discount` | Purchase cost discount entered in the item cost breakdown; affects net cost, not a receipt discount. | Workflow reference |

**Source evidence:** `sales/activity/LiveActivityController.java`, `tender/controller/FleetController.java`, `pricebook/VendorPricingController.java`, `pricebook/StoreStockController.java`.

## promotion_products

**Where:** Price Book → Promotions / Bulk Update promotion assignment. **Purpose:** Links selected products and bundle quantities to a promotion.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `promotion_product_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `promotion_id` | Links to / identifies the promotion. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `required_quantity` | Required quantity of this selected product for the promotion/bundle. | Workflow reference |

**Source evidence:** `pricebook/BulkItemLinks.java`, `pricebook/StorePromotionController.java`.

## promotions

**Where:** Price Book → Promotions. **Purpose:** Stores promotion definitions, dates and discount/buy-get rules. Saving a rule does not prove a POS integration evaluates it.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `promotion_id` | Links to / identifies the promotion. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `promotion_name` | Displayed promotion name. | Workflow reference |
| `promotion_type` | Promotion rule type, such as discount, buy/get or bundle. | Workflow reference |
| `start_date` | Start date of the promotion or contract. | Workflow reference |
| `end_date` | End date of the promotion or contract. | Workflow reference |
| `status` | Stored workflow status; interpretation depends on the table. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |
| `discount_value` | Value interpreted according to the promotion type. | Workflow reference |
| `buy_quantity` | Qualifying purchase quantity for a buy/get rule. | Workflow reference |
| `free_quantity` | Reward quantity for a buy/get rule. | Workflow reference |
| `is_active` | Whether this record or membership is active. | Workflow reference |
| `creation_key` | Creation retry/idempotency key. | Workflow reference |
| `creation_payload` | Saved creation payload used to validate repeated creation requests. | Workflow reference |

**Source evidence:** `pricebook/BulkItemLinks.java`, `pricebook/StorePromotionController.java`.

## sales

**Where:** Live Activity; Daily Closing; tender summaries. **Purpose:** Stores recorded receipt totals and receipt-level discounts.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `sale_id` | Links to the sale receipt. | Workflow reference |
| `store_id` | Store that owns the sale. | Workflow reference |
| `cashier_id` | Cashier associated with the sale. | Workflow reference |
| `terminal_id` | POS/register associated with the sale. | Workflow reference |
| `receipt_no` | Displayed receipt number. | Workflow reference |
| `transaction_id` | External/import transaction reference. | Workflow reference |
| `transaction_type` | Recorded transaction category. | Workflow reference |
| `sale_status` | Recorded receipt state. | Workflow reference |
| `sale_datetime` | Original sale date and time. | Workflow reference |
| `subtotal` | Receipt subtotal. | Workflow reference |
| `taxable_amount` | Amount subject to tax. | Workflow reference |
| `tax_amount` | Recorded tax amount. | Workflow reference |
| `discount_amount` | Recorded discount for this receipt or line; not a new discount setting. | Workflow reference |
| `total_amount` | Saved final amount for the receipt/invoice charges. | Workflow reference |
| `total_items` | Receipt item count. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |

**Source evidence:** `sales/activity/LiveActivityController.java`, `tender/controller/EbtController.java`, `tender/controller/CreditCardController.java`, `tender/controller/FleetController.java`.

## sales_items

**Where:** Live Activity → expanded receipt / top-selling items. **Purpose:** Stores recorded sale lines and line discounts; these are transaction results, not promotion definitions.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `sales_item_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `sale_id` | Links to the sale receipt. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `quantity` | Recorded item quantity. | Workflow reference |
| `catalog_price` | Catalog/reference selling price saved on the sale line. | Workflow reference |
| `unit_price` | Actual recorded unit selling price. | Workflow reference |
| `gross_amount` | Line gross amount before deductions. | Workflow reference |
| `discount_amount` | Recorded discount for this receipt or line; not a new discount setting. | Workflow reference |
| `taxable_amount` | Amount subject to tax. | Workflow reference |
| `tax_amount` | Recorded tax amount. | Workflow reference |
| `line_total` | Final recorded sale-line amount. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |

**Source evidence:** `sales/activity/LiveActivityController.java`, `tender/controller/FleetController.java`, `dailyclosing/scoped/ClosingBreakdowns.java`, `dailyclosing/scoped/StoreClosingController.java`.

## vendor_contacts

**Where:** Vendor Management → Contracts → Add/Edit Contract. **Purpose:** Despite its name, this table stores vendor contracts, including volume discount and return policy.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `contact_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `vendor_id` | Links to the vendor record. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `contract_number` | Optional contract number retained in backend storage; removed from the current Add Contract form. | Backend field; no current form input |
| `start_date` | Start date of the promotion or contract. | Workflow reference |
| `end_date` | End date of the promotion or contract. | Workflow reference |
| `volume_threshold` | Optional threshold retained in backend storage; removed from the current Add Contract form. | Backend field; no current form input |
| `volume_discount_value` | Contract volume-discount amount or percentage. | Workflow reference |
| `volume_discount_type` | Whether contract volume discount is an amount or percentage. | Workflow reference |
| `return_window_days` | Allowed return window in days. | Workflow reference |
| `status` | Stored workflow status; interpretation depends on the table. | Workflow reference |
| `document_url` | Reserved contract document link; document upload/view remains disabled. | Not connected |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |
| `force_end_date` | Stored legacy/optional end-date control; not found in the connected contract workflow. | No current usage found |
| `contract_type` | Selected contract category. | Workflow reference |
| `return_policy` | Return policy text/type, displayed with the return window. | Workflow reference |

**Source evidence:** `pricebook/StoreVendorController.java`.

## invoices

**Where:** Grocery → Edit & View Invoices / View Invoice. **Purpose:** Invoice header connecting vendor, purchase order, delivery and approval to invoice lines/charges.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `invoice_id` | Links to the invoice header. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `vendor_id` | Links to the vendor record. | Workflow reference |
| `invoice_number` | Vendor invoice reference. | Workflow reference |
| `invoice_type` | Invoice category. | Workflow reference |
| `invoice_date` | Invoice issue date. | Workflow reference |
| `received_date` | Delivery/receipt date. | Workflow reference |
| `due_date` | Invoice payment due date. | Workflow reference |
| `received_by` | User who recorded receipt. | Workflow reference |
| `approved_by` | User who approved the invoice. | Workflow reference |
| `approved_at` | Approval timestamp; current invoice edits are limited to before approval. | Workflow reference |
| `purchase_order_id` | Selected purchase order link, used to load ordered items. | Workflow reference |
| `delivery_time` | Entered delivery time. | Workflow reference |
| `driver_name` | Delivery driver name. | Workflow reference |
| `driver_number` | Delivery driver reference/number. | Workflow reference |
| `route_id` | Delivery route reference. | Workflow reference |
| `payment_terms` | Saved invoice payment terms. | Workflow reference |
| `notes` | Saved explanatory notes. | Workflow reference |

**Source evidence:** `pricebook/VendorPricingController.java`, `pricebook/ItemSellingPrice.java`, `pricebook/StoreNewArrivalsController.java`, `pricebook/VendorCostController.java`.

## invoice_adjustments

**Where:** No current connected page found. **Purpose:** Legacy/scaffolded adjustment storage; not used by the current invoice workflow.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `invoice_adjustment_id` | Record identifier or relation key supporting this table. | No current connected workflow |
| `invoice_id` | Links to the invoice header. | No current connected workflow |
| `adjustment_type` | Proposed/legacy adjustment category. | No current connected workflow |
| `adjusted_amount` | Proposed/legacy invoice adjustment amount. | No current connected workflow |
| `reason` | Proposed/legacy adjustment reason. | No current connected workflow |
| `created_at` | Record creation timestamp. | No current connected workflow |
| `updated_at` | Last update timestamp. | No current connected workflow |

## sale_payments

**Where:** Live Activity → tenders; Credit Card / EBT / Fleet. **Purpose:** Records how a receipt was paid; supports settlement matching, not a discount rule.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `sale_payment_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `sale_id` | Links to the sale receipt. | Workflow reference |
| `tender_type_id` | Identifies/links the payment method. | Workflow reference |
| `payment_amount` | Amount paid through this tender. | Workflow reference |
| `payment_status` | Stored payment state. | Workflow reference |
| `card_brand` | Recorded card brand. | Workflow reference |
| `card_last4` | Recorded last four card digits. | Workflow reference |
| `processor_reference` | Processor payment reference. | No explicit reference found; not confirmed connected |
| `authorization_code` | Recorded authorization reference. | No explicit reference found; not confirmed connected |
| `payment_datetime` | Payment date/time. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |

**Source evidence:** `sales/activity/LiveActivityController.java`, `tender/controller/EbtController.java`, `tender/controller/CreditCardController.java`, `tender/controller/FleetController.java`.

## tender_types

**Where:** Live Activity and tender settlement classification. **Purpose:** Identifies payment methods such as cash, card, EBT or fleet.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `tender_type_id` | Identifies/links the payment method. | Workflow reference |
| `tender_code` | Stable payment-method code used for classification. | Workflow reference |
| `tender_name` | Payment-method display name. | Workflow reference |
| `is_active` | Whether this record or membership is active. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |

**Source evidence:** `sales/activity/LiveActivityController.java`, `tender/controller/EbtController.java`, `tender/controller/CreditCardController.java`, `tender/controller/FleetController.java`.

## fleet_batch_payments

**Where:** Fleet Cards → batch payments. **Purpose:** Links payments to a fleet batch and preserves the matched amount.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `batch_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `sale_payment_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `payment_amount_snapshot` | Amount captured when matching the payment to the fleet batch. | Workflow reference |

**Source evidence:** `tender/controller/FleetController.java`.

## product_vendors

**Where:** Vendor Management → View Items / Link Item / Edit Item; Items vendor display. **Purpose:** Links the store item to its vendor and purchasing terms.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `product_vendor_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `vendor_id` | Links to the vendor record. | Workflow reference |
| `vendor_sku` | Vendor-specific item code. | Workflow reference |
| `unit_type` | Unit used for purchasing/invoicing, such as item or case. | Workflow reference |
| `unit_of_measure` | Stored item/purchasing unit. | No explicit reference found; not confirmed connected |
| `unit_cost` | Purchase cost per specified unit. | Workflow reference |
| `is_primary` | Marks a preferred/primary vendor link; does not imply order-guide auto-pick is implemented. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |
| `updated_at` | Last update timestamp. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `case_pack_quantity` | Individual units per invoice/vendor case. | Workflow reference |
| `minimum_order_quantity` | Minimum quantity for ordering this linked vendor item. | Workflow reference |

**Source evidence:** `pricebook/StoreStockController.java`, `pricebook/StoreReductionController.java`, `pricebook/VendorCostController.java`, `pricebook/StoreVendorController.java`.

## vendor_item_cost_history

**Where:** Vendor Management → Pricing → Cost Change History. **Purpose:** Records changed costs from manual edits or differing invoice costs for the same vendor/item/store context.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `cost_history_id` | Identifies/links the cost change history record. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `vendor_id` | Links to the vendor record. | Workflow reference |
| `old_cost` | Cost before the recorded change. | Workflow reference |
| `new_cost` | Cost after the recorded change. | Workflow reference |
| `change_percentage` | Percentage difference between old and new costs. | Workflow reference |
| `effective_date` | Date the cost change applies. | Workflow reference |
| `change_source` | Origin of the cost change, such as manual or invoice. | Workflow reference |
| `changed_by` | User responsible for the change. | Workflow reference |
| `created_date` | History creation timestamp. | Workflow reference |
| `updated_date` | History update timestamp. | No explicit reference found; not confirmed connected |

**Source evidence:** `pricebook/VendorPricingController.java`, `pricebook/VendorCostController.java`.

## vendor_audit_log

**Where:** Vendor Management → Audit Log. **Purpose:** Records vendor/item actions and links cost-history events.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `audit_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `vendor_id` | Links to the vendor record. | Workflow reference |
| `product_id` | Links to the item record. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `action_type` | Vendor audit action category. | Workflow reference |
| `details` | Recorded vendor action details. | Workflow reference |
| `cost_history_id` | Identifies/links the cost change history record. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |

**Source evidence:** `pricebook/VendorPricingController.java`, `pricebook/VendorCostController.java`.

## access_audit_events

**Where:** Application audit services, including invoice and pricing changes. **Purpose:** General audit trail; not every event is exposed as a separate user-facing page.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `event_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `company_id` | Company scope for the audit event. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `actor_user_id` | User who performed the audited action. | Workflow reference |
| `event_type` | Application audit event category. | Workflow reference |
| `target_type` | Type of record changed. | Workflow reference |
| `target_id` | Identifier of the record changed. | Workflow reference |
| `changes` | Saved audit change details. | Workflow reference |
| `created_at` | Record creation timestamp. | Workflow reference |

**Source evidence:** `fuel/settings/GasSettingsController.java`, `fuel/price/StoreGasPriceController.java`, `access/ScopedAccess.java`, `access/AccessSchemaVerifier.java`.

## fuel_prices

**Where:** Gas → Price Changes / Schedule. **Purpose:** Stores manual/scheduled cash and credit prices. A Promotion reason label is not an automatic promotion discount engine.

| Column | How it is used / purpose | Connection evidence |
|---|---|---|
| `fuel_price_id` | Record identifier or relation key supporting this table. | Workflow reference |
| `dgt_id` | Store scope; keeps this record associated with its store. | Workflow reference |
| `fuel_grade_id` | Fuel grade whose price changes. | Workflow reference |
| `cash_price` | Manually assigned cash selling price per gallon. | Workflow reference |
| `credit_price` | Manually assigned credit selling price per gallon. | Workflow reference |
| `effective_from` | When this price begins applying. | Workflow reference |
| `effective_to` | When this price stops applying. | Workflow reference |
| `changed_by` | User responsible for the change. | Workflow reference |
| `created_at` | Record creation timestamp. | No explicit reference found; not confirmed connected |
| `updated_at` | Last update timestamp. | Workflow reference |

**Source evidence:** `fuel/price/StoreGasPriceController.java`.
