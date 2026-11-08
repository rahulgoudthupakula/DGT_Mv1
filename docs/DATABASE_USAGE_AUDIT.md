# Database usage audit

Source/schema audit: September 14, 2026. Production public schema: **109 tables**.

- **89 tables:** direct SQL references found in currently connected backend workflow/infrastructure code. This is not a claim that every column or UI feature is complete.
- **20 tables:** no direct SQL use found in those current workflows. All 20 currently contain zero production rows.
- **82 tables are empty overall**, including 62 with current source references. Empty alone is not a deletion criterion.
- **No table is certified safe to delete by this audit.** Generic scaffolded CRUD exists for some tables but is not evidence of a live feature; unmatched routes are denied by SecurityConfig. External consumers and runtime query telemetry were not audited.

## The 20 tables without current connected use

| Table | Recommendation | Why |
|---|---|---|
| `brands` | Keep: referenced lookup | products.brand_id references it. Brand maintenance is not connected; do not remove this lookup without revising that relationship. |
| `employee_documents` | Future employee feature | Employee document storage; not connected in current employee workflows. |
| `employee_emergency_contacts` | Future employee feature | Emergency contact storage; not connected in current employee workflows. |
| `employee_status_history` | Future employee feature | Historical employee status changes; current employee operations do not use this separate history. |
| `employee_time_entries` | Future attendance feature | Employee clock/time records. Time & Attendance was deferred until POS integration. |
| `fuel_invoice_details` | Future or consolidation review | Older fuel invoice header/detail structure; current gas deliveries use fuel_deliveries and fuel_delivery_lines. |
| `fuel_invoice_items` | Future or consolidation review | Older fuel invoice lines; decide whether these are needed for later fuel-cost/invoice work. |
| `fuel_pumps` | Future POS/pump feature | Pump records; current fuel settings/delivery/price workflow does not directly use them. |
| `inventory_shrinkage` | Consolidation candidate | Current Shrinkage & Waste uses approved inventory_reduction_requests and inventory movements instead. |
| `inventory_shrinkage_items` | Consolidation candidate | Legacy shrinkage detail records; linked to inventory_shrinkage, not the current reduction workflow. |
| `invoice_adjustments` | Future or consolidation review | Separate invoice adjustments are not used by current pre-approval invoice editing. |
| `invoice_audit_log` | Consolidation candidate | Current invoice enter/edit/approve actions use the general access_audit_events audit service. |
| `invoice_documents` | Future attachment feature | Invoice document storage; no current connected workflow found. |
| `lottery_games` | Future lottery module | Lottery game catalog; closing lottery readings do not use this table. |
| `lottery_pack_inventory` | Future lottery module | Lottery pack inventory header; closing lottery readings do not use this table. |
| `lottery_pack_inventory_items` | Future lottery module | Pack inventory details; references lottery_pack_inventory and lottery_packs. |
| `lottery_packs` | Future lottery module | Lottery pack records; referenced by pack inventory details. |
| `lottery_settings` | Future lottery module | Lottery-specific settings; not connected in current workflows. |
| `lottery_settlements` | Future lottery module | Separate lottery settlements; current daily closing readings are stored on everyday_closing. |
| `new_arrivals` | Consolidation candidate | Current New Arrivals reads approved invoices and grocery_invoice_items.is_product_new instead of this table. |

## Evidence and limits

The audit compares production information_schema columns, table row counts, constraints and custom triggers with direct SQL references in scoped access, price book, workforce, employee settings, fuel, live sales, tender, billing and daily-closing code. Generic entity/repository/controller scaffolding alone was excluded. No custom trigger was found on the 20 tables. Brands and lottery/shrinkage detail relationships still matter even when empty.

Key source locations: `common/config/SecurityConfig.java`, `pricebook/StoreNewArrivalsController.java`, `pricebook/StoreReductionController.java`, `pricebook/StoreInvoiceEntryController.java`, and `access/ScopedAccess.java` under `Backend/src/main/java/com/dgt/backend`.

The clearest consolidation candidates are `new_arrivals`, `inventory_shrinkage`, `inventory_shrinkage_items` and `invoice_audit_log`. Removal would still require checking migrations, generic code, external integrations and foreign keys. No database changes were made.

## All 109 tables

Rows are a point-in-time production count. Source paths below are relative to `Backend/src/main/java/com/dgt/backend`.

| Table | Production rows | Current source reference |
|---|---:|---|
| `access_audit_events` | 22 | `fuel/settings/GasSettingsController.java`; `fuel/price/StoreGasPriceController.java` |
| `approval_requests` | 0 | `access/AccessSchemaVerifier.java`; `access/ApprovalService.java` |
| `billing_addons` | 3 | `billing/service/StoreBilling.java` |
| `billing_change_requests` | 1 | `billing/service/StoreBilling.java` |
| `billing_invoices` | 1 | `billing/service/StoreBilling.java` |
| `brands` | 0 | None found in current connected workflows |
| `companies` | 2 | `access/AccessController.java`; `access/RoleAccessController.java` |
| `company_admins` | 4 | `access/ScopedAccess.java`; `access/AccessSchemaVerifier.java` |
| `credit_card_batch_payments` | 0 | `tender/controller/CreditCardController.java` |
| `credit_card_batches` | 0 | `tender/controller/CreditCardController.java` |
| `credit_card_processors` | 0 | `tender/controller/CreditCardController.java` |
| `credit_card_settings` | 0 | `tender/controller/CreditCardController.java` |
| `daily_closing_deposits` | 0 | `dailyclosing/scoped/ClosingReconciliation.java` |
| `daily_closing_tenders` | 0 | `dailyclosing/scoped/StoreClosingController.java` |
| `daily_expenses` | 0 | `dailyclosing/scoped/ClosingReconciliation.java`; `dailyclosing/scoped/StoreClosingController.java` |
| `departments` | 32 | `access/ApprovalService.java`; `departments/controller/StoreDepartmentAccessController.java` |
| `ebt_batch_payments` | 0 | `tender/controller/EbtController.java` |
| `ebt_batches` | 0 | `tender/controller/EbtController.java` |
| `employee_compensation` | 6 | `employees/controller/StoreEmployeesController.java` |
| `employee_deductions` | 0 | `employees/controller/EmployeeDetails.java` |
| `employee_deposit_instructions` | 1 | `employees/controller/EmployeeDetails.java` |
| `employee_documents` | 0 | None found in current connected workflows |
| `employee_emergency_contacts` | 0 | None found in current connected workflows |
| `employee_schedules` | 2 | `workforce/WorkforceService.java` |
| `employee_status_history` | 0 | None found in current connected workflows |
| `employee_store_assignments` | 9 | `sales/activity/LiveActivityController.java`; `workforce/WorkforceService.java` |
| `employee_time_entries` | 0 | None found in current connected workflows |
| `employee_time_off_requests` | 1 | `workforce/WorkforceService.java` |
| `employees` | 6 | `sales/activity/LiveActivityController.java`; `workforce/WorkforceService.java` |
| `everyday_closing` | 0 | `dailyclosing/scoped/ClosingReconciliation.java`; `dailyclosing/scoped/StoreClosingController.java` |
| `fleet_batch_payments` | 0 | `tender/controller/FleetController.java` |
| `fleet_batches` | 0 | `tender/controller/FleetController.java` |
| `fuel_adjustment_lines` | 0 | `fuel/adjustment/GasAdjustmentController.java` |
| `fuel_adjustments` | 0 | `fuel/adjustment/GasAdjustmentController.java` |
| `fuel_deliveries` | 0 | `fuel/delivery/GasDeliveryController.java` |
| `fuel_delivery_lines` | 0 | `fuel/delivery/GasDeliveryController.java` |
| `fuel_grades` | 0 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `fuel_invoice_details` | 0 | None found in current connected workflows |
| `fuel_invoice_items` | 0 | None found in current connected workflows |
| `fuel_prices` | 0 | `fuel/price/StoreGasPriceController.java` |
| `fuel_pumps` | 0 | None found in current connected workflows |
| `fuel_tank_grade_assignments` | 0 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `fuel_tank_readings` | 0 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `fuel_tanks` | 0 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `gas_settings` | 0 | `fuel/settings/GasSettingsController.java` |
| `grocery_invoice_items` | 0 | `pricebook/VendorPricingController.java`; `pricebook/ItemSellingPrice.java` |
| `grocery_settings` | 0 | `pricebook/GrocerySettingsController.java`; `pricebook/StoreInvoiceEntryController.java` |
| `inventory` | 0 | `pricebook/StoreStockController.java`; `pricebook/StoreReductionController.java` |
| `inventory_movements` | 0 | `fuel/adjustment/GasAdjustmentController.java`; `fuel/delivery/GasDeliveryController.java` |
| `inventory_reduction_requests` | 0 | `pricebook/StoreReductionController.java` |
| `inventory_return_items` | 0 | `pricebook/StoreReductionController.java` |
| `inventory_returns` | 0 | `pricebook/StoreReductionController.java` |
| `inventory_shrinkage` | 0 | None found in current connected workflows |
| `inventory_shrinkage_items` | 0 | None found in current connected workflows |
| `inventory_transfer_items` | 0 | `pricebook/StoreReductionController.java` |
| `inventory_transfers` | 0 | `pricebook/StoreReductionController.java` |
| `invoice_adjustments` | 0 | None found in current connected workflows |
| `invoice_audit_log` | 0 | None found in current connected workflows |
| `invoice_charges` | 0 | `pricebook/StoreInvoiceEntryController.java` |
| `invoice_documents` | 0 | None found in current connected workflows |
| `invoices` | 0 | `pricebook/VendorPricingController.java`; `pricebook/ItemSellingPrice.java` |
| `lottery_games` | 0 | None found in current connected workflows |
| `lottery_pack_inventory` | 0 | None found in current connected workflows |
| `lottery_pack_inventory_items` | 0 | None found in current connected workflows |
| `lottery_packs` | 0 | None found in current connected workflows |
| `lottery_settings` | 0 | None found in current connected workflows |
| `lottery_settlements` | 0 | None found in current connected workflows |
| `module_approval_policies` | 0 | `access/AccessController.java`; `access/ScopedAccess.java` |
| `modules` | 3 | `access/AccessController.java`; `access/ScopedAccess.java` |
| `new_arrivals` | 0 | None found in current connected workflows |
| `permissions` | 0 | `access/AccessController.java`; `access/AccessSchemaVerifier.java` |
| `pos_terminals` | 0 | `sales/activity/LiveActivityController.java` |
| `price_groups` | 0 | `pricebook/ItemSellingPrice.java`; `pricebook/BulkItemLinks.java` |
| `product_barcodes` | 0 | `pricebook/StoreReductionController.java`; `pricebook/StoreVendorController.java` |
| `product_price_groups` | 0 | `pricebook/ItemSellingPrice.java`; `pricebook/BulkItemLinks.java` |
| `product_store_prices` | 0 | `pricebook/StoreReductionController.java`; `pricebook/StorePriceGroupController.java` |
| `product_vendors` | 0 | `pricebook/StoreStockController.java`; `pricebook/StoreReductionController.java` |
| `products` | 0 | `sales/activity/LiveActivityController.java`; `tender/controller/FleetController.java` |
| `promotion_products` | 0 | `pricebook/BulkItemLinks.java`; `pricebook/StorePromotionController.java` |
| `promotions` | 0 | `pricebook/BulkItemLinks.java`; `pricebook/StorePromotionController.java` |
| `purchase_order_lines` | 0 | `pricebook/StorePurchaseOrderController.java`; `pricebook/StoreInvoiceEntryController.java` |
| `purchase_orders` | 0 | `pricebook/StorePurchaseOrderController.java`; `pricebook/StoreInvoiceEntryController.java` |
| `role_types` | 4 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `sale_payments` | 0 | `sales/activity/LiveActivityController.java`; `tender/controller/EbtController.java` |
| `sales` | 0 | `sales/activity/LiveActivityController.java`; `tender/controller/EbtController.java` |
| `sales_items` | 0 | `sales/activity/LiveActivityController.java`; `tender/controller/FleetController.java` |
| `status_types` | 4 | `workforce/WorkforceService.java`; `pricebook/StoreInvoiceEntryController.java` |
| `store_billing_addons` | 0 | `billing/service/StoreBilling.java` |
| `store_business_hours` | 42 | `stores/service/StoreHoursService.java` |
| `store_contact_info` | 6 | `stores/controller/StoreSettingsController.java` |
| `store_departments` | 0 | `access/ApprovalService.java`; `sales/activity/LiveActivityController.java` |
| `store_role_permissions` | 72 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `store_sub_departments` | 0 | `sales/activity/LiveActivityController.java`; `tender/controller/FleetController.java` |
| `store_subscriptions` | 1 | `billing/service/StoreBilling.java` |
| `stores` | 6 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `subscription_plans` | 3 | `billing/service/StoreBilling.java` |
| `tender_types` | 0 | `sales/activity/LiveActivityController.java`; `tender/controller/EbtController.java` |
| `user_login_events` | 57 | `access/ProfileSessions.java`; `access/ProfileSessionController.java` |
| `user_roles` | 12 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `user_sessions` | 57 | `access/ProfileController.java`; `access/ProfileSessions.java` |
| `users` | 11 | `fuel/settings/GasSettingsController.java`; `fuel/adjustment/GasAdjustmentController.java` |
| `vendor_audit_log` | 0 | `pricebook/VendorPricingController.java`; `pricebook/VendorCostController.java` |
| `vendor_contacts` | 0 | `pricebook/StoreVendorController.java` |
| `vendor_item_cost_history` | 0 | `pricebook/VendorPricingController.java`; `pricebook/VendorCostController.java` |
| `vendor_price_settings` | 0 | `pricebook/VendorPricingController.java` |
| `vendors` | 0 | `fuel/delivery/GasDeliveryController.java`; `pricebook/VendorPricingController.java` |
| `workforce_availability` | 0 | `workforce/WorkforceService.java` |
| `workforce_leave_shifts` | 0 | `workforce/WorkforceService.java` |
| `workforce_requests` | 1 | `workforce/WorkforceService.java` |
