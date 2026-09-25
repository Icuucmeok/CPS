import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Radio,
  Zap,
  Eye,
  RefreshCw,
  MapPin,
  Wifi,
  Server,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  GeoLocationInfo,
  RegionalHub,
  detectClientLocation,
  calculateRegionalDistribution,
  latLngToSvgCoords,
} from '../utils/geoIpService';
import { formatCryptoPrice } from '../utils/pricingEngine';

interface AdminGeoHeatmapProps {
  activeVerifiedCount: number; // Green nodes
  freeOnlineCount: number; // Red nodes
  currentPrice: number;
  userRole?: string;
  userCountry?: string;
  userCountryCode?: string;
}

export const AdminGeoHeatmap: React.FC<AdminGeoHeatmapProps> = ({
  activeVerifiedCount,
  freeOnlineCount,
  currentPrice,
  userRole = 'actuator',
  userCountry,
  userCountryCode,
}) => {
  const [clientGeo, setClientGeo] = useState<GeoLocationInfo | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'actuators' | 'observers'>('all');
  const [selectedHub, setSelectedHub] = useState<RegionalHub | null>(null);
  const [hoveredHub, setHoveredHub] = useState<RegionalHub | null>(null);
  const [viewDensity, setViewDensity] = useState<'clusters' | 'thermal'>('clusters');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Run real IP Geolocation detection on mount
  useEffect(() => {
    let isMounted = true;
    setIsDetecting(true);
    detectClientLocation().then((geo) => {
      if (isMounted) {
        let finalGeo = geo;
        if (userCountryCode && userCountry) {
          finalGeo = {
            ...geo,
            country: userCountry,
            countryCode: userCountryCode,
            region: userCountry,
          };
        }
        setClientGeo(finalGeo);
        setIsDetecting(false);
        setLastRefreshedAt(new Date());
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userCountry, userCountryCode]);

  const handleManualRefreshGeo = () => {
    try {
      sessionStorage.removeItem('cps_detected_geo');
    } catch {}
    setIsDetecting(true);
    detectClientLocation().then((geo) => {
      setClientGeo(geo);
      setIsDetecting(false);
      setLastRefreshedAt(new Date());
    });
  };

  // Compute live regional distribution of green actuators and red observers
  const regionalHubs = useMemo(() => {
    return calculateRegionalDistribution(activeVerifiedCount, freeOnlineCount, clientGeo);
  }, [activeVerifiedCount, freeOnlineCount, clientGeo]);

  // Aggregate totals
  const totalActuatorsAllocated = useMemo(() => {
    return regionalHubs.reduce((sum, h) => sum + h.actuators, 0);
  }, [regionalHubs]);

  const totalObserversAllocated = useMemo(() => {
    return regionalHubs.reduce((sum, h) => sum + h.observers, 0);
  }, [regionalHubs]);

  // Filter hubs based on toggle
  const visibleHubs = useMemo(() => {
    if (filterMode === 'actuators') {
      return regionalHubs.filter((h) => h.actuators > 0);
    }
    if (filterMode === 'observers') {
      return regionalHubs.filter((h) => h.observers > 0);
    }
    return regionalHubs;
  }, [regionalHubs, filterMode]);

  // SVG Dimension Constants
  const mapWidth = 980;
  const mapHeight = 490;

  // Primary active backbone cluster (usually US-East Ashburn or Frankfurt)
  const primaryHubCoords = useMemo(() => {
    return latLngToSvgCoords(50.11, 8.68, mapWidth, mapHeight); // EU Central Frankfurt Hub
  }, [mapWidth, mapHeight]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP DIAGNOSTICS & CLIENT IP GEO BAR                                     */}
      {/* ========================================================================= */}
      <div
        className="p-5 rounded-3xl border shadow-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(239, 68, 68, 0.08) 100%)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-rose-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <Globe className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                  GLOBAL ACTUATOR & OBSERVER HEATMAP
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  REAL-TIME IP TELEMETRY
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Live geographic mapping of all incoming connections: 
                <strong className="text-emerald-400 font-semibold ml-1">Green = Verified Actuators</strong> and 
                <strong className="text-rose-400 font-semibold ml-1">Red = Active Observers</strong>
              </p>
            </div>
          </div>

          {/* Detected Client IP Card */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Your Detected Node IP
                </div>
                <div className="text-white font-bold flex items-center gap-1.5">
                  <span>{clientGeo ? clientGeo.flag : '🌐'}</span>
                  <span>{clientGeo ? clientGeo.ip : 'Resolving IP...'}</span>
                  <span className="text-slate-400 text-[11px] font-normal">
                    ({clientGeo ? `${clientGeo.city}, ${clientGeo.countryCode}` : 'Detecting...'})
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleManualRefreshGeo}
              disabled={isDetecting}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/60 ml-2"
              title="Re-query IP Geolocation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Node Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          {/* Green Actuators Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                Active Actuators
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {activeVerifiedCount} <span className="text-xs text-emerald-400/80 font-normal">Nodes</span>
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">
                Impacting floor price (+$0.0000001/node)
              </div>
            </div>
            <Zap className="w-7 h-7 text-emerald-400/40" />
          </div>

          {/* Red Observers Card */}
          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse" />
                Active Observers
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {freeOnlineCount} <span className="text-xs text-rose-400/80 font-normal">Nodes</span>
              </div>
              <div className="text-[10px] text-rose-300/80 mt-0.5">
                Passive viewers (0% weight)
              </div>
            </div>
            <Eye className="w-7 h-7 text-rose-400/40" />
          </div>

          {/* Total Network Connections */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                Total Live Traffic
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {activeVerifiedCount + freeOnlineCount} <span className="text-xs text-slate-400 font-normal">Streams</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Across {regionalHubs.length} Continental Gateways
              </div>
            </div>
            <Server className="w-7 h-7 text-sky-400/40" />
          </div>

          {/* Current Floor Valuation */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Driven Token Floor
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                {formatCryptoPrice(currentPrice)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Driven by Green Actuators
              </div>
            </div>
            <ShieldCheck className="w-7 h-7 text-amber-400/40" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE SVG WORLD MAP STAGE                                        */}
      {/* ========================================================================= */}
      <div 
        className="rounded-3xl border overflow-hidden relative shadow-2xl"
        style={{
          backgroundColor: '#040711',
          borderColor: 'var(--theme-border)',
        }}
      >
        {/* Map Header Toolbar with Green / Red Filters */}
        <div className="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              HEATMAP RADAR OVERLAY
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-[11px] font-mono">
              Projection: Equirectangular Global Grid (WGS84)
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Nodes</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-700 font-mono">
                {activeVerifiedCount + freeOnlineCount}
              </span>
            </button>

            <button
              onClick={() => setFilterMode('actuators')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                filterMode === 'actuators'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Actuators (Green)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-950 font-mono text-emerald-300">
                {activeVerifiedCount}
              </span>
            </button>

            <button
              onClick={() => setFilterMode('observers')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                filterMode === 'observers'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Observers (Red)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-950 font-mono text-rose-300">
                {freeOnlineCount}
              </span>
            </button>
          </div>
        </div>

        {/* SVG Global Heatmap Canvas */}
        <div className="relative w-full overflow-hidden select-none" style={{ minHeight: '440px' }}>
          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full h-auto block"
            style={{ filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.05))' }}
          >
            {/* SVG Definitions for Glows & Gradients */}
            <defs>
              {/* Green Glow for Actuators */}
              <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Red Glow for Observers */}
              <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Thermal Radial Gradients */}
              <radialGradient id="grad-actuator" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#059669" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="grad-observer" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#dc2626" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>

              {/* Arc Pulse Linear Gradient */}
              <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Background Grid Pattern (Cyber Lat/Long) */}
            <g id="map-lat-long-grid" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.75" strokeDasharray="3 3">
              {/* Latitude lines */}
              <line x1="0" y1={mapHeight * 0.2} x2={mapWidth} y2={mapHeight * 0.2} />
              <line x1="0" y1={mapHeight * 0.35} x2={mapWidth} y2={mapHeight * 0.35} />
              <line x1="0" y1={mapHeight * 0.5} x2={mapWidth} y2={mapHeight * 0.5} stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" /> {/* Equator */}
              <line x1="0" y1={mapHeight * 0.65} x2={mapWidth} y2={mapHeight * 0.65} />
              <line x1="0" y1={mapHeight * 0.8} x2={mapWidth} y2={mapHeight * 0.8} />

              {/* Longitude lines */}
              <line x1={mapWidth * 0.2} y1="0" x2={mapWidth * 0.2} y2={mapHeight} />
              <line x1={mapWidth * 0.35} y1="0" x2={mapWidth * 0.35} y2={mapHeight} />
              <line x1={mapWidth * 0.5} y1="0" x2={mapWidth * 0.5} y2={mapHeight} stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" /> {/* Prime Meridian */}
              <line x1={mapWidth * 0.65} y1="0" x2={mapWidth * 0.65} y2={mapHeight} />
              <line x1={mapWidth * 0.8} y1="0" x2={mapWidth * 0.8} y2={mapHeight} />
            </g>

            {/* Continental Silhouette Vectors (High-Tech Matrix Coastlines) */}
            <g id="continents-layer" fill="#0d1527" stroke="#1e293b" strokeWidth="1.2" opacity="0.95">
              {/* North America */}
              <path d="M 120 70 L 160 60 L 220 50 L 290 60 L 310 90 L 280 130 L 240 180 L 210 240 L 180 230 L 150 170 L 110 140 L 90 90 Z" />
              {/* Greenland */}
              <path d="M 330 40 L 380 45 L 370 80 L 330 85 Z" />
              {/* South America */}
              <path d="M 230 250 L 290 270 L 320 330 L 280 420 L 240 400 L 220 320 Z" />
              {/* Europe */}
              <path d="M 450 80 L 530 75 L 560 110 L 530 150 L 460 160 L 440 120 Z" />
              {/* United Kingdom */}
              <path d="M 445 100 L 460 95 L 455 120 L 440 115 Z" />
              {/* Africa */}
              <path d="M 460 180 L 550 180 L 570 240 L 540 340 L 480 340 L 440 240 Z" />
              {/* Asia & Middle East */}
              <path d="M 540 80 L 750 70 L 820 120 L 800 200 L 730 250 L 640 240 L 590 190 L 550 130 Z" />
              {/* India / South Asia subcontinent */}
              <path d="M 640 190 L 685 195 L 675 255 L 640 240 Z" />
              {/* Japan */}
              <path d="M 830 140 L 850 150 L 840 190 L 825 170 Z" />
              {/* Southeast Asia / Indonesia */}
              <path d="M 720 260 L 760 270 L 770 300 L 710 300 Z" />
              {/* Australia & New Zealand */}
              <path d="M 780 340 L 870 330 L 890 390 L 810 410 L 760 380 Z" />
              <path d="M 900 400 L 920 400 L 910 430 Z" />
            </g>

            {/* Subtle Arc Data Highways Connecting to Primary Frankfurt Core */}
            <g id="arcs-layer" opacity="0.6">
              {visibleHubs.map((hub) => {
                const coords = latLngToSvgCoords(hub.lat, hub.lng, mapWidth, mapHeight);
                // Quadratic bezier curve bending upwards
                const midX = (coords.x + primaryHubCoords.x) / 2;
                const midY = Math.min(coords.y, primaryHubCoords.y) - 40;
                return (
                  <path
                    key={`arc-${hub.id}`}
                    d={`M ${coords.x} ${coords.y} Q ${midX} ${midY} ${primaryHubCoords.x} ${primaryHubCoords.y}`}
                    fill="none"
                    stroke={hub.actuators > 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.25)'}
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                );
              })}
            </g>

            {/* Regional Hotspots (Green Actuators & Red Observers) */}
            <g id="hotspots-layer">
              {visibleHubs.map((hub) => {
                const coords = latLngToSvgCoords(hub.lat, hub.lng, mapWidth, mapHeight);
                const hasActuators = hub.actuators > 0 && filterMode !== 'observers';
                const hasObservers = hub.observers > 0 && filterMode !== 'actuators';
                const isHovered = hoveredHub?.id === hub.id;
                const isSelected = selectedHub?.id === hub.id;

                // Dynamic radii scaled with node weight
                const actuatorRadius = Math.min(24, Math.max(6, 6 + hub.actuators * 2.5));
                const observerRadius = Math.min(22, Math.max(5, 5 + hub.observers * 2));

                return (
                  <g
                    key={`hub-${hub.id}`}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredHub(hub)}
                    onMouseLeave={() => setHoveredHub(null)}
                    onClick={() => setSelectedHub(hub === selectedHub ? null : hub)}
                  >
                    {/* Pulsing Radar Beacon Rings */}
                    {hasActuators && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={actuatorRadius * 1.8}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        opacity="0.5"
                        className="animate-ping"
                        style={{ transformOrigin: `${coords.x}px ${coords.y}px`, animationDuration: '3s' }}
                      />
                    )}

                    {hasObservers && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={observerRadius * 1.5}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.2"
                        opacity="0.4"
                        className="animate-ping"
                        style={{ transformOrigin: `${coords.x}px ${coords.y}px`, animationDuration: '4.5s' }}
                      />
                    )}

                    {/* Outer Red Observer Disc (if observers present) */}
                    {hasObservers && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={observerRadius}
                        fill="#ef4444"
                        fillOpacity="0.4"
                        stroke="#ef4444"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        filter="url(#glow-red)"
                      />
                    )}

                    {/* Inner Green Actuator Core (if actuators present) */}
                    {hasActuators && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={actuatorRadius * 0.75}
                        fill="#10b981"
                        fillOpacity="0.9"
                        stroke="#ffffff"
                        strokeWidth={isHovered || isSelected ? 2 : 1}
                        filter="url(#glow-green)"
                      />
                    )}

                    {/* In case no actuators, small observer core */}
                    {!hasActuators && hasObservers && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={observerRadius * 0.5}
                        fill="#ef4444"
                        fillOpacity="0.95"
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    )}

                    {/* Center Core Dot */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r="3"
                      fill="#ffffff"
                    />

                    {/* Local User Detected Node Special Badge Halo */}
                    {hub.isLocalUserHub && (
                      <g>
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={Math.max(actuatorRadius, observerRadius) + 8}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="animate-spin"
                          style={{ transformOrigin: `${coords.x}px ${coords.y}px`, animationDuration: '10s' }}
                        />
                        <text
                          x={coords.x}
                          y={coords.y - Math.max(actuatorRadius, observerRadius) - 10}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          YOU ARE HERE
                        </text>
                      </g>
                    )}

                    {/* Region Label Banner */}
                    <text
                      x={coords.x}
                      y={coords.y + Math.max(actuatorRadius, observerRadius) + 13}
                      textAnchor="middle"
                      fill={isHovered || isSelected ? '#ffffff' : '#94a3b8'}
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      className="transition-colors pointer-events-none"
                    >
                      {hub.flag} {hub.city}
                    </text>

                    {/* Node Counts Indicator Pills below label */}
                    <text
                      x={coords.x}
                      y={coords.y + Math.max(actuatorRadius, observerRadius) + 24}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {hasActuators && <tspan fill="#10b981">{hub.actuators} Act </tspan>}
                      {hasObservers && <tspan fill="#ef4444">{hub.observers} Obs</tspan>}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Hover / Selected Hub Tooltip Overlay Card */}
          {(hoveredHub || selectedHub) && (
            <div
              className="absolute top-4 right-4 z-20 w-72 p-4 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
            >
              {(() => {
                const target = hoveredHub || selectedHub!;
                const actuatorShare = activeVerifiedCount > 0 ? ((target.actuators / activeVerifiedCount) * 100).toFixed(1) : '0';
                const observerShare = freeOnlineCount > 0 ? ((target.observers / freeOnlineCount) * 100).toFixed(1) : '0';

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{target.flag}</span>
                        <div>
                          <div className="font-bold text-white text-sm">{target.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {target.city}, {target.country}
                          </div>
                        </div>
                      </div>
                      {target.isLocalUserHub && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[9px] font-bold border border-sky-500/40">
                          YOUR NODE
                        </span>
                      )}
                    </div>

                    {/* Stats Rows */}
                    <div className="grid grid-cols-2 gap-2 text-center font-mono">
                      <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                        <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Actuators
                        </div>
                        <div className="text-base font-black text-white mt-0.5">
                          {target.actuators}
                        </div>
                        <div className="text-[9px] text-emerald-300/70">
                          {actuatorShare}% of Global
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30">
                        <div className="text-[10px] text-rose-400 uppercase font-bold flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Observers
                        </div>
                        <div className="text-base font-black text-white mt-0.5">
                          {target.observers}
                        </div>
                        <div className="text-[9px] text-rose-300/70">
                          {observerShare}% of Global
                        </div>
                      </div>
                    </div>

                    {/* Latency & Pricing Impact */}
                    <div className="space-y-1.5 text-[11px] pt-1">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Latency to Engine:</span>
                        <span className="font-mono text-emerald-300 font-bold flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-emerald-400" />
                          ~{target.avgPingMs} ms
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Floor Price Weight:</span>
                        <span className="font-mono text-amber-300 font-bold">
                          +${(target.actuators * 0.0000001).toFixed(7)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Cluster Health:</span>
                        <span className="text-emerald-400 font-bold uppercase text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Active Synchronized
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Map Legend Overlay at Bottom-Left */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] backdrop-blur font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
              <span className="text-emerald-300 font-bold">Green = Actuators</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-md shadow-rose-500/50" />
              <span className="text-rose-300 font-bold">Red = Observers</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-sky-400" />
              <span className="text-sky-300">Cyan Ring = Your IP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. REGIONAL BREAKDOWN MATRIX & TELEMETRY TABLE                            */}
      {/* ========================================================================= */}
      <div
        className="rounded-3xl border overflow-hidden shadow-xl"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4" style={{ borderColor: 'var(--theme-border)' }}>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
              REGIONAL NODE DISTRIBUTION MATRIX
            </h3>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Live tally of green actuators, red observers, and latency metrics across all global operational zones
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: {lastRefreshedAt.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950/60 font-mono text-[11px] uppercase border-b" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
              <tr>
                <th className="py-3 px-4">Region / Hub</th>
                <th className="py-3 px-4">Country & Gateway</th>
                <th className="py-3 px-4 text-center">🟢 Green Actuators</th>
                <th className="py-3 px-4 text-center">🔴 Red Observers</th>
                <th className="py-3 px-4 text-center">Traffic Share</th>
                <th className="py-3 px-4 text-center">Engine Latency</th>
                <th className="py-3 px-4 text-right">Floor Price Contrib.</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono" style={{ borderColor: 'var(--theme-border)' }}>
              {regionalHubs.map((hub) => {
                const totalNodes = hub.actuators + hub.observers;
                const grandTotal = activeVerifiedCount + freeOnlineCount;
                const trafficShare = grandTotal > 0 ? ((totalNodes / grandTotal) * 100).toFixed(1) : '0';
                const isSelected = selectedHub?.id === hub.id;

                return (
                  <tr
                    key={hub.id}
                    onClick={() => setSelectedHub(hub === selectedHub ? null : hub)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-500/10'
                        : hub.isLocalUserHub
                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2.5">
                      <span className="text-lg">{hub.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{hub.name}</span>
                          {hub.isLocalUserHub && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                              YOUR NODE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">
                          Hub ID: {hub.id}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {hub.city}, {hub.country}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {hub.actuators} Actuators
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {hub.observers} Observers
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, Number(trafficShare)))}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-xs font-bold">{trafficShare}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-slate-300 flex items-center justify-center gap-1">
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        ~{hub.avgPingMs}ms
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      +${(hub.actuators * 0.0000001).toFixed(7)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950/80 font-mono text-xs border-t border-slate-800">
              <tr>
                <td className="py-3 px-4 font-bold text-white" colSpan={2}>
                  TOTAL GLOBAL ALLOCATION
                </td>
                <td className="py-3 px-4 text-center text-emerald-400 font-black">
                  {totalActuatorsAllocated} Actuators
                </td>
                <td className="py-3 px-4 text-center text-rose-400 font-black">
                  {totalObserversAllocated} Observers
                </td>
                <td className="py-3 px-4 text-center text-slate-300 font-bold">
                  100%
                </td>
                <td className="py-3 px-4 text-center text-slate-400">
                  Avg ~42ms
                </td>
                <td className="py-3 px-4 text-right text-emerald-300 font-black">
                  +${(totalActuatorsAllocated * 0.0000001).toFixed(7)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
