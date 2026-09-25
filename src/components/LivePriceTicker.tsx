import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  BarChart2, 
  LineChart as LineChartIcon,
  Users,
  Eye,
  Sparkles,
  Target,
  X,
  ChevronDown,
  Crosshair,
  Grid,
  Clock,
  Check
} from 'lucide-react';
import { PriceTick, CandleTick, ChartType, ChartTimeframe } from '../types';
import { formatCryptoPrice, formatSubscriptPrice } from '../utils/pricingEngine';
import { 
  generateChartDataForTimeframe, 
  getOrInitializePersistedChartData,
  savePersistedChartData,
  getTimeframeIntervalMs, 
  getTimeframeLabelFormat 
} from '../utils/chartDataGenerator';

interface LivePriceTickerProps {
  currentPrice: number;
  previousPrice: number;
  activeVerifiedCount: number;
  freeOnlineCount: number;
  chartData: PriceTick[];
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChangePercent24h: number;
  targetPriceAlert?: number | null;
  onTargetPriceChange?: (targetPrice: number | null) => void;
  onPriceAlertTriggered?: (targetPrice: number, reachedPrice: number) => void;
  isTargetAlertActive?: boolean;
  onOpenTargetAlert?: () => void;
}

interface TimeframeOption {
  id: ChartTimeframe;
  shortLabel: string; // Timeframe code: M1, M5, M15, H1, H4, D1, 1M, MN
  fullLabel: string;
  description: string;
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { id: '1M', shortLabel: 'M1', fullLabel: '1 Minute', description: 'Real-time micro ticks' },
  { id: '5M', shortLabel: 'M5', fullLabel: '5 Minutes', description: 'Short interval' },
  { id: '15M', shortLabel: 'M15', fullLabel: '15 Minutes', description: 'Intraday swing' },
  { id: '1H', shortLabel: 'H1', fullLabel: '1 Hour', description: 'Hourly trend' },
  { id: '4H', shortLabel: 'H4', fullLabel: '4 Hours', description: 'Market structure' },
  { id: '24H', shortLabel: 'D1', fullLabel: '24 Hours (Daily)', description: 'Daily overview' },
  { id: '1Month', shortLabel: '1M', fullLabel: '1 Month', description: 'Monthly macro' },
  { id: 'All Time', shortLabel: 'MN', fullLabel: 'All Time', description: 'Full history' },
];

export const LivePriceTicker: React.FC<LivePriceTickerProps> = ({
  currentPrice,
  previousPrice,
  activeVerifiedCount,
  freeOnlineCount,
  chartData: initialChartData,
  high24h,
  low24h,
  volume24h,
  priceChangePercent24h,
  targetPriceAlert = null,
  onTargetPriceChange,
  onPriceAlertTriggered,
  isTargetAlertActive = false,
  onOpenTargetAlert,
}) => {
  const [chartType, setChartType] = useState<ChartType>(() => {
    try {
      const saved = localStorage.getItem('cps_chart_type');
      if (saved === 'line' || saved === 'candle') return saved;
    } catch {}
    return 'candle';
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>(() => {
    try {
      const saved = localStorage.getItem('cps_selected_timeframe');
      if (saved) return saved as ChartTimeframe;
    } catch {}
    return '1M';
  });

  useEffect(() => {
    try {
      localStorage.setItem('cps_chart_type', chartType);
    } catch {}
  }, [chartType]);

  useEffect(() => {
    try {
      localStorage.setItem('cps_selected_timeframe', selectedTimeframe);
    } catch {}
  }, [selectedTimeframe]);
  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [enableCrosshair, setEnableCrosshair] = useState(true);

  // Crosshair coordinates and active point
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number; price: number } | null>(null);
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState<number | null>(null);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);

  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [useSubscriptNotation, setUseSubscriptNotation] = useState(false);

  // Target price input state
  const [targetInput, setTargetInput] = useState<string>(() =>
    targetPriceAlert ? targetPriceAlert.toString() : ''
  );
  const [targetHitToast, setTargetHitToast] = useState<{ price: number; target: number } | null>(null);
  const lastTriggeredTargetRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<SVGSVGElement>(null);

  // Synchronize targetInput if prop changes from outside
  useEffect(() => {
    if (targetPriceAlert !== null && targetPriceAlert !== undefined) {
      const parsed = parseFloat(targetInput);
      if (isNaN(parsed) || Math.abs(parsed - targetPriceAlert) > 1e-10) {
        setTargetInput(targetPriceAlert.toFixed(7));
      }
    } else if (targetPriceAlert === null && targetInput !== '') {
      setTargetInput('');
    }
  }, [targetPriceAlert]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTimeframeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Audio chime & notification trigger when dynamic price hits or exceeds target
  useEffect(() => {
    if (
      targetPriceAlert &&
      targetPriceAlert > 0 &&
      currentPrice >= targetPriceAlert &&
      lastTriggeredTargetRef.current !== targetPriceAlert
    ) {
      lastTriggeredTargetRef.current = targetPriceAlert;
      onPriceAlertTriggered?.(targetPriceAlert, currentPrice);
      setTargetHitToast({ price: currentPrice, target: targetPriceAlert });

      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, now);
          osc1.frequency.setValueAtTime(880.00, now + 0.12);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(1174.66, now + 0.12);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now);
          osc2.start(now + 0.12);
          osc1.stop(now + 0.5);
          osc2.stop(now + 0.5);
        }
      } catch {
        // Safe fallback for audio policy
      }
    }
  }, [currentPrice, targetPriceAlert, onPriceAlertTriggered]);

  const handleTargetChange = (val: string) => {
    setTargetInput(val);
    const cleaned = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      onTargetPriceChange?.(num);
      lastTriggeredTargetRef.current = null;
    } else if (val.trim() === '') {
      onTargetPriceChange?.(null);
      lastTriggeredTargetRef.current = null;
    }
  };

  const handleClearTarget = () => {
    setTargetInput('');
    onTargetPriceChange?.(null);
    lastTriggeredTargetRef.current = null;
    setTargetHitToast(null);
  };

  const focusTargetInput = () => {
    if (onOpenTargetAlert) {
      onOpenTargetAlert();
    }
    const el = document.getElementById('chart-target-price-input');
    el?.focus();
  };

  // Timeframe-specific data generation with persistent separate candle records
  const [activeData, setActiveData] = useState<{
    lineData: PriceTick[];
    candleData: CandleTick[];
  }>(() => getOrInitializePersistedChartData(selectedTimeframe, activeVerifiedCount, currentPrice));

  // Countdown in seconds until current candle closes and next candle starts
  const [secondsUntilNextCandle, setSecondsUntilNextCandle] = useState<number>(() => {
    const intervalMs = getTimeframeIntervalMs(selectedTimeframe);
    const now = Date.now();
    const currentBucket = Math.floor(now / intervalMs) * intervalMs;
    return Math.max(1, Math.ceil((currentBucket + intervalMs - now) / 1000));
  });

  // Load persistent records when timeframe changes
  useEffect(() => {
    const loaded = getOrInitializePersistedChartData(selectedTimeframe, activeVerifiedCount, currentPrice);
    setActiveData(loaded);

    const intervalMs = getTimeframeIntervalMs(selectedTimeframe);
    const now = Date.now();
    const currentBucket = Math.floor(now / intervalMs) * intervalMs;
    setSecondsUntilNextCandle(Math.max(1, Math.ceil((currentBucket + intervalMs - now) / 1000)));
  }, [selectedTimeframe]);

  // Method to advance to next candle (triggered automatically when timeframe completes or by user click)
  const advanceToNextCandle = () => {
    const intervalMs = getTimeframeIntervalMs(selectedTimeframe);
    const labelFormat = getTimeframeLabelFormat(selectedTimeframe);
    const now = Date.now();
    const currentBucket = Math.floor(now / intervalMs) * intervalMs;

    setActiveData((prev) => {
      if (prev.candleData.length === 0) return prev;

      const lastCandle = prev.candleData[prev.candleData.length - 1];
      const nextTimestamp = currentBucket > lastCandle.timestamp 
        ? currentBucket 
        : lastCandle.timestamp + intervalMs;

      const prevClose = lastCandle.close;
      const openPrice = prevClose;
      const closePrice = currentPrice;
      const highPrice = Math.max(openPrice, closePrice);
      const lowPrice = Math.min(openPrice, closePrice);
      const timeLabel = labelFormat(new Date(nextTimestamp));

      const newCandleItem: CandleTick = {
        timestamp: nextTimestamp,
        timeLabel,
        open: Number(openPrice.toFixed(10)),
        high: Number(highPrice.toFixed(10)),
        low: Number(Math.max(0.0000001, lowPrice).toFixed(10)),
        close: Number(closePrice.toFixed(10)),
        volume: Math.floor(120000 + Math.random() * 260000),
        verifiedOnlineCount: activeVerifiedCount,
      };

      const newLineItem: PriceTick = {
        timestamp: nextTimestamp,
        timeLabel,
        price: closePrice,
        verifiedOnlineCount: activeVerifiedCount,
        volume: newCandleItem.volume,
      };

      const maxBars = selectedTimeframe === '1Month' ? 30 : selectedTimeframe === 'All Time' ? 36 : 35;
      const updatedCandles = [...prev.candleData, newCandleItem].slice(-maxBars);
      const updatedLines = [...prev.lineData, newLineItem].slice(-maxBars);

      const nextData = {
        lineData: updatedLines,
        candleData: updatedCandles,
      };
      savePersistedChartData(selectedTimeframe, nextData);
      return nextData;
    });

    setSecondsUntilNextCandle(Math.floor(intervalMs / 1000));
  };

  // Automated candle timeframe ticker engine:
  // Runs every 1 second, updates countdown, and automatically starts next candle when timeframe completes!
  useEffect(() => {
    const intervalMs = getTimeframeIntervalMs(selectedTimeframe);
    const labelFormat = getTimeframeLabelFormat(selectedTimeframe);

    const ticker = setInterval(() => {
      const now = Date.now();
      const currentBucket = Math.floor(now / intervalMs) * intervalMs;
      const nextBucket = currentBucket + intervalMs;
      const secRemaining = Math.max(0, Math.ceil((nextBucket - now) / 1000));
      setSecondsUntilNextCandle(secRemaining);

      setActiveData((prev) => {
        if (prev.candleData.length === 0) return prev;

        const lastCandle = prev.candleData[prev.candleData.length - 1];

        // If current clock has crossed into the next timeframe interval:
        // Automatically close current candle and start a brand NEW candle!
        if (currentBucket > lastCandle.timestamp) {
          const prevClose = lastCandle.close;
          const openPrice = prevClose;
          const closePrice = currentPrice;
          const highPrice = Math.max(openPrice, closePrice);
          const lowPrice = Math.min(openPrice, closePrice);
          const timeLabel = labelFormat(new Date(currentBucket));

          const newCandleItem: CandleTick = {
            timestamp: currentBucket,
            timeLabel,
            open: Number(openPrice.toFixed(10)),
            high: Number(highPrice.toFixed(10)),
            low: Number(Math.max(0.0000001, lowPrice).toFixed(10)),
            close: Number(closePrice.toFixed(10)),
            volume: Math.floor(130000 + Math.random() * 250000),
            verifiedOnlineCount: activeVerifiedCount,
          };

          const newLineItem: PriceTick = {
            timestamp: currentBucket,
            timeLabel,
            price: closePrice,
            verifiedOnlineCount: activeVerifiedCount,
            volume: newCandleItem.volume,
          };

          const maxBars = selectedTimeframe === '1Month' ? 30 : selectedTimeframe === 'All Time' ? 36 : 35;
          const updatedCandles = [...prev.candleData, newCandleItem].slice(-maxBars);
          const updatedLines = [...prev.lineData, newLineItem].slice(-maxBars);

          const nextData = {
            lineData: updatedLines,
            candleData: updatedCandles,
          };
          savePersistedChartData(selectedTimeframe, nextData);
          return nextData;
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [selectedTimeframe, currentPrice, activeVerifiedCount]);

  // Update current live active candle in real-time as price ticks/actuators change
  useEffect(() => {
    setActiveData((prev) => {
      const newLine = [...prev.lineData];
      const newCandle = [...prev.candleData];

      if (newLine.length > 0) {
        const lastIdx = newLine.length - 1;
        newLine[lastIdx] = {
          ...newLine[lastIdx],
          price: currentPrice,
          verifiedOnlineCount: activeVerifiedCount,
        };
      }

      if (newCandle.length > 0) {
        const lastIdx = newCandle.length - 1;
        const currentCandle = newCandle[lastIdx];
        const newHigh = Math.max(currentCandle.high, currentPrice);
        const newLow = Math.min(currentCandle.low, currentPrice);
        newCandle[lastIdx] = {
          ...currentCandle,
          close: currentPrice,
          high: newHigh,
          low: newLow,
          verifiedOnlineCount: activeVerifiedCount,
        };
      }

      const nextData = { lineData: newLine, candleData: newCandle };
      savePersistedChartData(selectedTimeframe, nextData);
      return nextData;
    });
  }, [currentPrice, activeVerifiedCount, selectedTimeframe]);

  // Price flash animation
  useEffect(() => {
    if (currentPrice > previousPrice) {
      setPriceFlash('up');
      const timer = setTimeout(() => setPriceFlash(null), 800);
      return () => clearTimeout(timer);
    } else if (currentPrice < previousPrice) {
      setPriceFlash('down');
      const timer = setTimeout(() => setPriceFlash(null), 800);
      return () => clearTimeout(timer);
    }
  }, [currentPrice, previousPrice]);

  const subscript = formatSubscriptPrice(currentPrice);
  const isUp = priceChangePercent24h >= 0;

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // MT5 CHART GEOMETRY & VIEWBOX DIMENSIONS
  // =========================================================================
  const svgWidth = 850;
  const svgHeight = 360;

  // Right-side Y-Axis Price Gutter
  const yAxisWidth = 85;
  // Down-side X-Axis Time Gutter
  const xAxisHeight = 32;

  const paddingTop = 22;
  const paddingLeft = 14;

  const chartWidth = svgWidth - paddingLeft - yAxisWidth;
  const chartHeight = svgHeight - paddingTop - xAxisHeight;
  const volumeHeight = 34;

  const linePoints = activeData.lineData;
  const candlePoints = activeData.candleData;

  // Price range calculation
  const minPrice = useMemo(() => {
    let baseMin: number;
    if (chartType === 'line') {
      const prices = linePoints.map(p => p.price);
      baseMin = prices.length ? Math.min(...prices) * 0.985 : currentPrice * 0.985;
    } else {
      const lows = candlePoints.map(c => c.low);
      baseMin = lows.length ? Math.min(...lows) * 0.985 : currentPrice * 0.985;
    }
    if (targetPriceAlert && targetPriceAlert > 0) {
      baseMin = Math.min(baseMin, targetPriceAlert * 0.98);
    }
    return Math.max(0.00000005, baseMin);
  }, [chartType, linePoints, candlePoints, currentPrice, targetPriceAlert]);

  const maxPrice = useMemo(() => {
    let baseMax: number;
    if (chartType === 'line') {
      const prices = linePoints.map(p => p.price);
      baseMax = prices.length ? Math.max(...prices) * 1.015 : currentPrice * 1.015;
    } else {
      const highs = candlePoints.map(c => c.high);
      baseMax = highs.length ? Math.max(...highs) * 1.015 : currentPrice * 1.015;
    }
    if (targetPriceAlert && targetPriceAlert > 0) {
      baseMax = Math.max(baseMax, targetPriceAlert * 1.03);
    }
    return baseMax;
  }, [chartType, linePoints, candlePoints, currentPrice, targetPriceAlert]);

  const priceRange = maxPrice - minPrice || 1e-9;
  const activePlotHeight = chartHeight - volumeHeight;

  // Coordinate mappers
  const getYCoordinate = (price: number) => {
    const normalized = (price - minPrice) / priceRange;
    return paddingTop + (1 - normalized) * activePlotHeight;
  };

  const getPriceFromY = (y: number) => {
    const clampedY = Math.max(paddingTop, Math.min(paddingTop + activePlotHeight, y));
    const normalized = 1 - (clampedY - paddingTop) / activePlotHeight;
    return minPrice + normalized * priceRange;
  };

  const getXCoordinate = (index: number, total: number) => {
    const slotWidth = chartWidth / Math.max(1, total);
    return paddingLeft + (index + 0.5) * slotWidth;
  };

  // Line path
  const linePath = useMemo(() => {
    return linePoints
      .map((p, i) => {
        const x = getXCoordinate(i, linePoints.length);
        const y = getYCoordinate(p.price);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [linePoints, minPrice, maxPrice]);

  const areaPath = useMemo(() => {
    if (!linePoints.length) return '';
    const firstX = getXCoordinate(0, linePoints.length);
    const lastX = getXCoordinate(linePoints.length - 1, linePoints.length);
    const bottomY = paddingTop + activePlotHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, linePoints.length, activePlotHeight]);

  // Y-Axis Horizontal Grid & Price Ticks (Right Side)
  const priceGridLevels = useMemo(() => {
    const stepCount = 6;
    const levels: { y: number; price: number }[] = [];
    for (let i = 0; i <= stepCount; i++) {
      const price = minPrice + (priceRange * i) / stepCount;
      const y = getYCoordinate(price);
      levels.push({ y, price });
    }
    return levels;
  }, [minPrice, priceRange, activePlotHeight]);

  // X-Axis Vertical Grid & Time Ticks (Down Side)
  const timeGridLevels = useMemo(() => {
    const total = chartType === 'candle' ? candlePoints.length : linePoints.length;
    if (total === 0) return [];
    const stepCount = Math.min(6, Math.max(3, Math.floor(total / 4)));
    const levels: { x: number; label: string }[] = [];

    for (let i = 0; i < total; i += Math.ceil(total / stepCount)) {
      const x = getXCoordinate(i, total);
      const label = chartType === 'candle' ? candlePoints[i]?.timeLabel : linePoints[i]?.timeLabel;
      if (label) {
        levels.push({ x, label });
      }
    }

    // Always include the right-most tick
    const lastIdx = total - 1;
    const lastX = getXCoordinate(lastIdx, total);
    const lastLabel = chartType === 'candle' ? candlePoints[lastIdx]?.timeLabel : linePoints[lastIdx]?.timeLabel;
    if (lastLabel && levels.every(l => Math.abs(l.x - lastX) > 40)) {
      levels.push({ x: lastX, label: lastLabel });
    }

    return levels;
  }, [chartType, candlePoints, linePoints, chartWidth]);

  // Active Candle / Point for Top HUD Display
  const activeCandle = useMemo(() => {
    if (hoveredCandleIndex !== null && candlePoints[hoveredCandleIndex]) {
      return candlePoints[hoveredCandleIndex];
    }
    return candlePoints[candlePoints.length - 1] || null;
  }, [hoveredCandleIndex, candlePoints]);

  const activeLinePoint = useMemo(() => {
    if (hoveredLineIndex !== null && linePoints[hoveredLineIndex]) {
      return linePoints[hoveredLineIndex];
    }
    return linePoints[linePoints.length - 1] || null;
  }, [hoveredLineIndex, linePoints]);

  // Current Price Y-coordinate & Target Price Y-coordinate
  const yCurrentPrice = getYCoordinate(currentPrice);
  const yTargetPrice = targetPriceAlert ? getYCoordinate(targetPriceAlert) : null;
  const isTargetHit = targetPriceAlert ? currentPrice >= targetPriceAlert : false;

  // Crosshair Mouse Move Handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgContainerRef.current) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert client coords to SVG viewBox coords
    const svgX = (clientX / rect.width) * svgWidth;
    const svgY = (clientY / rect.height) * svgHeight;

    // Constrain within chart area
    if (
      svgX >= paddingLeft &&
      svgX <= paddingLeft + chartWidth &&
      svgY >= paddingTop &&
      svgY <= paddingTop + chartHeight
    ) {
      const priceAtY = getPriceFromY(svgY);
      setCrosshairPos({ x: svgX, y: svgY, price: priceAtY });

      // Find nearest candle or line point
      const total = chartType === 'candle' ? candlePoints.length : linePoints.length;
      const slotWidth = chartWidth / total;
      const idx = Math.min(
        total - 1,
        Math.max(0, Math.floor((svgX - paddingLeft) / slotWidth))
      );

      if (chartType === 'candle') {
        setHoveredCandleIndex(idx);
        setHoveredLineIndex(null);
      } else {
        setHoveredLineIndex(idx);
        setHoveredCandleIndex(null);
      }
    } else {
      setCrosshairPos(null);
      setHoveredCandleIndex(null);
      setHoveredLineIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshairPos(null);
    setHoveredCandleIndex(null);
    setHoveredLineIndex(null);
  };

  const activeTimeframeObj = TIMEFRAME_OPTIONS.find(t => t.id === selectedTimeframe) || TIMEFRAME_OPTIONS[0];

  return (
    <div
      id="cps-live-price-ticker"
      className="rounded-3xl border transition-all shadow-2xl overflow-hidden"
      style={{
        backgroundColor: '#080c14',
        borderColor: 'rgba(56, 189, 248, 0.18)',
      }}
    >
      {/* ========================================================================= */}
      {/* TOP HEADER: SYMBOL, LIVE PRICE, OHLC HUD, TIMEFRAME DROPDOWN, CONTROLS     */}
      {/* ========================================================================= */}
      <div 
        className="px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3"
        style={{
          borderColor: 'rgba(148, 163, 184, 0.12)',
          backgroundColor: '#0b111c'
        }}
      >
        {/* Left: Symbol, Live Price & 24h Change */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-600 flex items-center justify-center font-extrabold text-xs text-white shadow-md shadow-sky-500/25 shrink-0">
              CPS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-mono">
                  CPS/USD
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {activeTimeframeObj.shortLabel}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Dynamic Tick
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Community Power Share • Real-Time Dynamic Actuator Engine
              </p>
            </div>
          </div>

          {/* Top Live Price Display */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-700/60">
            <div
              id="live-dynamic-price-number"
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight transition-all duration-300 rounded px-2 py-0.5 ${
                priceFlash === 'up'
                  ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40'
                  : priceFlash === 'down'
                  ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40'
                  : 'text-sky-300'
              }`}
            >
              {useSubscriptNotation ? (
                <span>
                  {subscript.prefix}
                  {subscript.zeroCount > 0 && (
                    <sub className="text-xs text-sky-300/80 mr-0.5">
                      0_{subscript.zeroCount}
                    </sub>
                  )}
                  {subscript.significantDigits}
                </span>
              ) : (
                formatCryptoPrice(currentPrice)
              )}
            </div>

            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md font-mono ${
                isUp
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isUp ? '+' : ''}
              {priceChangePercent24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Right Controls: Timeframe Dropdown, Target Field, Candles/Line, Tools */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Target Price (TP) Control */}
          <div
            id="chart-target-price-control"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs transition-colors"
            style={{
              borderColor: targetPriceAlert ? 'rgba(245, 158, 11, 0.55)' : 'rgba(148, 163, 184, 0.2)',
              backgroundColor: targetPriceAlert ? 'rgba(245, 158, 11, 0.08)' : 'rgba(15, 23, 42, 0.7)',
            }}
            title="Set Target Price (TP) horizontal line on chart"
          >
            <Target className={`w-3.5 h-3.5 shrink-0 ${targetPriceAlert ? 'text-amber-400' : 'text-slate-400'}`} />
            <label htmlFor="chart-target-price-input" className="text-[11px] font-bold text-amber-300 shrink-0">
              TP:
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-1.5 text-[11px] font-mono text-slate-500">$</span>
              <input
                id="chart-target-price-input"
                type="text"
                value={targetInput}
                onChange={(e) => handleTargetChange(e.target.value)}
                placeholder="0.0000035"
                className="w-24 sm:w-28 pl-4 pr-1.5 py-0.5 text-xs font-mono rounded-lg bg-slate-950 border border-slate-700/80 text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            {targetPriceAlert ? (
              <button
                type="button"
                onClick={handleClearTarget}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Clear Target Price"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>

          {/* TIMEFRAME DROPDOWN (As explicitly requested by user) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="chart-timeframe-dropdown-btn"
              onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold font-mono transition-all bg-slate-900/90 hover:bg-slate-800 text-sky-300 border-sky-500/30 hover:border-sky-400 shadow-sm"
              title="Select Chart Timeframe (M1, M5, M15, H1, H4, D1, 1M, MN)"
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Timeframe:</span>
              <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-white font-black">
                {activeTimeframeObj.shortLabel}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTimeframeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isTimeframeDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border shadow-2xl z-50 p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                style={{
                  backgroundColor: '#0d1527',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                }}
              >
                <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Chart Intervals
                  </span>
                  <span className="text-[9px] font-mono text-sky-400">8 Presets</span>
                </div>

                <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                  {TIMEFRAME_OPTIONS.map((tf) => {
                    const isSelected = selectedTimeframe === tf.id;
                    return (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => {
                          setSelectedTimeframe(tf.id);
                          setIsTimeframeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-mono transition-all ${
                          isSelected
                            ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-sky-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-8 text-center text-xs font-black px-1.5 py-0.5 rounded ${isSelected ? 'bg-slate-950/40 text-white' : 'bg-slate-800 text-sky-400'}`}>
                            {tf.shortLabel}
                          </span>
                          <div>
                            <div className="text-xs font-semibold">{tf.fullLabel}</div>
                            <div className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                              {tf.description}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick MT5 Shortcut Pills: M1, M5, H1, D1 */}
          <div className="hidden sm:flex items-center rounded-xl border p-0.5 text-xs font-mono bg-slate-950/80 border-slate-800">
            {(['1M', '5M', '1H', '24H'] as const).map((tf) => {
              const obj = TIMEFRAME_OPTIONS.find(t => t.id === tf)!;
              const isSelected = selectedTimeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/50'
                  }`}
                  title={obj.fullLabel}
                >
                  {obj.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Candle vs Line Toggle */}
          <div
            id="chart-type-toggle-group"
            className="flex items-center rounded-xl border p-0.5 text-xs font-medium bg-slate-950/80 border-slate-800"
          >
            <button
              id="chart-mode-candle-btn"
              onClick={() => setChartType('candle')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                chartType === 'candle'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
              title="Candlestick Chart view"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Candles</span>
            </button>
            <button
              id="chart-mode-line-btn"
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                chartType === 'line'
                  ? 'bg-sky-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-sky-400'
              }`}
              title="Line Chart view"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Line</span>
            </button>
          </div>

          {/* Crosshair Toggle */}
          <button
            type="button"
            onClick={() => setEnableCrosshair(!enableCrosshair)}
            className={`p-1.5 rounded-xl border text-xs transition-colors ${
              enableCrosshair 
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Crosshair"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-xl border text-xs transition-colors ${
              showGrid 
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Subscript Notation Toggle */}
          <button
            id="subscript-toggle-btn"
            onClick={() => setUseSubscriptNotation(!useSubscriptNotation)}
            className="hidden md:inline-flex px-2.5 py-1 text-[11px] font-mono rounded-xl border border-slate-800 text-slate-400 hover:text-sky-300 hover:border-slate-700 bg-slate-950/80 transition-colors"
            title="Toggle micro-notation for sub-penny price display"
          >
            {useSubscriptNotation ? 'Decimals' : 'Micro'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY HUD BAR: REAL-TIME OHLC (OPEN, HIGH, LOW, CLOSE, VOL, ACTUATORS) */}
      {/* ========================================================================= */}
      <div 
        className="px-4 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-mono"
        style={{
          backgroundColor: '#0a0f19',
          borderColor: 'rgba(148, 163, 184, 0.08)',
        }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <strong className="text-slate-200">
              {crosshairPos ? 'INSPECT' : 'LIVE BAR'}:
            </strong>
          </span>

          {chartType === 'candle' && activeCandle ? (
            <>
              <span className="text-slate-400">
                O: <span className="text-slate-200 font-bold">{formatCryptoPrice(activeCandle.open)}</span>
              </span>
              <span className="text-slate-400">
                H: <span className="text-emerald-400 font-bold">{formatCryptoPrice(activeCandle.high)}</span>
              </span>
              <span className="text-slate-400">
                L: <span className="text-rose-400 font-bold">{formatCryptoPrice(activeCandle.low)}</span>
              </span>
              <span className="text-slate-400">
                C: <span className={`font-bold ${activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCryptoPrice(activeCandle.close)}
                </span>
              </span>
              <span className="text-slate-400 hidden sm:inline">
                Vol: <span className="text-sky-300">{activeCandle.volume.toLocaleString()}</span>
              </span>
              <span className="text-slate-500 text-[11px] hidden md:inline">
                ({activeCandle.timeLabel})
              </span>
            </>
          ) : activeLinePoint ? (
            <>
              <span className="text-slate-400">
                Price: <span className="text-sky-300 font-bold">{formatCryptoPrice(activeLinePoint.price)}</span>
              </span>
              <span className="text-slate-400 hidden sm:inline">
                Vol: <span className="text-slate-300">{activeLinePoint.volume.toLocaleString()}</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                ({activeLinePoint.timeLabel})
              </span>
            </>
          ) : null}
        </div>

        {/* Actuator Presence Price Driver Status & Next Candle Countdown */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          {/* Live Next Candle Countdown Badge (Authentic real-time market timer) */}
          <div
            id="chart-next-candle-badge"
            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] sm:text-[11px] flex items-center gap-1.5 font-bold shadow-sm"
            title={`Next ${selectedTimeframe} candle starts in ${formatCountdown(secondsUntilNextCandle)}`}
          >
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Next Candle: <strong className="text-white font-mono">{formatCountdown(secondsUntilNextCandle)}</strong></span>
          </div>

          <span className="text-amber-300 flex items-center gap-1 font-semibold">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{activeVerifiedCount} Actuators Online</span>
          </span>
          <span className="text-slate-500 hidden lg:inline">•</span>
          <span className="text-slate-400 hidden lg:inline">
            Observers: {freeOnlineCount}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN MT5 INTERACTIVE SVG CHART STAGE                                      */}
      {/* Right Side: Price Scale + Live Current Price Tag + Target Price Tag       */}
      {/* Down Side: Time Scale along the border                                    */}
      {/* ========================================================================= */}
      <div className="relative w-full select-none" style={{ backgroundColor: '#070b13' }}>
        {/* Target Hit Notification Float */}
        {targetHitToast && (
          <div 
            id="chart-target-hit-toast"
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-slate-950 font-mono text-xs font-extrabold shadow-2xl shadow-emerald-500/50 border border-emerald-300 animate-bounce"
          >
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>🎯 Target {formatCryptoPrice(targetHitToast.target)} REACHED! (Live: {formatCryptoPrice(targetHitToast.price)})</span>
            <button 
              onClick={() => setTargetHitToast(null)} 
              className="p-1 rounded-full hover:bg-emerald-600 text-slate-950 transition-colors ml-1"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <svg
          ref={svgContainerRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-80 sm:h-[400px] lg:h-[430px] cursor-crosshair block"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Area Fill Gradient for Line Chart */}
            <linearGradient id="mt5AreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Main Price Line Gradient */}
            <linearGradient id="mt5LineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>

            {/* Pattern for background texture */}
            <pattern id="mt5GridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.03)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Chart Backdrop Background */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={chartWidth}
            height={chartHeight}
            fill="#080c14"
          />
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={chartWidth}
            height={chartHeight}
            fill="url(#mt5GridPattern)"
          />

          {/* ===================================================================== */}
          {/* MT5 GRID LINES (HORIZONTAL PRICE & VERTICAL TIME)                     */}
          {/* ===================================================================== */}
          {showGrid && (
            <g id="mt5-grid-lines">
              {/* Horizontal Price Grid Lines */}
              {priceGridLevels.map((lvl, idx) => (
                <line
                  key={`h-grid-${idx}`}
                  x1={paddingLeft}
                  y1={lvl.y}
                  x2={paddingLeft + chartWidth}
                  y2={lvl.y}
                  stroke="rgba(148, 163, 184, 0.09)"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Vertical Time Grid Lines */}
              {timeGridLevels.map((lvl, idx) => (
                <line
                  key={`v-grid-${idx}`}
                  x1={lvl.x}
                  y1={paddingTop}
                  x2={lvl.x}
                  y2={paddingTop + chartHeight}
                  stroke="rgba(148, 163, 184, 0.09)"
                  strokeDasharray="3 3"
                />
              ))}
            </g>
          )}

          {/* Border line separating Chart from Down-Side Time Gutter */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={paddingLeft + chartWidth}
            y2={paddingTop + chartHeight}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1.2"
          />

          {/* Border line separating Chart from Right-Side Price Gutter */}
          <line
            x1={paddingLeft + chartWidth}
            y1={paddingTop}
            x2={paddingLeft + chartWidth}
            y2={paddingTop + chartHeight}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1.2"
          />

          {/* ===================================================================== */}
          {/* VOLUME HISTOGRAM BARS AT BOTTOM OF CHART                              */}
          {/* ===================================================================== */}
          <g id="mt5-volume-histogram">
            {(chartType === 'candle' ? candlePoints : linePoints).map((item, idx) => {
              const total = chartType === 'candle' ? candlePoints.length : linePoints.length;
              const x = getXCoordinate(idx, total);
              const slotWidth = chartWidth / total;
              const barWidth = Math.max(2, slotWidth * 0.55);
              const volRatio = (item.volume || 200000) / 700000;
              const barH = Math.min(volumeHeight, Math.max(3, volRatio * volumeHeight));
              const barY = paddingTop + chartHeight - barH;

              const isBull = chartType === 'candle'
                ? (item as CandleTick).close >= (item as CandleTick).open
                : true;
              const fill = isBull ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)';

              return (
                <rect
                  key={`vol-${idx}`}
                  x={x - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  fill={fill}
                  rx="1"
                />
              );
            })}
          </g>

          {/* ===================================================================== */}
          {/* LINE CHART MODE                                                       */}
          {/* ===================================================================== */}
          {chartType === 'line' && (
            <g id="mt5-line-plot">
              {/* Gradient Area Fill under price */}
              {areaPath && <path d={areaPath} fill="url(#mt5AreaGradient)" />}

              {/* Main Price Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#mt5LineGlow)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points & pulse at current price */}
              {linePoints.map((p, idx) => {
                const x = getXCoordinate(idx, linePoints.length);
                const y = getYCoordinate(p.price);
                const isLast = idx === linePoints.length - 1;
                return (
                  <g key={idx}>
                    {isLast && (
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#38bdf8"
                        className="animate-ping opacity-75"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isLast ? '4.5' : '2'}
                      fill={isLast ? '#ffffff' : '#38bdf8'}
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* ===================================================================== */}
          {/* MT5 CANDLESTICK (OHLC) CHART MODE                                     */}
          {/* Bullish = Green (#10b981), Bearish = Red (#ef4444)                    */}
          {/* ===================================================================== */}
          {chartType === 'candle' && (
            <g id="mt5-candle-plot">
              {candlePoints.map((c, idx) => {
                const total = candlePoints.length;
                const x = getXCoordinate(idx, total);
                const slotWidth = chartWidth / total;
                const candleWidth = Math.max(3, Math.min(18, slotWidth * 0.72));

                const yOpen = getYCoordinate(c.open);
                const yClose = getYCoordinate(c.close);
                const yHigh = getYCoordinate(c.high);
                const yLow = getYCoordinate(c.low);

                const isBullish = c.close >= c.open;
                const candleColor = isBullish ? '#10b981' : '#ef4444';
                const bodyY = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

                const isHovered = hoveredCandleIndex === idx;

                return (
                  <g key={idx} className="transition-opacity">
                    {/* Upper & Lower Wicks (High to Low vertical line) */}
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth={isHovered ? '2' : '1.5'}
                      strokeLinecap="round"
                    />

                    {/* Candlestick Real Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      stroke={isHovered ? '#ffffff' : candleColor}
                      strokeWidth={isHovered ? '1.5' : '1'}
                      rx="1"
                    />

                    {/* Pulsing indicator on the latest active candle on the right */}
                    {idx === total - 1 && (
                      <circle
                        cx={x}
                        cy={yClose}
                        r="3.5"
                        fill="#ffffff"
                        stroke={candleColor}
                        strokeWidth="1.5"
                        className="animate-pulse"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ===================================================================== */}
          {/* TARGET PRICE (TP) HORIZONTAL LINE & RIGHT AXIS TP BADGE               */}
          {/* ===================================================================== */}
          {targetPriceAlert && targetPriceAlert > 0 && yTargetPrice !== null && (
            <g id="mt5-target-price-line">
              {/* Horizontal Target Line across chart canvas */}
              <line
                x1={paddingLeft}
                y1={yTargetPrice}
                x2={paddingLeft + chartWidth}
                y2={yTargetPrice}
                stroke={isTargetHit ? '#10b981' : '#f59e0b'}
                strokeWidth="1.8"
                strokeDasharray="5 3"
                strokeLinecap="round"
              />

              {/* Anchor dot on the left */}
              <circle
                cx={paddingLeft}
                cy={yTargetPrice}
                r="3"
                fill={isTargetHit ? '#10b981' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth="1"
              />

              {/* Target Price Badge on Right Axis */}
              <g 
                transform={`translate(${paddingLeft + chartWidth + 2}, ${Math.max(paddingTop + 2, Math.min(paddingTop + chartHeight - 20, yTargetPrice - 9))})`}
                className="cursor-pointer"
                onClick={focusTargetInput}
              >
                <rect
                  width={yAxisWidth - 4}
                  height="18"
                  rx="4"
                  fill={isTargetHit ? '#065f46' : '#78350f'}
                  stroke={isTargetHit ? '#34d399' : '#fbbf24'}
                  strokeWidth="1.2"
                />
                <text
                  x={(yAxisWidth - 4) / 2}
                  y="12.5"
                  textAnchor="middle"
                  fill={isTargetHit ? '#a7f3d0' : '#fef3c7'}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="ui-monospace, monospace"
                >
                  {isTargetHit ? 'TP HIT' : `TP ${formatCryptoPrice(targetPriceAlert).replace('$', '')}`}
                </text>
              </g>
            </g>
          )}

          {/* ===================================================================== */}
          {/* LIVE CURRENT PRICE HORIZONTAL LINE & RIGHT AXIS CURRENT PRICE BADGE   */}
          {/* (Bid / Ask real-time price tracker)                                   */}
          {/* ===================================================================== */}
          <g id="mt5-current-price-live-tracker">
            {/* Horizontal tracking line from chart across to right axis */}
            <line
              x1={paddingLeft}
              y1={yCurrentPrice}
              x2={paddingLeft + chartWidth}
              y2={yCurrentPrice}
              stroke={isUp ? '#10b981' : '#38bdf8'}
              strokeWidth="1.5"
              strokeDasharray="4 2"
              strokeOpacity="0.9"
            />

            {/* Arrow pointer pointing from right axis to chart */}
            <polygon
              points={`
                ${paddingLeft + chartWidth},${yCurrentPrice}
                ${paddingLeft + chartWidth + 5},${yCurrentPrice - 4}
                ${paddingLeft + chartWidth + 5},${yCurrentPrice + 4}
              `}
              fill={isUp ? '#10b981' : '#0284c7'}
            />

            {/* High-visibility Right Axis Current Price Badge */}
            <g transform={`translate(${paddingLeft + chartWidth + 4}, ${Math.max(paddingTop + 2, Math.min(paddingTop + chartHeight - 20, yCurrentPrice - 9))})`}>
              <rect
                width={yAxisWidth - 6}
                height="19"
                rx="4"
                fill={isUp ? '#059669' : '#0284c7'}
                stroke="#ffffff"
                strokeWidth="1.2"
                className="shadow-lg"
              />
              <text
                x={(yAxisWidth - 6) / 2}
                y="13"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="900"
                fontFamily="ui-monospace, monospace"
              >
                {formatCryptoPrice(currentPrice).replace('$', '')}
              </text>
            </g>
          </g>

          {/* ===================================================================== */}
          {/* RIGHT SIDE: Y-AXIS PRICE SCALE                                        */}
          {/* ===================================================================== */}
          <g id="mt5-right-price-axis">
            {priceGridLevels.map((lvl, idx) => (
              <g key={`y-tick-${idx}`}>
                {/* Small Tick Mark at border */}
                <line
                  x1={paddingLeft + chartWidth}
                  y1={lvl.y}
                  x2={paddingLeft + chartWidth + 4}
                  y2={lvl.y}
                  stroke="rgba(148, 163, 184, 0.4)"
                  strokeWidth="1"
                />
                {/* Price text in right gutter (hide if too close to current price or target price badge) */}
                {Math.abs(lvl.y - yCurrentPrice) > 13 &&
                  (!yTargetPrice || Math.abs(lvl.y - yTargetPrice) > 13) && (
                    <text
                      x={paddingLeft + chartWidth + 8}
                      y={lvl.y + 3.5}
                      fill="#94a3b8"
                      fontSize="9.5"
                      fontFamily="ui-monospace, monospace"
                      fontWeight="500"
                      textAnchor="start"
                    >
                      {formatCryptoPrice(lvl.price).replace('$', '')}
                    </text>
                  )}
              </g>
            ))}
          </g>

          {/* ===================================================================== */}
          {/* DOWN SIDE: X-AXIS TIME SCALE TO THE BORDER                            */}
          {/* ===================================================================== */}
          <g id="mt5-bottom-time-axis">
            {timeGridLevels.map((lvl, idx) => (
              <g key={`x-tick-${idx}`}>
                {/* Tick mark extending down into time gutter */}
                <line
                  x1={lvl.x}
                  y1={paddingTop + chartHeight}
                  x2={lvl.x}
                  y2={paddingTop + chartHeight + 5}
                  stroke="rgba(148, 163, 184, 0.4)"
                  strokeWidth="1"
                />
                {/* Time Label along bottom border */}
                <text
                  x={lvl.x}
                  y={paddingTop + chartHeight + 19}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {lvl.label}
                </text>
              </g>
            ))}
          </g>

          {/* ===================================================================== */}
          {/* MT5 CROSSHAIR OVERLAY (VERTICAL & HORIZONTAL INTERSECTION)            */}
          {/* ===================================================================== */}
          {enableCrosshair && crosshairPos && (
            <g id="mt5-interactive-crosshair" pointerEvents="none">
              {/* Vertical dotted crosshair line */}
              <line
                x1={crosshairPos.x}
                y1={paddingTop}
                x2={crosshairPos.x}
                y2={paddingTop + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Horizontal dotted crosshair line */}
              <line
                x1={paddingLeft}
                y1={crosshairPos.y}
                x2={paddingLeft + chartWidth}
                y2={crosshairPos.y}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Right Axis Crosshair Price Tag */}
              <g transform={`translate(${paddingLeft + chartWidth + 3}, ${Math.max(paddingTop + 2, Math.min(paddingTop + chartHeight - 18, crosshairPos.y - 8))})`}>
                <rect
                  width={yAxisWidth - 5}
                  height="16"
                  rx="3"
                  fill="#1e293b"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text
                  x={(yAxisWidth - 5) / 2}
                  y="11.5"
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="ui-monospace, monospace"
                >
                  {formatCryptoPrice(crosshairPos.price).replace('$', '')}
                </text>
              </g>

              {/* Down Axis Crosshair Time Tag */}
              {(() => {
                const label = chartType === 'candle'
                  ? activeCandle?.timeLabel
                  : activeLinePoint?.timeLabel;
                if (!label) return null;
                return (
                  <g transform={`translate(${Math.max(paddingLeft + 30, Math.min(paddingLeft + chartWidth - 45, crosshairPos.x)) - 38}, ${paddingTop + chartHeight + 3})`}>
                    <rect
                      width="76"
                      height="16"
                      rx="3"
                      fill="#1e293b"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <text
                      x="38"
                      y="11.5"
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="ui-monospace, monospace"
                    >
                      {label}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Floating Quick Legend / Mode Pill at top right inside chart */}
        <div className="absolute top-3 right-24 z-10 px-2 py-0.5 rounded text-[10px] font-mono border bg-slate-950/80 border-slate-800 text-slate-400 pointer-events-none hidden sm:block">
          <span className="font-bold text-sky-400">{activeTimeframeObj.shortLabel}</span> • {activeTimeframeObj.fullLabel}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER: SUPPLY, LATENCY & ACTIVE ACTUATOR PRESENCE STATS            */}
      {/* ========================================================================= */}
      <div 
        className="px-4 sm:px-6 py-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
        style={{
          borderColor: 'rgba(148, 163, 184, 0.1)',
          backgroundColor: '#0a0f19'
        }}
      >
        <div>
          <span className="block text-[11px] text-slate-500">24h High</span>
          <span className="font-mono font-bold text-slate-200">
            {formatCryptoPrice(high24h)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-slate-500">24h Low</span>
          <span className="font-mono font-bold text-slate-200">
            {formatCryptoPrice(low24h)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-slate-500">Circulating Supply</span>
          <span className="font-mono font-bold text-sky-400">
            100,000,000 CPS
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-slate-500">24h Volume (USD)</span>
          <span className="font-mono font-bold text-emerald-400">
            ${volume24h.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
