package com.dgt.backend.departments.service;
import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;
@Component
public class DefaultDepartmentCatalog {
 public record Definition(String name,List<String> subDepartments){}
 private final List<Definition> definitions;
 public DefaultDepartmentCatalog(ObjectMapper mapper) throws java.io.IOException {
  try(var input=new ClassPathResource("catalog/default-departments.json").getInputStream()) {
   definitions=List.of(mapper.readValue(input,Definition[].class));
  }
 }
 public boolean contains(String name){return definitions.stream().anyMatch(d->d.name().equals(name));}
 public List<String> children(String name){return definitions.stream().filter(d->d.name().equals(name)).findFirst().map(Definition::subDepartments).orElse(List.of());}
}
