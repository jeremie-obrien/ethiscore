const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres rejects malformed uuids with an error; checking first turns that into a plain "not found". */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
