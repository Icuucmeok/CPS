import { PriceTick, CandleTick, ChartTimeframe } from '../types';
import { calculateDynamicPrice } from './pricingEngine';

/**
 * Returns the exact millisecond duration of one candle for a given timeframe.
 */
export function getTimeframeIntervalMs(timeframe: ChartTimeframe): number {
  switch (timeframe) {
    case '1M':
      return 60 * 1000; // 1 minute per candle
    case '5M':
      return 5 * 60 * 1000; // 5 minutes per candle
    case '15M':
      return 15 * 60 * 1000; // 15 minutes per candle
    case '1H':
      return 60 * 60 * 1000; // 1 hour per candle
    case '4H':
      return 4 * 60 * 60 * 1000; // 4 hours per candle
    case '24H':
      return 24 * 60 * 60 * 1000; // 24 hours per candle
    case '1Month':
      return 24 * 60 * 60 * 1000; // 1 day per candle
    case 'All Time':
      return 7 * 24 * 60 * 60 * 1000; // 1 week per candle
    default:
      return 60 * 1000;
  }
}

/**
 * Returns the date-to-label formatter for candle X-axis and hover inspections.
 */
export function getTimeframeLabelFormat(timeframe: ChartTimeframe): (d: Date) => string {
  switch (timeframe) {
    case '1M':
    case '5M':
    case '15M':
    case '1H':
    case '4H':
      return (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '24H':
    case '1Month':
      return (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case 'All Time':
      return (d) => d.toLocaleDateString([], { month: 'short', year: '2-digit' });
    default:
      return (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Generates timeframe-specific historical data for both Line and Candlestick charts.
 * Aligns the latest candle to the current timeframe clock boundary.
 */
export function generateChartDataForTimeframe(
  timeframe: ChartTimeframe,
  currentVerifiedCount: number
): { lineData: PriceTick[]; candleData: CandleTick[] } {
  const now = Date.now();
  const lineData: PriceTick[] = [];
  const candleData: CandleTick[] = [];

  const intervalMs = getTimeframeIntervalMs(timeframe);
  const labelFormat = getTimeframeLabelFormat(timeframe);
  const count = timeframe === '1Month' ? 30 : timeframe === 'All Time' ? 36 : 25;

  // Align latest candle to current time bucket boundary
  const currentBucket = Math.floor(now / intervalMs) * intervalMs;

  // Simulation walk towards currentVerifiedCount
  const startVariance = timeframe === '1Month' || timeframe === 'All Time' ? 12 : 5;
  let runningCount = Math.max(1, currentVerifiedCount - Math.floor(Math.random() * startVariance));

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = currentBucket - i * intervalMs;
    const date = new Date(timestamp);
    const timeLabel = labelFormat(date);

    // If last bar, strictly match currentVerifiedCount
    if (i === 0) {
      runningCount = currentVerifiedCount;
    } else {
      // Small random walk towards current
      const diff = currentVerifiedCount - runningCount;
      const step = diff !== 0 ? Math.sign(diff) : (Math.random() > 0.5 ? 1 : -1);
      runningCount = Math.max(1, runningCount + (Math.random() > 0.4 ? step : 0));
    }

    const closePrice = calculateDynamicPrice(runningCount);
    
    // For line data
    lineData.push({
      timestamp,
      timeLabel,
      price: closePrice,
      verifiedOnlineCount: runningCount,
      volume: Math.floor(120000 + Math.random() * 380000),
    });

    // For candle data: calculate realistic Open, High, Low, Close
    const prevClose = candleData.length > 0 
      ? candleData[candleData.length - 1].close 
      : calculateDynamicPrice(Math.max(1, runningCount - 1));

    const openPrice = prevClose;
    const varianceRatio = timeframe === '1M' ? 0.015 : timeframe === '5M' ? 0.025 : 0.045;
    
    const highPrice = Math.max(openPrice, closePrice) * (1 + Math.random() * varianceRatio);
    const lowPrice = Math.min(openPrice, closePrice) * (1 - Math.random() * varianceRatio);

    candleData.push({
      timestamp,
      timeLabel,
      open: Number(openPrice.toFixed(10)),
      high: Number(highPrice.toFixed(10)),
      low: Number(Math.max(0.0000001, lowPrice).toFixed(10)),
      close: Number(closePrice.toFixed(10)),
      volume: Math.floor(180000 + Math.random() * 420000),
      verifiedOnlineCount: runningCount,
    });
  }

  return { lineData, candleData };
}

/**
 * Loads or initializes persistent chart candle records for a specific timeframe.
 * Guarantees each and every completed candle has its own separate, persistent record.
 * Seamlessly catches up on any elapsed intervals while the user was on another page or after a refresh.
 */
export function getOrInitializePersistedChartData(
  timeframe: ChartTimeframe,
  currentVerifiedCount: number,
  currentPrice: number
): { lineData: PriceTick[]; candleData: CandleTick[] } {
  const storageKey = `cps_chart_records_${timeframe}`;
  const intervalMs = getTimeframeIntervalMs(timeframe);
  const labelFormat = getTimeframeLabelFormat(timeframe);
  const now = Date.now();
  const currentBucket = Math.floor(now / intervalMs) * intervalMs;
  const maxBars = timeframe === '1Month' ? 30 : timeframe === 'All Time' ? 36 : 35;

  let persisted: { lineData: PriceTick[]; candleData: CandleTick[] } | null = null;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      persisted = JSON.parse(raw);
    }
  } catch {
    persisted = null;
  }

  // If no valid persistent records exist, initialize baseline and persist
  if (
    !persisted ||
    !Array.isArray(persisted.candleData) ||
    persisted.candleData.length === 0
  ) {
    const fresh = generateChartDataForTimeframe(timeframe, currentVerifiedCount);
    // Align last candle close to currentPrice
    if (fresh.candleData.length > 0) {
      const lastIdx = fresh.candleData.length - 1;
      fresh.candleData[lastIdx].close = currentPrice;
      fresh.candleData[lastIdx].high = Math.max(fresh.candleData[lastIdx].high, currentPrice);
      fresh.candleData[lastIdx].low = Math.min(fresh.candleData[lastIdx].low, currentPrice);
      if (fresh.lineData.length > lastIdx) {
        fresh.lineData[lastIdx].price = currentPrice;
      }
    }
    savePersistedChartData(timeframe, fresh);
    return fresh;
  }

  // If persistent records exist, preserve every single previously recorded candle!
  const candleData = [...persisted.candleData];
  const lineData = [...(persisted.lineData || [])];
  const lastCandle = candleData[candleData.length - 1];

  // Check if clock has advanced into new bucket(s) while on another page or refreshed
  if (currentBucket > lastCandle.timestamp) {
    const intervalsPassed = Math.floor((currentBucket - lastCandle.timestamp) / intervalMs);
    const stepsToAdd = Math.min(intervalsPassed, maxBars);

    let runningClose = lastCandle.close;

    for (let step = 1; step <= stepsToAdd; step++) {
      const bucketTime = lastCandle.timestamp + step * intervalMs;
      const isLatestBucket = step === stepsToAdd;
      const open = runningClose;
      const close = isLatestBucket ? currentPrice : Number((runningClose * (1 + (Math.random() * 0.003 - 0.0015))).toFixed(10));
      const variance = timeframe === '1M' ? 0.003 : 0.01;
      const high = Math.max(open, close) * (1 + Math.random() * variance);
      const low = Math.min(open, close) * (1 - Math.random() * variance);
      const timeLabel = labelFormat(new Date(bucketTime));

      const newCandle: CandleTick = {
        timestamp: bucketTime,
        timeLabel,
        open: Number(open.toFixed(10)),
        high: Number(high.toFixed(10)),
        low: Number(Math.max(0.0000001, low).toFixed(10)),
        close: Number(close.toFixed(10)),
        volume: Math.floor(120000 + Math.random() * 260000),
        verifiedOnlineCount: currentVerifiedCount,
      };

      const newLine: PriceTick = {
        timestamp: bucketTime,
        timeLabel,
        price: Number(close.toFixed(10)),
        verifiedOnlineCount: currentVerifiedCount,
        volume: newCandle.volume,
      };

      candleData.push(newCandle);
      lineData.push(newLine);
      runningClose = close;
    }
  } else {
    // Still in the current candle bucket: update the live active candle with latest price
    const lastIdx = candleData.length - 1;
    candleData[lastIdx] = {
      ...candleData[lastIdx],
      close: currentPrice,
      high: Math.max(candleData[lastIdx].high, currentPrice),
      low: Math.min(candleData[lastIdx].low, currentPrice),
      verifiedOnlineCount: currentVerifiedCount,
    };
    if (lineData.length > 0) {
      const lastLineIdx = lineData.length - 1;
      lineData[lastLineIdx] = {
        ...lineData[lastLineIdx],
        price: currentPrice,
        verifiedOnlineCount: currentVerifiedCount,
      };
    }
  }

  // Slice to maxBars to maintain a crisp, responsive chart view
  const slicedCandles = candleData.slice(-maxBars);
  const slicedLines = lineData.slice(-maxBars);

  const result = { lineData: slicedLines, candleData: slicedCandles };
  savePersistedChartData(timeframe, result);
  return result;
}

/**
 * Persists chart records to localStorage so each candle is permanently recorded.
 */
export function savePersistedChartData(
  timeframe: ChartTimeframe,
  data: { lineData: PriceTick[]; candleData: CandleTick[] }
): void {
  try {
    const storageKey = `cps_chart_records_${timeframe}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Safely ignore storage quota limits
  }
}
