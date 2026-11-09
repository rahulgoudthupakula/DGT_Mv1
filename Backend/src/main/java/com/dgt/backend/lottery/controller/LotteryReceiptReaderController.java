package com.dgt.backend.lottery.controller;

import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.lottery.service.ReceiptReader;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Uses the same store, page and receiving permissions as manual receipt creation. */
@RestController
@RequestMapping("/api/v1/access/stores/{store}/lottery-deliveries")
public class LotteryReceiptReaderController {
    private final PagePermissions pages;
    private final LotteryDeliveryController deliveries;
    private final ScopedAccess access;
    private final ReceiptReader reader;
    public LotteryReceiptReaderController(PagePermissions pages, LotteryDeliveryController deliveries,
            ScopedAccess access, ReceiptReader reader) {
        this.pages=pages; this.deliveries=deliveries; this.access=access; this.reader=reader;
    }
    @PostMapping(value="/parse-receipt", consumes="multipart/form-data")
    public Map<String,Object> parse(@PathVariable String store, @RequestParam("file") MultipartFile file) {
        pages.requireAny(store,"LOTTERY_PAGE_RECEIVED_ADD");
        if (!deliveries.allowed(store,"LOTTERY_RECEIVE_DELIVERY")) throw access.denied();
        return reader.read(file);
    }
}
