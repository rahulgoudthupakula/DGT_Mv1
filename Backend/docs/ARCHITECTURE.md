# Topic-based backend structure

The application entry point stays at `src/main/java/com/dgt/backend/DgtApplication.java`. Its component scan discovers the topic packages below it.

Each business topic has five layers. For example:

```text
com/dgt/backend/stores/
├── database/
│   ├── StoreDatabase.java
│   └── README.md
├── entity/
│   └── Store.java
├── repository/
│   └── StoreRepository.java
├── service/
│   └── StoreService.java
├── controller/
│   └── StoreController.java
└── dto/
    └── StoreRequest.java
```

`dto` is an additional folder for validated API request objects. Request bodies are separate from persisted entities so callers cannot submit internal audit fields or database versions as writable fields.

| Requested topic | Package | Main entities |
| --- | --- | --- |
| Stores | `stores` | Store |
| Users / Roles / Permissions | `identity` | AppUser, Role, Permission, UserRole, RolePermission |
| Departments / Subdepartments | `departments` | Department, Subdepartment |
| Products | `products` | Product |
| Product Barcodes | `productbarcodes` | ProductBarcode |
| Vendors | `vendors` | Vendor |
| Product Vendors | `productvendors` | ProductVendor |
| Product Store Prices | `productstoreprices` | ProductStorePrice |
| Inventory | `inventory` | InventoryBalance |
| Inventory Movements | `inventorymovements` | InventoryMovement |
| Promotions | `promotions` | Promotion |
| Sales / POS Transactions | `sales` | Sale, SaleLine |
| Employees | `employees` | Employee |
| Fuel | `fuel` | FuelTank, FuelReading |
| Lottery | `lottery` | LotteryGame, LotterySettlement |
| Daily Closing / Reconciliation | `dailyclosing` | DailyClosing |
| Payroll | `payroll` | PayrollEntry |
| Reports | `reports` | SalesSummary, InventoryValuation |
| Billing / Subscriptions | `billing` | BillingInvoice, Subscription, SubscriptionPlan |

## Layer responsibilities

**Database:** Catalog table/column definitions or workflow SQL constants, plus a schema reference for the topic. SQL is parameterized and executed by repositories. Flyway remains the authoritative schema owner under `src/main/resources/db/migration`; topic READMEs reproduce the relevant schema for navigation. Existing V1/V2 migrations were not split or changed, preserving deployed database migration history. Add future schema changes as new versioned migrations.

**Java Entity:** Immutable Java records representing persisted rows and read-only report projections. `fromRow` maps JDBC results to the model; `toRow` retains the existing snake_case JSON response format. These are JDBC persistence models, not JPA `@Entity` classes; the project continues to use Spring JDBC without introducing Hibernate or a second schema manager.

**Repository:** Concrete Spring `@Repository` classes own data access. Catalog repositories expose typed entities for individual reads/writes and share the common persistence implementation. Workflow repositories have typed SQL parameters and map full rows through topic entities. Joins and aggregates use projections. No controller or service calls `JdbcTemplate`.

**Service:** Spring `@Service` classes own validations, calculations and workflow coordination. Write transactions begin here. Sales coordinate with inventory, and inventory records movements through `InventoryMovementService` in the same transaction. Store locks, optimistic version checks, checkout idempotency, and rollback behavior are preserved.

**Controller/API:** Spring `@RestController` classes own HTTP routes, request validation, status codes and permission annotations. They delegate to services. All existing routes and JSON field conventions are retained.

## Shared infrastructure

`common/config` contains Spring Security configuration. `common/controller` contains shared exception handling. `common/entity` provides row mapping helpers. `common/repository` contains catalog pagination and versioned persistence. `common/service` contains shared pagination, money rounding and exception helpers.

Reports intentionally have projection entities and read-only queries instead of a new writable report table. Departments/subdepartments, users/roles/permissions and billing/subscriptions share their respective business topic packages.

## Adding a feature

1. Add a new Flyway migration if the schema changes, and update the topic's database reference/SQL definitions.
2. Update the topic entity and any request DTOs.
3. Implement persistence in its repository and business rules in its service.
4. Expose the operation through its controller with the appropriate permission.
5. Update `scripts/generate_openapi.py` for new routes, regenerate the contract, and run `mvn clean test`.
