export type PasswordRequirements = {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
};

export type PasswordStrengths = "weak" | "moderate" | "strong";

/**
 * Check the password against the required rules.
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function checkPasswordRequirements(
  password: string
): PasswordRequirements {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}

/**
 * Determine overall password strength using a simple scoring model:
 * - weak: does not meet length or meets fewer than 3 of the character classes
 * - moderate: meets length and at least 3 of the character classes
 * - strong: meets length and all 4 character classes
 */
export function getPasswordStrength(password: string): PasswordStrengths {
  const req = checkPasswordRequirements(password);
  const classesMet = [
    req.hasUppercase,
    req.hasLowercase,
    req.hasNumber,
    req.hasSpecialChar,
  ].filter(Boolean).length;

  if (!req.hasMinLength || classesMet < 3) return "weak";
  if (req.hasMinLength && classesMet === 3) return "moderate";
  return "strong";
}
