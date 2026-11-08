package com.dgt.backend.common.config;

import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.springframework.orm.jpa.vendor.HibernateJpaDialect;
import org.springframework.transaction.NestedTransactionNotSupportedException;
import org.springframework.transaction.SavepointManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionSystemException;

import java.sql.SQLException;
import java.sql.Savepoint;

public class HibernateNestedJpaDialect extends HibernateJpaDialect {

    @Override
    public Object beginTransaction(EntityManager em, TransactionDefinition definition)
            throws jakarta.persistence.PersistenceException, SQLException, TransactionException {
        return new SessionTransactionDataWrapper(super.beginTransaction(em, definition), em.unwrap(Session.class));
    }

    @Override
    public void cleanupTransaction(Object transactionData) {
        super.cleanupTransaction(
            transactionData instanceof SessionTransactionDataWrapper w ? w.delegate() : transactionData
        );
    }

    record SessionTransactionDataWrapper(Object delegate, Session session) implements SavepointManager {
        @Override
        public Object createSavepoint() throws TransactionException {
            try {
                return session.doReturningWork(con -> con.setSavepoint());
            } catch (Exception e) {
                throw new NestedTransactionNotSupportedException("Cannot create JDBC savepoint", e);
            }
        }

        @Override
        public void rollbackToSavepoint(Object savepoint) throws TransactionException {
            try {
                session.doWork(con -> con.rollback((Savepoint) savepoint));
            } catch (Exception e) {
                throw new TransactionSystemException("Cannot rollback to JDBC savepoint", e);
            }
        }

        @Override
        public void releaseSavepoint(Object savepoint) throws TransactionException {
            try {
                session.doWork(con -> {
                    try { con.releaseSavepoint((Savepoint) savepoint); } catch (SQLException ignored) {}
                });
            } catch (Exception ignored) {}
        }
    }
}
