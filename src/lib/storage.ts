// Best-effort localStorage access.
//
// Reaching localStorage at all can throw: browsers configured to block site data
// raise SecurityError on the property access itself, as does a cross-origin iframe
// with partitioned storage, and writes raise QuotaExceededError when the store is
// full. Persistence here is a convenience and never a correctness requirement, so
// a failure degrades to "this visit isn't remembered" rather than propagating and
// taking the render down with it.

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Blocked or full. The app is fully usable without persistence.
  }
}

/**
 * Reads and parses a JSON value, returning null unless it satisfies `isValid`.
 *
 * Stored values are not trustworthy input: they survive across deploys that change
 * the shape, and on a GitHub Pages user site localStorage is shared with every other
 * project on the origin, so a sibling app can write these same keys. Validating on
 * the way in keeps a bad value from being handed to the renderer as a typed one.
 */
export function readStorageJson<T>(
  key: string,
  isValid: (value: unknown) => value is T
): T | null {
  const raw = readStorage(key);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
