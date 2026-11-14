// Small statistics helpers. All of them ignore non-finite input and return null
// instead of NaN when there is nothing to compute.

export const finite = (xs: (number | null | undefined)[]): number[] =>
  xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))

export function mean(xs: (number | null | undefined)[]): number | null {
  const f = finite(xs)
  return f.length ? f.reduce((a, b) => a + b, 0) / f.length : null
}

export function median(xs: (number | null | undefined)[]): number | null {
  const f = finite(xs).sort((a, b) => a - b)
  if (!f.length) return null
  const mid = Math.floor(f.length / 2)
  return f.length % 2 ? f[mid] : (f[mid - 1] + f[mid]) / 2
}

/** Sample standard deviation; 0 for fewer than two points. */
export function sd(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1))
}

/** Median absolute deviation scaled to be comparable with a standard deviation. */
export function scaledMad(xs: (number | null | undefined)[]): number | null {
  const m = median(xs)
  if (m == null) return null
  const dev = median(finite(xs).map((x) => Math.abs(x - m)))
  return dev == null ? null : dev * 1.4826
}

/**
 * Cohen's d between two groups. Zero spread with different means is a perfectly
 * repeatable effect, so it returns +/-Infinity rather than 0.
 */
export function cohensD(a: number[], b: number[]): number {
  const sa = sd(a)
  const sb = sd(b)
  const pooled = Math.sqrt(((a.length - 1) * sa ** 2 + (b.length - 1) * sb ** 2) / (a.length + b.length - 2))
  const diff = (mean(a) ?? 0) - (mean(b) ?? 0)
  if (pooled === 0) return diff === 0 ? 0 : diff > 0 ? Infinity : -Infinity
  return diff / pooled
}

export const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v))

/** Deterministic PRNG (mulberry32) so demo data is identical on every machine. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
