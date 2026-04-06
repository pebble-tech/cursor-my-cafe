export function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === '23505'
  );
}

/** Maps Postgres 23505 detail to the same messages as application-level duplicate checks. */
export function rethrowTicketTypeUniqueViolation(error: unknown): never {
  if (!isPostgresUniqueViolation(error)) throw error;
  const detail =
    typeof error === 'object' && error !== null && 'detail' in error
      ? String((error as { detail?: unknown }).detail)
      : '';
  if (detail.includes('(code)=')) {
    throw new Error('A ticket type with this code already exists');
  }
  if (detail.includes('(name)=')) {
    throw new Error('A ticket type with this name already exists');
  }
  if (detail.includes('(luma_ticket_type_id)=')) {
    throw new Error('A ticket type with this Luma ticket type ID already exists');
  }
  throw new Error('A ticket type with this code, name, or Luma ticket type ID already exists');
}
