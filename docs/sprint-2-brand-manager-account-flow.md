# Sprint 2 - Brand Manager Account Provisioning

## Flow

```mermaid
flowchart TD
  A["Admin opens /admin"] --> B["Enter full name, email, brand and temporary password"]
  B --> C["Frontend sends Firebase ID token to Admin API"]
  C --> D{"Requester role is admin?"}
  D -- "No" --> E["Reject with 403"]
  D -- "Yes" --> F["Create or update Firebase Auth user"]
  F --> G["Save users/{uid} with role brand_manager"]
  G --> H["Save brands/{brandId} and manager assignment"]
  H --> I["Admin hands temporary credentials to Brand Manager"]
  I --> J["Brand Manager logs in without self-registration"]
```

## Sprint 2 Rules

- Only Admin can create Brand Manager accounts.
- Brand Manager accounts are provisioned; there is no self-registration step.
- Each account is assigned to exactly one brand through `brandId` and `brandName`.
- The account is stored in Firebase Auth and mirrored in Firestore `users/{uid}`.
- Brand assignment is stored in Firestore `brands/{brandId}`.

## Stored User Shape

```json
{
  "uid": "firebase-auth-uid",
  "email": "manager@brand.com",
  "displayName": "Brand Manager Name",
  "role": "brand_manager",
  "brandId": "brand-slug",
  "brandName": "Brand Name",
  "companyDomain": "brand.com",
  "permissions": ["dashboard", "mentions", "alerts", "leads", "reports", "brand_settings"],
  "defaultRoute": "/dashboard",
  "temporaryPasswordIssued": true
}
```

