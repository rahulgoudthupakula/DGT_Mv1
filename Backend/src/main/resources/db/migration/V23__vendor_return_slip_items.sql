-- Each slip can contain several approved reductions for one vendor/RMA.
ALTER TABLE inventory_return_items ADD COLUMN reduction_request_id bigint REFERENCES inventory_reduction_requests(reduction_request_id);
-- Preserve legacy header links without inventing links for unrelated historic lines.
UPDATE inventory_return_items i
SET reduction_request_id=r.reduction_request_id
FROM inventory_returns r JOIN inventory_reduction_requests q ON q.reduction_request_id=r.reduction_request_id
WHERE i.return_id=r.return_id AND i.product_id=q.product_id
 AND i.return_item_id=(SELECT min(s.return_item_id) FROM inventory_return_items s WHERE s.return_id=r.return_id AND s.product_id=q.product_id);
CREATE UNIQUE INDEX inventory_return_items_reduction_request_uq ON inventory_return_items(reduction_request_id) WHERE reduction_request_id IS NOT NULL;
