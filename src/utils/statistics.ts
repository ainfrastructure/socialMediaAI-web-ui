/**
 * Statistical utility functions for engagement data analysis.
 * Provides mean, standard deviation, confidence intervals, and t-distribution approximations.
 */

/**
 * Calculate arithmetic mean of a number array.
 * Returns 0 for empty arrays.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Calculate sample standard deviation.
 * Uses Bessel's correction (n-1) for sample data.
 * Returns 0 for arrays with fewer than 2 elements.
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map(v => (v - avg) ** 2)
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1))
}

/**
 * Calculate standard error of the mean.
 * SE = SD / sqrt(n)
 */
export function standardError(values: number[]): number {
  if (values.length < 2) return 0
  return standardDeviation(values) / Math.sqrt(values.length)
}

/**
 * Approximate t-distribution critical value for 95% confidence.
 * Uses a lookup table for small sample sizes, falls back to 1.96 for large n.
 */
function tCritical95(degreesOfFreedom: number): number {
  // t-distribution critical values for 95% CI (two-tailed, alpha=0.05)
  const table: Record<number, number> = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    15: 2.131,
    20: 2.086,
    25: 2.060,
    30: 2.042,
    40: 2.021,
    60: 2.000,
    120: 1.980,
  }

  if (degreesOfFreedom <= 0) return 12.706
  if (table[degreesOfFreedom]) return table[degreesOfFreedom]

  // Interpolate or use closest
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  if (degreesOfFreedom > keys[keys.length - 1]) return 1.96

  for (let i = 0; i < keys.length - 1; i++) {
    if (degreesOfFreedom > keys[i] && degreesOfFreedom < keys[i + 1]) {
      // Linear interpolation
      const lower = keys[i]
      const upper = keys[i + 1]
      const ratio = (degreesOfFreedom - lower) / (upper - lower)
      return table[lower] + ratio * (table[upper] - table[lower])
    }
  }

  return 1.96
}

/**
 * Calculate 95% confidence interval for the mean.
 * Returns [lower, upper] bounds.
 * For small samples (n < 30), uses t-distribution.
 * For larger samples, approximates with normal distribution (z=1.96).
 */
export function confidenceInterval95(values: number[]): [number, number] {
  if (values.length === 0) return [0, 0]
  if (values.length === 1) return [values[0], values[0]]

  const avg = mean(values)
  const se = standardError(values)
  const df = values.length - 1
  const t = tCritical95(df)
  const margin = t * se

  return [Math.max(0, avg - margin), avg + margin]
}

/**
 * Calculate coefficient of variation (CV).
 * Useful for assessing data reliability.
 * Returns value between 0-1 (or higher for very noisy data).
 */
export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 1 // Maximum uncertainty
  const avg = mean(values)
  if (avg === 0) return 1
  return standardDeviation(values) / Math.abs(avg)
}

/**
 * Determine confidence level based on sample size and coefficient of variation.
 */
export function getConfidenceLevel(
  sampleSize: number,
  cv: number
): 'high' | 'medium' | 'low' {
  if (sampleSize >= 10 && cv < 0.5) return 'high'
  if (sampleSize >= 5 && cv < 0.8) return 'medium'
  return 'low'
}

/**
 * Calculate Pearson correlation coefficient between two arrays.
 * Returns value between -1 and 1.
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  const meanX = mean(x.slice(0, n))
  const meanY = mean(y.slice(0, n))

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denominator = Math.sqrt(denomX * denomY)
  if (denominator === 0) return 0

  return numerator / denominator
}
