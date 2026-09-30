package com.dgt.backend.workforce;
import java.time.LocalDate;import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@RequestMapping("/api/v1/access/stores/{store}/workforce")
@ConditionalOnProperty(name="app.workforce.enabled",havingValue="true")
public class WorkforceController {
 private final WorkforceService service;public WorkforceController(WorkforceService service){this.service=service;}
 @GetMapping public Object read(@PathVariable String store,@RequestParam(required=false) LocalDate week){return service.read(store,week);}
 @PostMapping("/shifts") public Object add(@PathVariable String store,@RequestBody WorkforceService.ShiftInput in){return service.saveShift(store,null,in);}
 @PutMapping("/shifts/{id}") public Object edit(@PathVariable String store,@PathVariable long id,@RequestBody WorkforceService.ShiftInput in){return service.saveShift(store,id,in);}
 @PostMapping("/week") public Object week(@PathVariable String store,@RequestBody WorkforceService.WeekAction in){return service.weekAction(store,in);}
 public record Version(String version){}
 @PostMapping("/shifts/{id}/cancel") public Object cancel(@PathVariable String store,@PathVariable long id,@RequestBody Version in){return service.cancelShift(store,id,in.version());}
 @PostMapping("/requests") public Object request(@PathVariable String store,@RequestBody WorkforceService.RequestInput in,@RequestHeader("Idempotency-Key") UUID key){return service.request(store,in,key);}
 @PostMapping("/requests/{id}/decision") public Object decision(@PathVariable String store,@PathVariable long id,@RequestBody WorkforceService.Decision in){return service.decide(store,id,in);}
}
