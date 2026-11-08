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
        JpaTransactionManager tm = new JpaTransactionManager(emf);
        tm.setDataSource(dataSource);
        tm.setNestedTransactionAllowed(true);
        return tm;
    }
}
