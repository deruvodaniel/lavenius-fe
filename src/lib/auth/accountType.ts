export enum AccountType {
  Therapist = 'therapist',
  Patient = 'patient',
}

export function parseAccountType(value: unknown): AccountType | null {
  if (value === AccountType.Therapist || value === AccountType.Patient) {
    return value;
  }
  return null;
}

export function getUserAccountType(user: { unsafeMetadata?: Record<string, unknown> | null } | null | undefined): AccountType | null {
  return parseAccountType(user?.unsafeMetadata?.accountType);
}
