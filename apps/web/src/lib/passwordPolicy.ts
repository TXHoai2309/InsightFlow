export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export function validateStrongPassword(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("passwordPolicy.minLength");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("passwordPolicy.uppercase");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("passwordPolicy.lowercase");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("passwordPolicy.number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("passwordPolicy.special");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
