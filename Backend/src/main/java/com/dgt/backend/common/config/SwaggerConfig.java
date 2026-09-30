package com.dgt.backend.common.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.*;
import io.swagger.v3.oas.models.security.*;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("DGT Backend API")
                .version("0.1.0")
                .description("DGT POS & Retail Management System — multi-tenant convenience store platform")
                .contact(new Contact().name("DGT Technologies").url("https://dgttechnologies.com")))
            .addSecurityItem(new SecurityRequirement().addList("basicAuth"))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("basicAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP).scheme("basic")
                    .description("Email and password (used for login)"))
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP).scheme("bearer")
                    .description("Opaque session token from POST /api/v1/access/sessions")));
    }

    @Bean
    public GroupedOpenApi authGroup() {
        return GroupedOpenApi.builder().group("01-authentication").displayName("Authentication & Profile")
            .pathsToMatch(
                "/api/v1/access/me",
                "/api/v1/access/stores",
                "/api/v1/access/sessions/**",
                "/api/v1/access/profile/**",
                "/api/v1/signup-requests/**")
            .build();
    }

    @Bean
    public GroupedOpenApi storePermissionsGroup() {
        return GroupedOpenApi.builder().group("02-store-permissions").displayName("Store Access & Permissions")
            .pathsToMatch(
                "/api/v1/access/stores/{store}/context",
                "/api/v1/access/stores/{store}/permissions",
                "/api/v1/access/stores/{store}/roles",
                "/api/v1/access/stores/{store}/users",
                "/api/v1/access/stores/{store}/approval-policy",
                "/api/v1/access/stores/{store}/approvals/**",
                "/api/v1/access/stores/{store}/role-permissions/**",
                "/api/v1/access/stores/{store}/employee-access/**",
                "/api/v1/access/stores/{store}/manage-stores/**")
            .build();
    }

    @Bean
    public GroupedOpenApi storesGroup() {
        return GroupedOpenApi.builder().group("03-stores").displayName("Stores")
            .pathsToMatch(
                "/api/v1/stores/**",
                "/api/v1/store-business-hours/**",
                "/api/v1/store-contact-info/**")
            .build();
    }

    @Bean
    public GroupedOpenApi employeesGroup() {
        return GroupedOpenApi.builder().group("04-employees").displayName("Employees")
            .pathsToMatch(
                "/api/v1/employees/**",
                "/api/v1/employee-compensations/**",
                "/api/v1/employee-documents/**",
                "/api/v1/employee-emergency-contacts/**",
                "/api/v1/employee-schedules/**",
                "/api/v1/employee-status-histories/**",
                "/api/v1/employee-store-assignments/**",
                "/api/v1/employee-time-entries/**",
                "/api/v1/employee-time-off-requests/**",
                "/api/v1/access/stores/{store}/employees/**")
            .build();
    }

    @Bean
    public GroupedOpenApi workforceGroup() {
        return GroupedOpenApi.builder().group("05-workforce").displayName("Workforce")
            .pathsToMatch("/api/v1/access/stores/{store}/workforce/**")
            .build();
    }

    @Bean
    public GroupedOpenApi billingGroup() {
        return GroupedOpenApi.builder().group("06-billing").displayName("Billing")
            .pathsToMatch(
                "/api/v1/billing-invoices/**",
                "/api/v1/store-subscriptions/**",
                "/api/v1/subscription-plans/**",
                "/api/v1/access/stores/{store}/billing/**")
            .build();
    }

    @Bean
    public GroupedOpenApi salesGroup() {
        return GroupedOpenApi.builder().group("07-sales").displayName("Sales & POS")
            .pathsToMatch(
                "/api/v1/sales/**",
                "/api/v1/sale-payments/**",
                "/api/v1/sale-items/**",
                "/api/v1/pos-terminals/**",
                "/api/v1/tender-types/**",
                "/api/v1/access/stores/{store}/live-activity/**")
            .build();
    }

    @Bean
    public GroupedOpenApi dailyClosingGroup() {
        return GroupedOpenApi.builder().group("08-daily-closing").displayName("Daily Closing")
            .pathsToMatch(
                "/api/v1/daily-closing-deposits/**",
                "/api/v1/daily-closing-tenders/**",
                "/api/v1/daily-expenses/**",
                "/api/v1/everyday-closings/**",
                "/api/v1/access/stores/{store}/daily-closing/**")
            .build();
    }

    @Bean
    public GroupedOpenApi tenderGroup() {
        return GroupedOpenApi.builder().group("09-tender").displayName("Tender (Credit Card, EBT, Fleet)")
            .pathsToMatch(
                "/api/v1/access/stores/{store}/credit-card/**",
                "/api/v1/access/stores/{store}/ebt/**",
                "/api/v1/access/stores/{store}/fleet/**")
            .build();
    }

    @Bean
    public GroupedOpenApi gasGroup() {
        return GroupedOpenApi.builder().group("10-gas").displayName("Gas & Fuel")
            .pathsToMatch(
                "/api/v1/fuel-grades/**",
                "/api/v1/fuel-invoice-details/**",
                "/api/v1/fuel-invoice-items/**",
                "/api/v1/fuel-prices/**",
                "/api/v1/fuel-pumps/**",
                "/api/v1/fuel-tanks/**",
                "/api/v1/fuel-tank-grade-assignments/**",
                "/api/v1/fuel-tank-readings/**",
                "/api/v1/access/stores/{store}/gas-deliveries/**",
                "/api/v1/access/stores/{store}/gas-prices/**",
                "/api/v1/access/stores/{store}/gas-adjustments/**",
                "/api/v1/access/stores/{store}/gas-settings/**",
                "/api/v1/access/stores/{store}/gas-tank-report/**")
            .build();
    }

    @Bean
    public GroupedOpenApi lotteryGroup() {
        return GroupedOpenApi.builder().group("11-lottery").displayName("Lottery")
            .pathsToMatch(
                "/api/v1/lottery-games/**",
                "/api/v1/lottery-packs/**",
                "/api/v1/lottery-pack-inventories/**",
                "/api/v1/lottery-pack-inventory-items/**",
                "/api/v1/lottery-settings/**",
                "/api/v1/lottery-settlements/**",
                "/api/v1/access/stores/{store}/lottery-games/**",
                "/api/v1/access/stores/{store}/lottery-deliveries/**",
                "/api/v1/access/stores/{store}/lottery-closing/**",
                "/api/v1/access/stores/{store}/lottery-dispositions/**",
                "/api/v1/access/stores/{store}/lottery-verification/**",
                "/api/v1/access/stores/{store}/lottery-pack-history/**")
            .build();
    }

    @Bean
    public GroupedOpenApi pricebookGroup() {
        return GroupedOpenApi.builder().group("12-pricebook").displayName("Price Book & Grocery")
            .pathsToMatch(
                "/api/v1/access/stores/{store}/items/**",
                "/api/v1/access/stores/{store}/discounts/**",
                "/api/v1/access/stores/{store}/checkout-discounts/**",
                "/api/v1/access/stores/{store}/price-groups/**",
                "/api/v1/access/stores/{store}/promotions/**",
                "/api/v1/access/stores/{store}/new-arrivals/**",
                "/api/v1/access/stores/{store}/invoice-entry/**",
                "/api/v1/access/stores/{store}/purchase-orders/**",
                "/api/v1/access/stores/{store}/rebates/**",
                "/api/v1/access/stores/{store}/reductions/**",
                "/api/v1/access/stores/{store}/current-stock/**",
                "/api/v1/access/stores/{store}/grocery-settings/**",
                "/api/v1/access/stores/{store}/grocery-reports/**",
                "/api/v1/access/stores/{store}/vendors/**")
            .build();
    }

    @Bean
    public GroupedOpenApi productsGroup() {
        return GroupedOpenApi.builder().group("13-products").displayName("Products & Catalog")
            .pathsToMatch(
                "/api/v1/products/**",
                "/api/v1/brands/**",
                "/api/v1/new-arrivals/**",
                "/api/v1/product-barcodes/**",
                "/api/v1/barcode-lookup/**",
                "/api/v1/price-groups/**",
                "/api/v1/product-price-groups/**",
                "/api/v1/product-store-prices/**",
                "/api/v1/product-vendors/**",
                "/api/v1/promotions/**",
                "/api/v1/promotion-products/**")
            .build();
    }

    @Bean
    public GroupedOpenApi vendorsGroup() {
        return GroupedOpenApi.builder().group("14-vendors").displayName("Vendors")
            .pathsToMatch(
                "/api/v1/vendors/**",
                "/api/v1/vendor-contacts/**",
                "/api/v1/vendor-audit-logs/**",
                "/api/v1/vendor-item-cost-histories/**",
                "/api/v1/vendor-price-settings/**")
            .build();
    }

    @Bean
    public GroupedOpenApi inventoryGroup() {
        return GroupedOpenApi.builder().group("15-inventory").displayName("Inventory")
            .pathsToMatch(
                "/api/v1/inventory/**",
                "/api/v1/inventory-movements/**",
                "/api/v1/inventory-reduction-requests/**",
                "/api/v1/inventory-returns/**",
                "/api/v1/inventory-return-items/**",
                "/api/v1/inventory-shrinkages/**",
                "/api/v1/inventory-shrinkage-items/**",
                "/api/v1/inventory-transfers/**",
                "/api/v1/inventory-transfer-items/**")
            .build();
    }

    @Bean
    public GroupedOpenApi invoicesGroup() {
        return GroupedOpenApi.builder().group("16-invoices").displayName("Invoices")
            .pathsToMatch(
                "/api/v1/invoices/**",
                "/api/v1/invoice-documents/**",
                "/api/v1/invoice-charges/**",
                "/api/v1/invoice-adjustments/**",
                "/api/v1/invoice-audit-logs/**",
                "/api/v1/grocery-invoice-items/**")
            .build();
    }

    @Bean
    public GroupedOpenApi departmentsGroup() {
        return GroupedOpenApi.builder().group("17-departments").displayName("Departments")
            .pathsToMatch(
                "/api/v1/departments/**",
                "/api/v1/store-departments/**",
                "/api/v1/store-sub-departments/**",
                "/api/v1/stores/{dgtId}/department-access/**")
            .build();
    }

    @Bean
    public GroupedOpenApi reportsGroup() {
        return GroupedOpenApi.builder().group("18-reports").displayName("Reports")
            .pathsToMatch(
                "/api/v1/reports/**",
                "/api/v1/access/stores/{store}/pos-reports/**",
                "/api/v1/access/stores/{store}/sales-statistics/**",
                "/api/v1/access/stores/{store}/tender-reports/**")
            .build();
    }

    @Bean
    public GroupedOpenApi payrollGroup() {
        return GroupedOpenApi.builder().group("19-payroll").displayName("Payroll")
            .pathsToMatch("/api/v1/payroll/**")
            .build();
    }

    @Bean
    public GroupedOpenApi systemGroup() {
        return GroupedOpenApi.builder().group("20-system").displayName("System & Identity")
            .pathsToMatch(
                "/api/v1/health",
                "/api/v1/internal/**",
                "/api/v1/client-handling/**",
                "/api/v1/deferred/**",
                "/api/v1/modules/**",
                "/api/v1/permissions/**",
                "/api/v1/role-types/**",
                "/api/v1/status-types/**",
                "/api/v1/users/**",
                "/api/v1/user-roles/**")
            .build();
    }
}
