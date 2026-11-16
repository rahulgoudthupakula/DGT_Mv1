-- Vendor Recall is one returnable reason. Reclassify existing requests only;
-- their approved stock movements and quantities must not be posted again.
UPDATE inventory_reduction_requests
SET reason='vendor-recall',request_type='returnable'
WHERE reason IN ('vendor-recall','vendor-recall-disposal');
