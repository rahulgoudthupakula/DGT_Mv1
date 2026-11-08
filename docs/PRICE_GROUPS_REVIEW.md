# Price Groups review — 2026-09-12

Inspection only; no application or database changes.

## Current behavior
- PriceGroupsPage.tsx uses four hardcoded groups and sample pricebookItems, kept only in React state. Reloading discards changes. Create/Edit changes displayed copies, not actual item prices.
- View/Create/Edit/Delete layout exists. removeItem helper exists but no item-removal control is rendered. Group IDs derive from array length and can collide after deletion. Selection uses SKU rather than database product ID.
- Index.tsx does not classify Price Groups as connected. Admin sees layout preview; other users reach the unfinished-page guard. Parent-store sync banner is still present despite separate-store default.
- Generic price-groups/product-price-groups backend endpoints exist but AccessPolicy denies them. No connected store-scoped workflow or atomic retail-price update exists.
- Items Price Group column is not populated by this page.

## Real database inspected read-only
- price_groups: price_group_id, price_group_name, description, is_active, created_at, updated_at, group_price, dgt_id. Store/name uniqueness, nonnegative price and store FK already exist.
- product_price_groups: product_price_group_id, price_group_id, product_id, created_at, updated_at. Unique group/product pair; individual foreign keys do not enforce that group and product belong to the same store. Multiple groups per product are currently allowed.
- Real dgt contains zero groups and zero product links. UI samples are not real records.

## Proposed implementation / decisions
- Preserve layout; use real current-store items and product IDs; connect admin/manager workflow with existing approval policy, concurrency protection and audit history.
- Save group price and affected item selling prices atomically; refresh Items group name, retail and margin. Costs stay independent. POS consumption is a later integration.
- Recommend one active price group per item to avoid conflicting group prices; confirm this rule.
- Recommend unlink/deactivate retains last saved item retail price, and group removal deactivates rather than deletes; confirm these rules.
- Add individual remove-item controls; replace sample counts with database counts; remove parent sync banner.
- Before schema implementation, propose same-store link constraints (and membership enforcement based on confirmed rule). Main group fields already exist; no need to duplicate them.

## Implementation update
Confirmed rules implemented and verified in test on 2026-09-12. See CHANGE_LOG.md for exact schema and checks; original inspection above describes the pre-implementation state. Production release pending.

## Latest pricing correction
Use existing regular retail and group_price columns only. Active membership resolves effective selling price without overwriting regular retail. The temporary individual_retail_price test column was removed. See CHANGE_LOG.md; this supersedes the prior separate-column design.
