/**
 * Community Power Share (CPS) Dynamic Pricing Engine
 * 
 * Core Concept & Mathematical Specification:
 * 1. Price Step = $0.0000001 (1e-7 USD) per Actuator.
 * 2. Only Actuators currently active/online simultaneously
 *    drive the price:
 *    - 5 Actuators online = $0.0000005
 *    - 6 Actuators online = $0.0000006
 *    - N Actuators online = N * $0.0000001
 * 3. Observers DO NOT drive the price (weight = 0).
 * 4. Floor price when 0 Actuators are online is $0.0000001.
 */

export const BASE_PRICE = 0.0000001; // $0.0000001 USD floor / step per Actuator

export interface PricingFormulaOptions {
  model?: 'direct';
  stepMultiplier?: number;
}

/**
 * Calculates the dynamic price of CPS given the number of active Actuators online.
 * 
 * Direct Actuator Presence Formula:
 * P(N) = N * $0.0000001 (or custom stepMultiplier if configured by admin)
 * (e.g. 5 Actuators -> $0.0000005, 6 Actuators -> $0.0000006)
 * 
 * Observers count MUST BE 0 in this calculation.
 */
export function calculateDynamicPrice(
  activeVerifiedOnline: number,
  options: PricingFormulaOptions = {}
): number {
  const step = options.stepMultiplier ?? BASE_PRICE;
  const verifiedCount = Math.max(0, Math.floor(activeVerifiedOnline));
  if (verifiedCount === 0) {
    return step; // minimum floor
  }

  // Exact formula: N * step
  return Number((verifiedCount * step).toFixed(12));
}

/**
 * Formats a micro-cryptocurrency price string matching the exact verified user formula ($0.0000001 per user).
 * e.g., 
 * 1 user   -> "$0.0000001"
 * 5 users  -> "$0.0000005"
 * 6 users  -> "$0.0000006"
 * 11 users -> "$0.0000011" (2 digits filling the end, no trailing "00")
 */
export function formatCryptoPrice(price: number, _minDecimals = 7, _maxDecimals = 7): string {
  if (isNaN(price) || price <= 0) {
    return `$${BASE_PRICE.toFixed(7)}`;
  }

  // If price is relatively large (>= $0.01), standard 2-4 decimals suffice
  if (price >= 0.01) {
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }

  // For micro prices, format to 7 decimal places (matching $0.0000001 step):
  // 5 online verified = $0.0000005
  // 6 online verified = $0.0000006
  // 11 online verified = $0.0000011 (never showing extraneous '00' at the end)
  return `$${price.toFixed(7)}`;
}

/**
 * Subscript representation for micro-token prices (e.g. $0.0{5}11)
 */
export function formatSubscriptPrice(price: number): {
  prefix: string;
  zeroCount: number;
  significantDigits: string;
  fullString: string;
} {
  const full = price.toFixed(7);
  const match = full.match(/^0\.(0+)(\d+)$/);
  if (match) {
    return {
      prefix: '$0.',
      zeroCount: match[1].length,
      significantDigits: match[2],
      fullString: `$0.0{${match[1].length}}${match[2]}`,
    };
  }
  return {
    prefix: '$',
    zeroCount: 0,
    significantDigits: price.toFixed(7),
    fullString: formatCryptoPrice(price),
  };
}

/**
 * Calculate price impact of adding/removing verified members online
 */
export function calculatePriceImpact(
  currentVerifiedOnline: number,
  additionalVerifiedOnline: number,
  options: PricingFormulaOptions = {}
): {
  currentPrice: number;
  projectedPrice: number;
  deltaUsd: number;
  percentChange: number;
} {
  const currentPrice = calculateDynamicPrice(currentVerifiedOnline, options);
  const projectedPrice = calculateDynamicPrice(
    currentVerifiedOnline + additionalVerifiedOnline,
    options
  );
  const deltaUsd = projectedPrice - currentPrice;
  const percentChange = ((projectedPrice - currentPrice) / currentPrice) * 100;

  return {
    currentPrice,
    projectedPrice,
    deltaUsd,
    percentChange,
  };
}

/**
 * Calculate total market cap given current price and circulating supply (100,000,000 CPS)
 */
export function calculateMarketCap(price: number, circulatingSupply = 100_000_000): number {
  return price * circulatingSupply;
}

/**
 * Unit Test Result Specification
 */
export interface UnitTestResult {
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  received: string;
  durationMs: number;
  details?: string;
}

/**
 * In-browser unit test execution suite for the Community Power Share (CPS) pricing engine.
 * Ensures rigorous mathematical accuracy, boundary condition safety, and zero drift.
 */
export function runPricingEngineTests(): {
  allPassed: boolean;
  results: UnitTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: UnitTestResult[] = [];
  const start = performance.now();

  // Test 1: Zero online verified users returns exact BASE_PRICE
  {
    const t0 = performance.now();
    const price = calculateDynamicPrice(0);
    const passed = Math.abs(price - BASE_PRICE) < 1e-12;
    results.push({
      name: 'Zero Online Verified Baseline',
      category: 'Boundary Condition',
      passed,
      expected: `$${BASE_PRICE.toFixed(7)}`,
      received: `$${price.toFixed(7)}`,
      durationMs: Number((performance.now() - t0).toFixed(2)),
      details: 'When 0 verified users are online, price MUST equal exact base price $0.0000001.',
    });
  }

  // Test 2: Negative or invalid verified count falls back safely to BASE_PRICE
  {
    const t0 = performance.now();
    const priceNeg = calculateDynamicPrice(-5);
    const passed = priceNeg === BASE_PRICE;
    results.push({
      name: 'Negative Verified Input Clamping',
      category: 'Input Sanitization',
      passed,
      expected: `$${BASE_PRICE.toFixed(7)}`,
      received: `$${priceNeg.toFixed(7)}`,
      durationMs: Number((performance.now() - t0).toFixed(2)),
      details: 'Negative online user counts are clamped to 0 to prevent sub-base price degradation.',
    });
  }

  // Test 3: Observers do NOT influence price (Actuators count only)
  {
    const t0 = performance.now();
    // Simulate active pool with 500 observers and 0 actuators
    const freeUsersOnline = 500;
    const verifiedUsersOnline = 0;
    // Engine only takes actuator count:
    const price = calculateDynamicPrice(verifiedUsersOnline);
    const passed = price === BASE_PRICE;
    results.push({
      name: 'Observer Presence Exclusion',
      category: 'Business Model Integrity',
      passed,
      expected: `$${BASE_PRICE.toFixed(7)} (0% change with ${freeUsersOnline} Observers)`,
      received: `$${price.toFixed(7)}`,
      durationMs: Number((performance.now() - t0).toFixed(2)),
      details: 'Observers only observe data and cannot drive the pricing engine.',
    });
  }

  // Test 4: Exactly 2 online users increase price proportionally
  {
    const t0 = performance.now();
    const p1 = calculateDynamicPrice(1);
    const p2 = calculateDynamicPrice(2);
    // Delta from 0 to 1 should equal delta from 1 to 2 in proportional model
    const delta1 = p1 - BASE_PRICE;
    const delta2 = p2 - p1;
    const passed = Math.abs(delta1 - delta2) < 1e-12;
    results.push({
      name: 'Proportional 2-User Scaling Symmetry',
      category: 'Mathematical Linearity',
      passed,
      expected: `Linear delta ($${delta1.toFixed(10)}) == ($${delta2.toFixed(10)})`,
      received: `Delta 1: $${delta1.toFixed(10)}, Delta 2: $${delta2.toFixed(10)}`,
      durationMs: Number((performance.now() - t0).toFixed(2)),
      details: 'In proportional mode, each additional verified user contributes identical baseline utility weight.',
    });
  }

  // Test 5: Monotonicity - Price strictly increases as verified users increase
  {
    const t0 = performance.now();
    let monotonic = true;
    let prev = calculateDynamicPrice(0);
    for (let n = 1; n <= 100; n += 5) {
      const curr = calculateDynamicPrice(n);
      if (curr <= prev) {
        monotonic = false;
        break;
      }
      prev = curr;
    }
    results.push({
      name: 'Strict Price Monotonicity (1 to 100 users)',
      category: 'Mathematical Monotonicity',
      passed: monotonic,
      expected: 'Strictly increasing: P(N + 1) > P(N)',
      received: monotonic ? 'Verified strictly increasing' : 'Non-monotonic detected',
      durationMs: Number((performance.now() - t0).toFixed(2)),
      details: 'Ensures the pricing curve never regresses or stagnates as verified presence expands.',
    });
  }

  // Test 6: Extreme Scale Stress Test (1,000,000 verified users)
  {
    const t0 = performance.now();
    const largeCount = 1_000_000;
    const pLarge = calculateDynamicPrice(largeCount);
    const expectedApprox = largeCount * BASE_PRICE;
    const passed = Math.abs(pLarge - expectedApprox) < 1e-6 && !isNaN(pLarge) && isFinite(pLarge);
    results.push({
      name: 'High-Scale Stress Test (1M Online Actuators)',
      category: 'Scale & Precision',
      passed,
      expected: `~$${expectedApprox.toFixed(6)}`,
      received: `$${pLarge.toFixed(6)}`,
      durationMs: Number((performance.now() - t0).toFixed(2)),
      details: 'Engine operates stably at 1,000,000 simultaneous Actuators without floating overflow.',
    });
  }

  // Test 7: Price impact calculator accuracy
  {
    const t0 = performance.now();
    const impact = calculatePriceImpact(10, 5);
    const expectedP1 = calculateDynamicPrice(10);
    const expectedP2 = calculateDynamicPrice(15);
    const expectedPercent = ((expectedP2 - expectedP1) / expectedP1) * 100;
    const passed = Math.abs(impact.percentChange - expectedPercent) < 1e-5;
    results.push({
      name: 'Price Impact Forecast Accuracy',
      category: 'Analytics & Projections',
      passed,
      expected: `+${expectedPercent.toFixed(2)}%`,
      received: `+${impact.percentChange.toFixed(2)}%`,
      durationMs: Number((performance.now() - t0).toFixed(2)),
      details: 'Verified forecast formula matches exact discrete delta between states.',
    });
  }

  const passedCount = results.filter((r) => r.passed).length;

  return {
    allPassed: passedCount === results.length,
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
    },
  };
}
