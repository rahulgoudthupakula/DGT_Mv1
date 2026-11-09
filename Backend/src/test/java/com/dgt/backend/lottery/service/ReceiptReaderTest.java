package com.dgt.backend.lottery.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

class ReceiptReaderTest {
    private final ReceiptReader reader = new ReceiptReader(new ObjectMapper(), "", "test-model");
    @Test void rejectsSpoofedAndOversizedUploads() {
        var spoofed = new MockMultipartFile("file", "receipt.pdf", "application/pdf", "not a PDF".getBytes());
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> ReceiptReader.validate(spoofed)).getStatusCode().value());
        var large = new MockMultipartFile("file", "receipt.png", "image/png", new byte[ReceiptReader.MAX_BYTES + 1]);
        assertEquals(413, assertThrows(ResponseStatusException.class, () -> ReceiptReader.validate(large)).getStatusCode().value());
        var empty = new MockMultipartFile("file", new byte[0]);
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> ReceiptReader.validate(empty)).getStatusCode().value());
    }
    @Test void missingKeyFailsClearlyWithoutProviderCall() {
        var file = new MockMultipartFile("file", "receipt.pdf", "application/pdf", "%PDF-1.7".getBytes());
        assertEquals(503, assertThrows(ResponseStatusException.class, () -> reader.read(file)).getStatusCode().value());
    }
    @Test void preservesBookNumberAndRequiresReviewForUnknownQuantity() {
        var result = reader.parse("""
          {"vendor":"Vendor", "invoice_number":"A1", "invoice_date":"bad-date", "lines":[
             {"description":"Game", "sku":"000123", "quantity":0}]}
          """);
        assertEquals("", result.get("invoiceDate"));
        var line = ((java.util.List<java.util.Map<String,Object>>)result.get("lines")).getFirst();
        assertEquals("000123",line.get("sku"));
        assertEquals(0,line.get("quantity"));
    }
    @Test void rejectsInvalidModelResponses() {
        for (String content : new String[]{"not json", "{}", "{\"lines\":[]}",
            "{\"lines\":[{\"description\":\"Game\",\"quantity\":1.5}]}",
            "{\"lines\":[{\"description\":\"Game\",\"quantity\":1001}]}"}) {
            assertEquals(422, assertThrows(ResponseStatusException.class, () -> reader.parse(content)).getStatusCode().value());
        }
    }
    @Test void providerSuccessAndFailureUseBoundedDraftContract() throws Exception {
        var http = org.mockito.Mockito.mock(java.net.http.HttpClient.class);
        java.net.http.HttpResponse<java.io.InputStream> response = org.mockito.Mockito.mock(java.net.http.HttpResponse.class);
        org.mockito.Mockito.when(http.send(org.mockito.ArgumentMatchers.any(java.net.http.HttpRequest.class),
            org.mockito.ArgumentMatchers.<java.net.http.HttpResponse.BodyHandler<java.io.InputStream>>any())).thenReturn(response);
        var service = new ReceiptReader(new ObjectMapper(), "fake-test-key", "test-model", http);
        var file = new MockMultipartFile("file", "receipt.pdf", "application/pdf", "%PDF-1.7".getBytes());
        String draft = "{\"lines\":[{\"description\":\"Game\",\"sku\":\"001\",\"quantity\":2}]}";
        byte[] payload = new ObjectMapper().writeValueAsBytes(java.util.Map.of("choices",java.util.List.of(java.util.Map.of("message",java.util.Map.of("content",draft)))));
        org.mockito.Mockito.when(response.statusCode()).thenReturn(200);
        org.mockito.Mockito.when(response.body()).thenReturn(new java.io.ByteArrayInputStream(payload));
        assertEquals(1, ((java.util.List<?>)service.read(file).get("lines")).size());
        org.mockito.Mockito.when(response.statusCode()).thenReturn(429);
        org.mockito.Mockito.when(response.body()).thenReturn(new java.io.ByteArrayInputStream(new byte[0]));
        assertEquals(429,assertThrows(ResponseStatusException.class,()->service.read(file)).getStatusCode().value());
        org.mockito.Mockito.when(response.statusCode()).thenReturn(401);
        org.mockito.Mockito.when(response.body()).thenReturn(new java.io.ByteArrayInputStream(new byte[0]));
        assertEquals(502,assertThrows(ResponseStatusException.class,()->service.read(file)).getStatusCode().value());
    }
}
