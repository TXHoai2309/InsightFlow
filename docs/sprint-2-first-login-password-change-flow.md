# Sprint 2 - First Login Password Change Flow

## Flow

```mermaid
flowchart TD
  A["Admin/Brand Manager creates account"] --> B["Firebase Auth user is created with temporary password"]
  B --> C["User profile stores temporaryPasswordIssued=true"]
  C --> D["User logs in with temporary password"]
  D --> E["ProtectedRoute detects temporaryPasswordIssued"]
  E --> F["Redirect to /change-password"]
  F --> G["User enters temporary password, new password and confirmation"]
  G --> H["Client re-authenticates with temporary password"]
  H --> I["Firebase updates password securely"]
  I --> J["Backend clears temporaryPasswordIssued and temporaryPassword"]
  J --> K["User continues to default route"]
```

## Rules

- Brand Manager and staff accounts created with a temporary password must change it before accessing product features.
- New passwords must have at least 10 characters, uppercase, lowercase, number and special character.
- The official password is stored only by Firebase Auth and cannot be viewed by Admin or Brand Manager.
- Staff temporary passwords are visible to the Brand Manager only while `temporaryPasswordIssued=true`.
- To reveal a staff temporary password, the Brand Manager must re-authenticate with their own password.
