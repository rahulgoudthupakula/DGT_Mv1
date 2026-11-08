package com.dgt.backend.common.config;

import javax.sql.DataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.jpa.JpaTransactionManager;

@Configuration
public class TransactionConfig {

    @Bean
    @Primary
    public JpaTransactionManager transactionManager(EntityManagerFactory emf, DataSource dataSource) {
        // Anonymous subclass so afterPropertiesSet() can install the custom dialect last,
        // overriding the HibernateJpaDialect that Spring Boot auto-detects from the EMF.
        JpaTransactionManager tm = new JpaTransactionManager(emf) {
            @Override
            public void afterPropertiesSet() {
                super.afterPropertiesSet();
                setJpaDialect(new HibernateNestedJpaDialect());
                setNestedTransactionAllowed(true);
            }
        };
        tm.setDataSource(dataSource);
        return tm;
    }
}
