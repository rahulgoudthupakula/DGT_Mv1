package com.dgt.backend.departments.service;
import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;

/**
 * Loads the bundled department catalog used to recognize default names and their subdepartments.
 */
@Component
public class DefaultDepartmentCatalog {
 // One bundled default department and its list of child names.
 public record Definition(String name,List<String> subDepartments){}
 private final List<Definition> definitions;
 // Read the classpath JSON once during component creation; loading errors prevent initialization.
 public DefaultDepartmentCatalog(ObjectMapper mapper) throws java.io.IOException {
  try(var input=new ClassPathResource("catalog/default-departments.json").getInputStream()) {
   definitions=List.of(mapper.readValue(input,Definition[].class));
  }
 }
 // Match the catalog name exactly, including case.
 public boolean contains(String name){return definitions.stream().anyMatch(d->d.name().equals(name));}
 // Return the matching child names, or an empty list for an unknown department.
 public List<String> children(String name){return definitions.stream().filter(d->d.name().equals(name)).findFirst().map(Definition::subDepartments).orElse(List.of());}
}
