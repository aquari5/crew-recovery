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

/** Natural log of the gamma function (Lanczos approximation). */
function logGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)
  let ser = 1.000000000190015
  for (const k of c) ser += k / ++y
  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}

/** Regularized incomplete beta function I_x(a, b), by continued fraction. */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x))
  if (x > (a + 1) / (a + b + 2)) return 1 - incompleteBeta(1 - x, b, a)
  const tiny = 1e-30
  let c = 1
  let d = 1 - ((a + b) * x) / (a + 1)
  d = 1 / (Math.abs(d) < tiny ? tiny : d)
  let h = d
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m
    let num = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2))
    d = 1 + num * d
    d = 1 / (Math.abs(d) < tiny ? tiny : d)
    c = 1 + num / c
    if (Math.abs(c) < tiny) c = tiny
    h *= d * c
    num = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1))
    d = 1 + num * d
    d = 1 / (Math.abs(d) < tiny ? tiny : d)
    c = 1 + num / c
    if (Math.abs(c) < tiny) c = tiny
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < 1e-10) break
  }
  return (front * h) / a
}

/**
 * Two-sided p-value of Welch's t-test: the probability of a difference in means
 * at least this large if the two groups really came from the same distribution.
 * Does not assume equal spread or equal group size.
 */
export function welchP(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 1
  const va = sd(a) ** 2 / a.length
  const vb = sd(b) ** 2 / b.length
  const diff = (mean(a) ?? 0) - (mean(b) ?? 0)
  if (va + vb === 0) return diff === 0 ? 1 : 0
  const t = diff / Math.sqrt(va + vb)
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1))
  return studentP(t, df)
}

/** Two-sided p-value for a t statistic with `df` degrees of freedom. */
export function studentP(t: number, df: number): number {
  if (!Number.isFinite(t)) return 0
  return incompleteBeta(df / (df + t * t), df / 2, 0.5)
}

/**
 * Ordinary least squares: y = b0 + b1*x1 + ... Each row of `x` holds the
 * predictors for one observation (the intercept is added here). Returns the
 * coefficient and two-sided p-value of every predictor, or null when the
 * predictors cannot be told apart (too few rows or collinear columns).
 */
export function ols(x: number[][], y: number[]): { coef: number; p: number }[] | null {
  const n = y.length
  const k = (x[0]?.length ?? 0) + 1
  if (n <= k + 1) return null
  const rows = x.map((r) => [1, ...r])
  // Normal equations (X'X) b = X'y, solved by Gauss-Jordan with the inverse kept for the standard errors.
  const a = Array.from({ length: k }, (_, i) =>
    Array.from({ length: 2 * k }, (_, j) => (j < k ? rows.reduce((s, r) => s + r[i] * r[j], 0) : j - k === i ? 1 : 0)),
  )
  for (let c = 0; c < k; c++) {
    let pivot = c
    for (let r = c + 1; r < k; r++) if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r
    if (Math.abs(a[pivot][c]) < 1e-9) return null
    ;[a[c], a[pivot]] = [a[pivot], a[c]]
    const div = a[c][c]
    for (let j = 0; j < 2 * k; j++) a[c][j] /= div
    for (let r = 0; r < k; r++) {
      if (r === c) continue
      const f = a[r][c]
      if (f !== 0) for (let j = 0; j < 2 * k; j++) a[r][j] -= f * a[c][j]
    }
  }
  const inv = a.map((r) => r.slice(k))
  const xty = Array.from({ length: k }, (_, i) => rows.reduce((s, r, m) => s + r[i] * y[m], 0))
  const beta = inv.map((r) => r.reduce((s, v, j) => s + v * xty[j], 0))
  const rss = rows.reduce((s, r, m) => s + (y[m] - r.reduce((t, v, j) => t + v * beta[j], 0)) ** 2, 0)
  const df = n - k
  const sigma2 = rss / df
  return beta.slice(1).map((coef, i) => {
    const se = Math.sqrt(sigma2 * inv[i + 1][i + 1])
    return { coef, p: se === 0 ? (coef === 0 ? 1 : 0) : studentP(coef / se, df) }
  })
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
