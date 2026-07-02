export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export function validateStrongPassword(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("Mat khau phai co toi thieu 10 ky tu.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Mat khau can co it nhat 1 chu hoa.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Mat khau can co it nhat 1 chu thuong.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Mat khau can co it nhat 1 chu so.");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Mat khau can co it nhat 1 ky tu dac biet.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
