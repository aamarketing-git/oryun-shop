# 오륜쇼핑몰 · ERD

Entity-Relationship Diagram for the marketplace database.

## Mermaid ERD

```mermaid
erDiagram
    profiles ||--o{ sellers : "1:N"
    profiles ||--o{ orders : "customer"
    profiles ||--o{ inquiries : "customer"
    sellers ||--o{ products : "owns"
    sellers ||--o{ orders : "fulfills"
    sellers ||--o{ inquiries : "receives"
    categories ||--o{ products : "categorizes"
    products ||--o| product_details : "1:1 (admin only)"
    products ||--o{ order_items : "in"
    products ||--o{ inquiries : "about"
    orders ||--|{ order_items : "contains"
    orders ||--o{ txid_records : "USDT only"
    orders ||--o{ shipments : "ships"
    profiles ||--o{ audit_logs : "actor"

    profiles {
        uuid id PK "= auth.users.id"
        text email
        text full_name
        text phone
        user_role role "admin|seller|customer"
        text staking_wallet_address "default for orders"
        timestamptz created_at
    }

    sellers {
        uuid id PK
        uuid user_id FK "→ profiles.id"
        text business_name
        text representative_name
        text contact_phone
        text contact_kakao
        text contact_telegram
        text bank_name
        text bank_account
        text bank_holder
        text usdt_address_trc20
        text usdt_address_erc20
        text business_license_url
        seller_status status "pending|approved|rejected|blocked"
        text rejection_reason
        timestamptz approved_at
        uuid approved_by FK
    }

    categories {
        uuid id PK
        text slug UK
        text name
        text description
        int sort_order
    }

    products {
        uuid id PK
        uuid seller_id FK
        uuid category_id FK
        text name
        text description
        bigint price_krw
        int stock
        text image_url
        text inquiry_number "seller's contact ref"
        bool use_direct_delivery
        product_status status "draft|pending|approved|hidden|rejected"
        text rejection_reason
        timestamptz approved_at
    }

    product_details {
        uuid id PK
        uuid product_id FK UK "1:1"
        jsonb sections "admin-built section array"
        uuid created_by FK "admin"
        uuid updated_by FK "admin"
    }

    orders {
        uuid id PK
        text order_number UK "ORDER-YYYYMMDD-NNNN"
        uuid customer_id FK
        uuid seller_id FK
        bigint total_krw "snapshot"
        numeric usdt_rate "snapshot at order time"
        payment_method payment_method "bank_transfer|usdt"
        order_status status
        text staking_wallet_address "NOT NULL"
        jsonb shipping_address
        text shipping_address_text "denormalized"
        timestamptz created_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        text product_name "snapshot"
        bigint unit_price_krw "snapshot"
        int quantity
    }

    txid_records {
        uuid id PK
        uuid order_id FK
        text tx_hash UK "globally unique"
        text chain "TRC20|ERC20"
        text status "submitted|verified|failed"
        timestamptz submitted_at
        timestamptz verified_at
        jsonb verification_result "from blockchain API"
    }

    shipments {
        uuid id PK
        uuid order_id FK
        shipment_method method "courier|direct"
        text carrier
        text tracking_number
        text note "for direct delivery"
        timestamptz created_at
    }

    inquiries {
        uuid id PK
        uuid product_id FK
        uuid customer_id FK
        uuid seller_id FK
        text channel "kakao|phone|telegram"
        text message
        timestamptz created_at
    }

    settings {
        text key PK "e.g. usdt_krw_rate"
        text value
        text updated_by FK
        timestamptz updated_at
    }

    audit_logs {
        uuid id PK
        uuid actor_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb meta
        timestamptz created_at
    }
```

## Key Constraints

### Uniqueness
- `profiles.id` = `auth.users.id` (FK on auth)
- `sellers.user_id` is **unique** (one seller per user)
- `categories.slug` is unique
- `product_details.product_id` is unique (1:1 with products)
- `txid_records.tx_hash` is **unique globally** — prevents reuse
- `orders.order_number` is unique
- `settings.key` is PK

### Required Fields
- `orders.staking_wallet_address` **NOT NULL** + length CHECK
- `orders.usdt_rate` **NOT NULL** (snapshotted at order creation)
- `txid_records.tx_hash` NOT NULL + UNIQUE

### Enums
- `user_role`: `admin | seller | customer`
- `seller_status`: `pending | approved | rejected | blocked`
- `product_status`: `draft | pending | approved | hidden | rejected`
- `order_status`: `pending_payment | paid | preparing | shipping | delivered | cancelled | refunded`
- `payment_method`: `bank_transfer | usdt`
- `shipment_method`: `courier | direct`

## Lifecycle

### Seller
```
[signup] → profiles(role=customer) + sellers(status=pending)
→ admin approves → profiles.role=seller, sellers.status=approved
```

### Product
```
[seller creates] → status=pending (no detail yet)
→ admin builds detail page → product_details inserted
→ admin approves → status=approved (visible on store)
→ admin can hide → status=hidden
```

### Order
```
[create_order RPC] → status=pending_payment, stock decremented, rate snapshotted
→ customer submits TXID (USDT) or transfers (bank)
→ seller confirms → status=paid
→ seller registers shipment → status=shipping
→ status=delivered
```

## RLS Summary

| Table             | Customer    | Seller (own)        | Admin |
|-------------------|-------------|---------------------|-------|
| profiles          | self only   | self only           | all   |
| sellers           | -           | own row             | all   |
| products          | approved only | own (any status)  | all   |
| product_details   | read approved | read own approved | rw all (write admin only) |
| orders            | own         | own (as seller)     | all   |
| txid_records      | own order   | own order's        | all   |
| shipments         | own order   | own                 | all   |
| settings          | -           | read                | rw    |

See `supabase/migrations/002_rls.sql` for actual policies.
