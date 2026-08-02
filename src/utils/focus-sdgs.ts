/**
 * Shared `focusSdgs` normalisation for content types using the
 * `global::multi-enum` custom field (member, project).
 *
 *  - Accepts legacy free-text formats ("[5,6]" / "5,6") and real arrays.
 *  - Rejects anything outside the UN SDG range 1-17, even when the request
 *    bypasses the admin UI (REST/GraphQL/seed scripts).
 */

const ALLOWED_SDGS = new Set(
  Array.from({ length: 17 }, (_, i) => String(i + 1))
);

const toStringArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.length) {
    return raw
      .replace(/[\[\]]/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

/** Mutates `event.params.data.focusSdgs` in place; throws on invalid values. */
export const normaliseFocusSdgs = (event: any) => {
  const data = event.params?.data;
  if (!data || data.focusSdgs === undefined) return;

  const list = toStringArray(data.focusSdgs);
  const bad = list.filter((v) => !ALLOWED_SDGS.has(v));
  if (bad.length) {
    throw new Error(
      `focusSdgs chỉ chấp nhận giá trị 1-17 (UN SDG). Giá trị không hợp lệ: ${bad.join(', ')}`
    );
  }

  // Stable unique + original order.
  const dedup = Array.from(new Set(list));
  event.params.data.focusSdgs = dedup.length ? dedup : null;
};

/** Lifecycle hooks object, shared by every content type with `focusSdgs`. */
export const focusSdgsLifecycles = {
  beforeCreate: normaliseFocusSdgs,
  beforeUpdate: normaliseFocusSdgs,
};
