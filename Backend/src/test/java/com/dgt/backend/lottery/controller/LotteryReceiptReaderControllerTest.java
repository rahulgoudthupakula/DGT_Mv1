package com.dgt.backend.lottery.controller;

import com.dgt.backend.access.security.PagePermissions;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.lottery.service.ReceiptReader;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class LotteryReceiptReaderControllerTest {
    @Test void checksPageAndOperationBeforeCallingReader() {
        var pages=mock(PagePermissions.class);
        var deliveries=mock(LotteryDeliveryController.class);
        var access=mock(ScopedAccess.class);
        var reader=mock(ReceiptReader.class);
        var controller=new LotteryReceiptReaderController(pages,deliveries,access,reader);
        var file=new MockMultipartFile("file", "%PDF-1.7".getBytes());
        var forbidden=new ResponseStatusException(HttpStatus.FORBIDDEN);
        doThrow(forbidden).when(pages).requireAny("denied", "LOTTERY_PAGE_RECEIVED_ADD");
        assertThrows(ResponseStatusException.class,()->controller.parse("denied",file));
        verifyNoInteractions(deliveries,reader);
        when(access.denied()).thenReturn(forbidden);
        assertThrows(ResponseStatusException.class,()->controller.parse("store",file));
        verifyNoInteractions(reader);
        when(deliveries.allowed("store","LOTTERY_RECEIVE_DELIVERY")).thenReturn(true);
        when(reader.read(file)).thenReturn(Map.of("vendor","Example"));
        assertEquals("Example", controller.parse("store",file).get("vendor"));
        verify(reader).read(file);
    }
    @Test void multipartEndpointRequiresFileAndReturnsDraft() throws Exception {
        var pages=mock(PagePermissions.class);
        var deliveries=mock(LotteryDeliveryController.class);
        var reader=mock(ReceiptReader.class);
        when(deliveries.allowed("store","LOTTERY_RECEIVE_DELIVERY")).thenReturn(true);
        when(reader.read(any())).thenReturn(Map.of("vendor","Example","invoiceNumber","R1","lines",java.util.List.of()));
        var mvc=org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(
            new LotteryReceiptReaderController(pages,deliveries,mock(ScopedAccess.class),reader))
            .setControllerAdvice(new com.dgt.backend.common.controller.ApiErrors()).build();
        String path="/api/v1/access/stores/store/lottery-deliveries/parse-receipt";
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(path))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(path)
            .file(new MockMultipartFile("file","receipt.pdf","application/pdf","%PDF-1.7".getBytes())))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.invoiceNumber").value("R1"));
    }
}
