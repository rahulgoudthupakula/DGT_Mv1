package com.dgt.backend.pos.controller;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
// Limit these connector response envelopes to PosController; admin endpoints retain their normal errors.
@RestControllerAdvice(assignableTypes=PosController.class)
public class PosErrors {
 // Preserve the HTTP error status, including identity conflicts, in a REJECTED envelope.
 @ExceptionHandler(ResponseStatusException.class) public ResponseEntity<?> rejected(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).body(Map.of("outcome","REJECTED","reason",e.getReason()==null?"Request rejected":e.getReason()));}
 // Return a fixed message for unreadable JSON rather than reflecting input or parser details.
 @ExceptionHandler(HttpMessageNotReadableException.class) public ResponseEntity<?> malformed(){return ResponseEntity.badRequest().body(Map.of("outcome","REJECTED","reason","Invalid JSON transaction"));}
}
