# Shared discount type catalog

Implemented September 14, 2026. Applied to test and production databases.

Both promotion and vendor-contract responses now supply `discountTypes` from `discount_type`. Forms use the returned labels and values; server validation checks the same active catalog. Percentage is one shared row used by both contexts.

The catalog has five rows: Percentage, Amount off ($), Fixed selling price, Buy X Get Y, Bundle price. Promotion and contract applicability is defined by nullable `promotion_value` and `contract_value` compatibility keys. Existing selected values and queued approval payloads stay unchanged. Foreign keys link the existing `promotions.promotion_type` and `vendor_contacts.volume_discount_type` columns to those keys. No extra selection columns were added.

Calculation branches remain code: a catalog entry is not an executable discount algorithm. This change does not implement new POS discounts, eligibility rules or discount stacking. Names can be maintained centrally; compatibility keys must stay stable. No catalog editing UI was added.

Migration: `Backend/db/proposals/20260914_discount_type_catalog.sql`. Run once before deploying the updated backend. Production migrated and released September 14, 2026 (109 → 110 tables). Backend health and both catalog responses verified successfully; updated frontend served on port 5175. Backup: Backend/backups/dgt_before_discount_catalog.dump. Previous backend: /private/tmp/dgt-fleet-release/backend.jar; previous UI: /private/tmp/dgt-discount-release/previous-ui. Frontend/backend builds and 58 integration tests passed before release.
