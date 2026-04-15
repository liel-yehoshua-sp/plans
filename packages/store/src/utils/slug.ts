/** Upper bound for slug segments in branch patterns and derived epic ids (keeps paths readable). */
export const MAX_PLAN_SLUG_SEGMENT_LENGTH = 40;

export function normalizePlanSlugSegment(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugifyPlanSegment(
  text: string,
  maxLength: number = MAX_PLAN_SLUG_SEGMENT_LENGTH,
): string {
  return normalizePlanSlugSegment(text).slice(0, maxLength);
}

/** Derive a filesystem-safe epic id from a title (HTTP create when `id` is omitted). */
export function epicIdFromTitle(title: string): string {
  const base = normalizePlanSlugSegment(title);
  if (base.length === 0) {
    return `epic-${Date.now()}`;
  }
  return base.slice(0, MAX_PLAN_SLUG_SEGMENT_LENGTH);
}

/**
 * Picks the first filesystem slug `normalized(rawBase)` or `normalized-N` that is not taken.
 */
export function allocateUniqueSlug(
  rawBase: string,
  isTaken: (slug: string) => boolean,
  maxLength: number = MAX_PLAN_SLUG_SEGMENT_LENGTH,
): string {
  const normalized =
    normalizePlanSlugSegment(rawBase).slice(0, maxLength) || 'item';
  if (!isTaken(normalized)) return normalized;
  for (let i = 2; ; i++) {
    const suffix = `-${i}`;
    const trimmedBase = normalized.slice(0, Math.max(1, maxLength - suffix.length));
    const candidate = `${trimmedBase}${suffix}`;
    if (!isTaken(candidate)) return candidate;
  }
}
