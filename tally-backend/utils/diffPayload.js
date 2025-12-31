/**
 * Compute field-level diff between two payload objects
 * Returns:
 * {
 *   fieldName: { old: value, new: value }
 * }
 */
export function computeDiff(oldPayload = {}, newPayload = {}) {
  const diff = {};

  const allKeys = new Set([
    ...Object.keys(oldPayload || {}),
    ...Object.keys(newPayload || {}),
  ]);

  for (const key of allKeys) {
    const oldVal = oldPayload[key];
    const newVal = newPayload[key];

    // Compare deeply via JSON
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = {
        old: oldVal ?? null,
        new: newVal ?? null,
      };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}
