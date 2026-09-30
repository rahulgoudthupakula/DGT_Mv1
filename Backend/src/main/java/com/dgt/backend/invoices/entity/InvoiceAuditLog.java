package com.dgt.backend.invoices.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@Table(name = "invoice_audit_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_audit_log_id")
    private Long invoiceAuditLogId;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "action_by")
    private Long actionBy;

    @Column(name = "old_value", columnDefinition = "text")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "text")
    private String newValue;
}
