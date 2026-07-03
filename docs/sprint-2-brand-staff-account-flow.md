# Sprint 2 - Brand Staff Account Provisioning

## Flow

```mermaid
flowchart TD
  A["Brand Manager opens /team"] --> B["System reads Brand Manager brandId"]
  B --> C["Brand Manager enters staff full name, email and temporary password"]
  C --> D["Brand Manager selects staff type"]
  D --> E{"Staff type"}
  E -- "crisis_staff" --> F["Allow dashboard, mentions, alerts, reports"]
  E -- "lead_staff" --> G["Allow dashboard, mentions, leads, reports"]
  F --> H["Create or update Firebase Auth user"]
  G --> H
  H --> I["Save users/{uid} with same brandId as Brand Manager"]
  I --> J["Save brands/{brandId}/staff/{uid}"]
  J --> K["Staff logs in with temporary credentials"]
```

## Rules

- Only `brand_manager` can create staff accounts in this flow.
- Staff accounts inherit `brandId` and `brandName` from the currently logged-in Brand Manager.
- Staff cannot choose or change brand assignment.
- `crisis_staff` cannot access `/leads`.
- `lead_staff` cannot access `/alerts`.
- Route access also checks the stored `permissions` array for assigned business operations.

## Staff User Shape

```json
{
  "uid": "firebase-auth-uid",
  "email": "staff@brand.com",
  "displayName": "Staff Name",
  "role": "crisis_staff",
  "brandId": "brand-slug",
  "brandName": "Brand Name",
  "permissions": ["dashboard", "mentions", "alerts", "reports"],
  "defaultRoute": "/alerts",
  "temporaryPasswordIssued": true
}
```

