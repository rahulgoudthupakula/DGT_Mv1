-- Simplify approved-reduction return slips without deleting tracking history.
UPDATE inventory_returns SET status='PENDING'
WHERE reduction_request_id IS NOT NULL AND status IN ('DRAFT','SENT');
UPDATE inventory_returns SET status='CLOSED',settled_at=COALESCE(settled_at,updated_at)
WHERE reduction_request_id IS NOT NULL AND status='CREDIT_RECEIVED';
