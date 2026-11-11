package com.dgt.backend.common.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.JacksonModule;
import tools.jackson.databind.PropertyName;
import tools.jackson.databind.cfg.MapperConfig;
import tools.jackson.databind.introspect.Annotated;
import tools.jackson.databind.introspect.AnnotatedMember;
import tools.jackson.databind.introspect.AnnotatedParameter;
import tools.jackson.databind.introspect.NopAnnotationIntrospector;
import tools.jackson.databind.module.SimpleModule;

/** Accept browser record field names alongside the existing snake_case JSON contract. */
@Configuration
public class RecordRequestJsonConfig {
    @Bean
    JacksonModule recordRequestAliases() {
        return new SimpleModule("record-request-aliases") {
            @Override
            public void setupModule(SetupContext context) {
                super.setupModule(context);
                context.appendAnnotationIntrospector(new NopAnnotationIntrospector() {
                    @Override
                    public List<PropertyName> findPropertyAliases(MapperConfig<?> config, Annotated annotated) {
                        if (!(annotated instanceof AnnotatedMember member)) return null;
                        Class<?> type = member.getDeclaringClass();
                        if (!type.isRecord() || !type.getPackageName().startsWith("com.dgt.backend.")) return null;
                        var components = type.getRecordComponents();
                        String name = annotated instanceof AnnotatedParameter parameter
                                ? components[parameter.getIndex()].getName() : annotated.getName();
                        return Arrays.stream(components).anyMatch(component -> component.getName().equals(name))
                                ? List.of(PropertyName.construct(name)) : null;
                    }
                });
            }
        };
    }
}
