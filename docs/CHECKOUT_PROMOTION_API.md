# Checkout promotion pricing

The backend prices promotions for an existing open SALE ticket, before tendering or register discounts. The browser has no checkout screen and the external POS must call these endpoints before payment. Completed POS ingestion preserves the POS receipt amounts and does not reprice historical sales.

## Preview and apply

POST `/api/v1/access/stores/{store}/checkout-promotions/preview` with `{"saleId":123}`. A store administrator, pricebook manager, or the ticket's assigned cashier may call it. Prices and quantities come from the stored sale, not the request.

The response includes `quoteVersion`, `gross`, `discount`, `net` (merchandise subtotal), `taxable`, `tax`, `total`, and `lines`. Each line contains its amounts and selected promotion IDs/names, quantities, and discounts. Preview does not write the ticket.

POST `/api/v1/access/stores/{store}/checkout-promotions` with `{"saleId":123,"quoteVersion":"<preview value>"}` and a UUID `Idempotency-Key` header. Apply recalculates and verifies the quote before atomically writing line/header amounts and a permanent calculation snapshot. Repeating the same key, actor, sale, and quote returns the original result. Changed tickets or eligible rules return 409: preview again.

Apply promotions after the basket is final. Applying a different key to an already-priced ticket is rejected; automatic removal/repricing after basket edits is not supported yet. Do not add or edit lines after apply. Tickets with prior line discounts, register discounts/pending requests, or payments are rejected. Later register discounts retain their existing `combinePromotions` rule.

## Selection rules

- Only enabled promotions whose start/end timestamps include now and whose discount type is enabled qualify. Linked products must be active and belong to the store.
- Minimize the merchandise subtotal before tax over all eligible combinations, allowing the original ticket price whenever an offer would increase it. Tax is calculated afterward; the optimizer does not choose offers based on differing tax rates.
- Fixed-price and percentage offers apply independently to eligible units. Percentage discounts round half-up to cents per whole unit; fractional remainders round separately.
- A bundle consumes the configured quantity of every linked product and charges its bundle price. Savings are allocated proportionally across consumed lines, with cumulative cent rounding.
- Buy X Get Y consumes X+Y whole units from the linked products (mix and match). The Y cheapest units within each selected group are free. Groupings are optimized, and an offer can repeat when enough units remain.
- Units consumed by one offer cannot receive a second promotion. Remaining units can receive a different offer. Fractional remainders qualify only for fixed/percentage offers, never bundles/Buy X Get Y.
- Equal savings use stable traversal ordered by promotion ID and sale line ID. Existing simple offers win ties with multi-item offers.
- Ordinary proportional line taxes are recalculated from the existing line tax rate and rounded half-up. Tickets with partial tax bases or unsupported tax shapes return 409 for POS-specific calculation.

The exact search is bounded (500 lines/offers, 500 whole units involved in multi-item offers, 30,000 candidate groups, 60,000 memo states, 2 million work steps). Overly complex baskets return 422 with a request to simplify offers or split the ticket. The engine never silently substitutes a heuristic for the best-price calculation.

## Database

Run Flyway migration V20 before deploying this backend. `sale_promotion_applications` retains the quote and actor for audit and retries. It grants `dgt_app` SELECT/INSERT plus sequence usage only when that role exists; no deletion permission is added.
