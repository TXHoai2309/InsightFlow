export type StaffRole = "crisis_employee" | "lead_employee";
export type LegacyStaffRole = "crisis_staff" | "lead_staff";
export type StaffRoleValue = StaffRole | LegacyStaffRole;

export interface StaffAccount {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRoleValue;
  brandName: string;
  permissions: string[];
  defaultRoute: string;
  temporaryPassword?: string;
  hasTemporaryPassword?: boolean;
  disabled?: boolean;
  
  // Các field API backend tương lai, frontend tạm thời handle
  createdAt?: string; 
  lastLoginAt?: string;
}

export interface OperationOption {
  value: string;
  labelKey: string;
  roles: string[];
}
