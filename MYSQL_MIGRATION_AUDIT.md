# MANAM Backend — PostgreSQL to MySQL Migration Audit Report

**Date**: October 8, 2026  
**Project**: MANAM Care Backend (`manammcare_backend`)  
**Target Environment**: Hostinger Cloud / VPS / Managed Node.js + MySQL  
**Target Domain**: `https://api.manammcare.com`  
**Frontend / Mobile Application**: MANAM React Native App & Web (`https://manammcare.com`)  
**Auditor**: Antigravity AI Engineering Team  

---

## Executive Summary

A comprehensive architectural and database audit of the existing **MANAM** production backend codebase was conducted to evaluate the migration from **PostgreSQL** to **MySQL** (Hostinger).

The audit confirms that the existing backend has been built with clean abstraction using **NestJS** and **Prisma ORM**. There are **zero raw SQL queries (`$queryRaw`, `$executeRaw`)**, **zero PostgreSQL-specific database extensions** (such as `citext`, `uuid-ossp`, or `pg_trgm`), and all financial precision constraints use standard `DECIMAL(10, 2)` types which are natively and identically supported by MySQL.

Only two targeted adjustments are required:
1. Updating `prisma/schema.prisma` datasource provider from `"postgresql"` to `"mysql"`.
2. Removing PostgreSQL-specific `mode: 'insensitive'` filter flags from `src/products/products.service.ts` (because MySQL collations are case-insensitive by default, and Prisma's MySQL generator disallows the `mode` parameter).

**No mobile application API contracts, endpoints, request/response formats, business rules, or security mechanisms will be affected.** The database migration will be 100% transparent to the MANAM mobile application.

---

## A. Current PostgreSQL Configuration

- **ORM**: Prisma Client v6.3.0
- **Prisma Datasource Provider**: `postgresql`
- **Environment Variable**: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/manamm_db?schema=public"`
- **ID Strategy**: Prisma Client-level `cuid()` strings
- **Case Sensitivity**: Explicit `mode: 'insensitive'` in `products.service.ts`
- **JSON Handling**: Native PostgreSQL `JsonB` / `Json` mapped via Prisma `Json`
- **Financial Precision**: `@db.Decimal(10, 2)` and `@db.Decimal(3, 2)`
- **Enums**: Native PostgreSQL enum types

---

## B. Target MySQL Configuration

- **Host Platform**: Hostinger MySQL (port 3306 default)
- **Engine**: MySQL InnoDB (ensuring full ACID transaction safety, foreign key cascades, and row-level locking)
- **Character Set / Collation**: `utf8mb4` with `utf8mb4_unicode_ci` (guarantees native case-insensitive search and complete emoji support)
- **Prisma Datasource Provider**: `mysql`
- **Target Connection URL Format**:
  ```env
  DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
  ```
- **Prisma Generator**: `prisma-client-js`
- **Network Interface**: Node.js listener bound to `0.0.0.0` with `process.env.PORT` fallback

---

## C. Prisma Models Found (21 Models Audited)

Every model in `prisma/schema.prisma` has been audited for MySQL compatibility:

| Model | Primary Key | Relations & Indexes | MySQL Compatibility Status |
| :--- | :--- | :--- | :--- |
| **User** | `id` (cuid) | 7 relations (`profile`, `addresses`, `orders`, `cart`, `notifications`, `notificationPreferences`, `adminActivityLogs`), 2 indexes (`email`, `role`), unique `email` | **SAFE** |
| **UserProfile** | `id` (cuid) | Unique `userId`, relation to `User` (Cascade) | **SAFE** |
| **Address** | `id` (cuid) | Index on `userId`, relation to `User` (Cascade), Enum `AddressType` | **SAFE** |
| **Category** | `id` (cuid) | Unique `slug`, self-relation `SubCategories` (SetNull), relation to `Product` | **SAFE** |
| **Brand** | `id` (cuid) | Unique `slug`, relation to `Product` (SetNull) | **SAFE** |
| **Product** | `id` (cuid) | Unique `sku`, unique `slug`, indexes (`categoryId`, `isFeatured`, `isActive`), `@db.Decimal(10,2)` price, `@db.Decimal(3,2)` rating, `Json` (`images`, `attributes`, `tags`) | **SAFE** |
| **ProductVariant**| `id` (cuid) | Unique `sku`, index on `productId`, relation to `Product` (Cascade), `Json` attributes | **SAFE** |
| **Cart** | `id` (cuid) | Unique `userId`, relation to `User` (Cascade), relation to `CartItem` | **SAFE** |
| **CartItem** | `id` (cuid) | Compound unique `[cartId, productId]`, indexes (`cartId`, `productId`), relations to `Cart`, `Product` | **SAFE** |
| **Order** | `id` (cuid) | Unique `orderNumber`, indexes (`userId`, `orderNumber`, `status`), `Json` `shippingAddress`, 5 `Decimal` fields | **SAFE** |
| **OrderItem** | `id` (cuid) | Indexes (`orderId`, `productId`), relations to `Order`, `Product`, 2 `Decimal` fields | **SAFE** |
| **Payment** | `id` (cuid) | Indexes (`orderId`, `providerOrderId`), relations to `Order`, 1 `Decimal` field | **SAFE** |
| **Coupon** | `id` (cuid) | Unique `code`, index on `code`, 3 `Decimal` fields | **SAFE** |
| **Banner** | `id` (cuid) | Enum `BannerActionType`, standard types | **SAFE** |
| **Offer** | `id` (cuid) | `Decimal` value, standard types | **SAFE** |
| **Announcement** | `id` (cuid) | Standard types | **SAFE** |
| **FAQ** | `id` (cuid) | Standard types | **SAFE** |
| **Policy** | `id` (cuid) | Unique `slug`, `@db.Text` content | **SAFE** |
| **AppNotification** | `id` (cuid) | Index on `userId`, Enum `NotificationType`, `Json` `data` | **SAFE** |
| **NotificationPreferences** | `id` (cuid) | Unique `userId`, relation to `User` (Cascade) | **SAFE** |
| **AdminActivityLog** | `id` (cuid) | Index on `adminId`, relation to `User` | **SAFE** |

---

## D. Enums Audited (10 Enums Found)

MySQL supports native `ENUM`s via Prisma Client. All enums will be generated cleanly as native MySQL ENUM columns:

1. `Role` (`CUSTOMER`, `ADMIN`) — **SAFE**
2. `UserStatus` (`ACTIVE`, `INACTIVE`, `SUSPENDED`) — **SAFE**
3. `AddressType` (`HOME`, `WORK`, `OTHER`) — **SAFE**
4. `OrderStatus` (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) — **SAFE**
5. `PaymentStatus` (`PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`) — **SAFE**
6. `PaymentMethod` (`RAZORPAY`, `COD`, `UPI`) — **SAFE**
7. `PaymentProvider` (`RAZORPAY`, `COD`) — **SAFE**
8. `CouponType` (`PERCENTAGE`, `FIXED`) — **SAFE**
9. `BannerActionType` (`PRODUCT`, `CATEGORY`, `OFFER`, `EXTERNAL`, `NONE`) — **SAFE**
10. `NotificationType` (`ORDER`, `PAYMENT`, `PROMOTION`, `SYSTEM`, `ACCOUNT`) — **SAFE**

---

## E. Direct SQL & Raw Query Audit

- **Raw SQL Query Search (`$queryRaw`)**: Found `0` occurrences.
- **Raw SQL Execution Search (`$executeRaw`)**: Found `0` occurrences.
- **`Prisma.sql` / Template tags**: Found `0` occurrences.
- **PostgreSQL-specific syntax (`ILIKE`, `::type`, `RETURNING`)**: Found `0` occurrences.
- **PostgreSQL extensions (`uuid-ossp`, `pg_trgm`, `cube`, etc.)**: None used.
- **Audit Result**: **SAFE** (100% pure Prisma Client query API usage across all controllers and services).

---

## F. Features That Require Modification

### 1. Prisma Datasource Configuration (`prisma/schema.prisma`)
- **Status**: **REQUIRES CHANGE**
- **Existing**:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- **Target**:
  ```prisma
  datasource db {
    provider = "mysql"
    url      = env("DATABASE_URL")
  }
  ```
- **Reason**: Directs Prisma Client and migration engine to generate MySQL-compatible DDL and SQL queries.

### 2. Search Filter in Products Service (`src/products/products.service.ts`)
- **Status**: **REQUIRES CHANGE**
- **Existing**:
  ```typescript
  // Line 79-81 & 165-166
  { name: { contains: query.search, mode: 'insensitive' } },
  { description: { contains: query.search, mode: 'insensitive' } },
  { shortDescription: { contains: query.search, mode: 'insensitive' } },
  ```
- **Target**:
  ```typescript
  { name: { contains: query.search } },
  { description: { contains: query.search } },
  { shortDescription: { contains: query.search } },
  ```
- **Reason**: In Prisma, `mode: 'insensitive'` is only a valid TypeScript filter property for PostgreSQL, CockroachDB, and MongoDB. MySQL character sets with `_ci` (case-insensitive collations, standard in MySQL) are already case-insensitive by default. Keeping `mode: 'insensitive'` causes Prisma type generator to omit the field and TypeScript compiler to throw an error under MySQL provider.

### 3. Application Listener Binding (`src/main.ts`)
- **Status**: **REQUIRES REVIEW**
- **Existing**:
  ```typescript
  const port = process.env.PORT || 5000;
  await app.listen(port);
  ```
- **Target**:
  ```typescript
  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  ```
- **Reason**: Explicitly binds to `0.0.0.0` so Hostinger reverse proxy (Passenger / LiteSpeed / Docker) can route traffic seamlessly to the Node.js application process.

### 4. Environment Documentation (`.env.example`)
- **Status**: **REQUIRES CHANGE**
- **Existing**:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/manamm_db?schema=public"
  ```
- **Target**:
  ```env
  DATABASE_URL="mysql://username:password@localhost:3306/manamm_db"
  ```
- **Reason**: Clarify exact MySQL connection format for Hostinger deployment.

---

## G. Features That Are Already MySQL-Compatible

| Feature | Audit Finding | Status |
| :--- | :--- | :--- |
| **ID Generation** | Uses `cuid()` evaluated in Node.js runtime. No DB-level UUID generator function required. | **SAFE** |
| **Financial Decimals** | `@db.Decimal(10, 2)` maps directly to MySQL `DECIMAL(10, 2)`. | **SAFE** |
| **JSON Storage** | `images`, `attributes`, `tags`, `shippingAddress`, `data` use Prisma `Json` -> MySQL `JSON`. | **SAFE** |
| **Foreign Keys & Cascades** | `onDelete: Cascade` and `onDelete: SetNull` natively supported by MySQL InnoDB. | **SAFE** |
| **Indexes & Uniques** | Standard B-Tree indexes and unique constraints are fully supported. | **SAFE** |
| **Transactions** | `$transaction([ ... ])` used in `orders.service.ts` and `cart.service.ts` works identically on MySQL. | **SAFE** |
| **Razorpay Integration** | Signature verification and transaction flow are completely DB-independent. | **SAFE** |
| **Role-Based Access** | NestJS `@Roles('ADMIN')` and `RolesGuard` logic is completely DB-independent. | **SAFE** |

---

## H. Migration Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| **Character Collation Mismatch** | Low | Low | Hostinger MySQL databases default to `utf8mb4_unicode_ci`, guaranteeing case-insensitive text search matching the previous PostgreSQL `mode: 'insensitive'` behavior. |
| **Connection Pooling & Timeouts** | Low | Medium | Standard Prisma connection pool settings work reliably on MySQL; configured with standard retry logic in `PrismaService`. |
| **Destructive Data Overwrite** | Low | High | Strictly avoid `prisma migrate reset` or `DROP DATABASE`. Target database on Hostinger is a new provisioned database. |

---

## I. Files That Will Be Changed

1. `prisma/schema.prisma` — Update datasource provider to `"mysql"`.
2. `src/products/products.service.ts` — Remove PostgreSQL-specific `mode: 'insensitive'` filter properties.
3. `src/main.ts` — Ensure listener binds to `'0.0.0.0'` for Hostinger container/proxy compliance.
4. `.env.example` — Update connection string template for MySQL.

---

## J. Files That Must NOT Be Changed

- **All DTOs**: `src/*/dto/*.ts` (all request/response contracts remain unchanged).
- **All Controllers**: `src/*/*.controller.ts` (all API routes and decorators remain unchanged).
- **Authentication Strategy**: `src/auth/jwt.strategy.ts` & `auth.service.ts`.
- **Payment Gateway**: `src/payments/payments.service.ts` & Razorpay webhook/verification logic.
- **Cart & Order Calculations**: `src/cart/cart.service.ts` & `src/orders/orders.service.ts`.
- **Mobile Application**: All React Native UI screens, Redux slices, and repositories.

---

## K. API & Mobile Compatibility Impact

- **API Route Changes**: `0` (None).
- **Request Body Contract Changes**: `0` (None).
- **Response Format Changes**: `0` (None).
- **Pagination & Error Responses**: Identical (`ApiResponseDto` & `PaginatedResponseDto`).
- **Mobile Compatibility**: **100% Compatible**. The mobile application will experience zero breaking changes.

---

## L. Data Migration Requirements

Because Hostinger MySQL is a clean newly-provisioned target database:
1. Initialize the MySQL database schema using `prisma db push` or initial MySQL migration.
2. Run `npm run prisma:seed` to populate standard categories, brands, initial products, banners, FAQs, and policies directly from the existing mobile mock/seed data.
3. If existing PostgreSQL production customer records must be migrated at a later stage, export records into JSON and insert via a migration script.

---

## M. Recommended Action Plan

1. **Step 1**: Modify `prisma/schema.prisma` (`provider = "mysql"`).
2. **Step 2**: Remove `mode: 'insensitive'` from `src/products/products.service.ts`.
3. **Step 3**: Ensure `src/main.ts` binds `app.listen(port, '0.0.0.0')`.
4. **Step 4**: Regenerate Prisma Client using `npx prisma generate`.
5. **Step 5**: Run `npx tsc --noEmit` and `npm run build` to verify 0 errors.
6. **Step 6**: Execute test suite (`npm test`) to verify all unit tests pass.
7. **Step 7**: Update `.env.example` with MySQL template.
8. **Step 8**: Produce final `MYSQL_MIGRATION_COMPLETION_REPORT.md` with Hostinger deployment instructions.
