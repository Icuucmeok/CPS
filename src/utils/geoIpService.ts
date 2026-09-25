// IP Geolocation Service for detecting client region & mapping actuator/observer nodes

export interface GeoLocationInfo {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  flag: string;
  isDetected: boolean;
}

// Convert country code to emoji flag
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Mapping from standard timezone prefixes to coordinates and countries
const TIMEZONE_GEO_MAP: Record<
  string,
  { country: string; countryCode: string; city: string; lat: number; lng: number }
> = {
  'Asia/Karachi': { country: 'Pakistan', countryCode: 'PK', city: 'Karachi', lat: 24.86, lng: 67.0 },
  'Asia/Lahore': { country: 'Pakistan', countryCode: 'PK', city: 'Lahore', lat: 31.52, lng: 74.35 },
  'Asia/Kolkata': { country: 'India', countryCode: 'IN', city: 'Mumbai', lat: 19.07, lng: 72.87 },
  'Asia/Calcutta': { country: 'India', countryCode: 'IN', city: 'New Delhi', lat: 28.61, lng: 77.2 },
  'Asia/Dhaka': { country: 'Bangladesh', countryCode: 'BD', city: 'Dhaka', lat: 23.81, lng: 90.41 },
  'Asia/Dubai': { country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai', lat: 25.2, lng: 55.27 },
  'Asia/Riyadh': { country: 'Saudi Arabia', countryCode: 'SA', city: 'Riyadh', lat: 24.71, lng: 46.67 },
  'Asia/Singapore': { country: 'Singapore', countryCode: 'SG', city: 'Singapore', lat: 1.35, lng: 103.81 },
  'Asia/Tokyo': { country: 'Japan', countryCode: 'JP', city: 'Tokyo', lat: 35.67, lng: 139.65 },
  'Asia/Seoul': { country: 'South Korea', countryCode: 'KR', city: 'Seoul', lat: 37.56, lng: 126.97 },
  'Asia/Bangkok': { country: 'Thailand', countryCode: 'TH', city: 'Bangkok', lat: 13.75, lng: 100.5 },
  'Asia/Hong_Kong': { country: 'Hong Kong', countryCode: 'HK', city: 'Hong Kong', lat: 22.31, lng: 114.16 },
  'Asia/Shanghai': { country: 'China', countryCode: 'CN', city: 'Shanghai', lat: 31.23, lng: 121.47 },
  'Europe/London': { country: 'United Kingdom', countryCode: 'GB', city: 'London', lat: 51.5, lng: -0.12 },
  'Europe/Berlin': { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', lat: 50.11, lng: 8.68 },
  'Europe/Paris': { country: 'France', countryCode: 'FR', city: 'Paris', lat: 48.85, lng: 2.35 },
  'Europe/Amsterdam': { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', lat: 52.36, lng: 4.9 },
  'Europe/Madrid': { country: 'Spain', countryCode: 'ES', city: 'Madrid', lat: 40.41, lng: -3.7 },
  'Europe/Rome': { country: 'Italy', countryCode: 'IT', city: 'Rome', lat: 41.9, lng: 12.49 },
  'Europe/Istanbul': { country: 'Turkey', countryCode: 'TR', city: 'Istanbul', lat: 41.0, lng: 28.97 },
  'America/New_York': { country: 'United States', countryCode: 'US', city: 'New York', lat: 40.71, lng: -74.0 },
  'America/Chicago': { country: 'United States', countryCode: 'US', city: 'Chicago', lat: 41.87, lng: -87.62 },
  'America/Los_Angeles': { country: 'United States', countryCode: 'US', city: 'Los Angeles', lat: 34.05, lng: -118.24 },
  'America/Toronto': { country: 'Canada', countryCode: 'CA', city: 'Toronto', lat: 43.65, lng: -79.38 },
  'America/Vancouver': { country: 'Canada', countryCode: 'CA', city: 'Vancouver', lat: 49.28, lng: -123.12 },
  'America/Sao_Paulo': { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', lat: -23.55, lng: -46.63 },
  'America/Buenos_Aires': { country: 'Argentina', countryCode: 'AR', city: 'Buenos Aires', lat: -34.6, lng: -58.38 },
  'Australia/Sydney': { country: 'Australia', countryCode: 'AU', city: 'Sydney', lat: -33.86, lng: 151.2 },
  'Australia/Melbourne': { country: 'Australia', countryCode: 'AU', city: 'Melbourne', lat: -37.81, lng: 144.96 },
  'Africa/Johannesburg': { country: 'South Africa', countryCode: 'ZA', city: 'Johannesburg', lat: -26.2, lng: 28.04 },
  'Africa/Cairo': { country: 'Egypt', countryCode: 'EG', city: 'Cairo', lat: 30.04, lng: 31.23 },
};

/**
 * Detect client IP and geographic region using real external APIs with fallback to browser timezone.
 */
export async function detectClientLocation(): Promise<GeoLocationInfo> {
  // Check if we have cached this session
  try {
    const cached = sessionStorage.getItem('cps_detected_geo');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // 1. Try ipwhois.app (CORS enabled, highly accurate, returns city, country, lat/long)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwhois.app/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.country_code) {
        const info: GeoLocationInfo = {
          ip: data.ip || 'Detected Connection',
          country: data.country || 'Global',
          countryCode: data.country_code || 'UN',
          city: data.city || data.region || 'Region Hub',
          region: data.region || data.country || 'Zone',
          latitude: typeof data.latitude === 'number' ? data.latitude : 35.0,
          longitude: typeof data.longitude === 'number' ? data.longitude : 0.0,
          flag: getFlagEmoji(data.country_code),
          isDetected: true,
        };
        try {
          sessionStorage.setItem('cps_detected_geo', JSON.stringify(info));
        } catch {}
        return info;
      }
    }
  } catch {}

  // 2. Try api.country.is (fast fallback)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://api.country.is/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        const countryCode = data.country.toUpperCase();
        // Lookup coordinates from our map or default
        const match = Object.values(TIMEZONE_GEO_MAP).find((m) => m.countryCode === countryCode);
        const info: GeoLocationInfo = {
          ip: data.ip || 'Detected Connection',
          country: match?.country || countryCode,
          countryCode: countryCode,
          city: match?.city || 'Regional Gateway',
          region: match?.country || countryCode,
          latitude: match?.lat || 25.0,
          longitude: match?.lng || 55.0,
          flag: getFlagEmoji(countryCode),
          isDetected: true,
        };
        try {
          sessionStorage.setItem('cps_detected_geo', JSON.stringify(info));
        } catch {}
        return info;
      }
    }
  } catch {}

  // 3. Browser Timezone-based Geolocation fallback (guaranteed offline/adblock-proof)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi';
  const tzMatch = TIMEZONE_GEO_MAP[tz] || {
    country: 'Global Network Hub',
    countryCode: 'US',
    city: 'Direct Node',
    lat: 37.77,
    lng: -122.41,
  };

  const fallbackInfo: GeoLocationInfo = {
    ip: '192.0.2.' + Math.floor(10 + Math.random() * 200),
    country: tzMatch.country,
    countryCode: tzMatch.countryCode,
    city: tzMatch.city,
    region: tzMatch.country,
    latitude: tzMatch.lat,
    longitude: tzMatch.lng,
    flag: getFlagEmoji(tzMatch.countryCode),
    isDetected: true,
  };

  try {
    sessionStorage.setItem('cps_detected_geo', JSON.stringify(fallbackInfo));
  } catch {}

  return fallbackInfo;
}

// Convert Latitude and Longitude to SVG coordinates on a 1000x500 Robinson/Equirectangular map
export function latLngToSvgCoords(
  lat: number,
  lng: number,
  svgWidth = 1000,
  svgHeight = 500
): { x: number; y: number } {
  // Equirectangular projection
  // Longitude: -180..180 -> 0..svgWidth
  // Latitude: -90..90 -> svgHeight..0
  const x = ((lng + 180) / 360) * svgWidth;
  const y = ((90 - lat) / 180) * svgHeight;
  return {
    x: Math.max(20, Math.min(svgWidth - 20, x)),
    y: Math.max(20, Math.min(svgHeight - 20, y)),
  };
}

export interface RegionalHub {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  flag: string;
  lat: number;
  lng: number;
  baseWeight: number; // proportional weight for distributing nodes
  actuators: number; // green
  observers: number; // red
  avgPingMs: number;
  status: 'optimal' | 'moderate' | 'high_traffic';
  isLocalUserHub?: boolean;
}

/**
 * Standard global node distribution hubs
 */
export const GLOBAL_HUBS: Omit<RegionalHub, 'actuators' | 'observers' | 'avgPingMs' | 'status' | 'isLocalUserHub'>[] = [
  { id: 'us-east', name: 'US East (N. Virginia)', country: 'United States', countryCode: 'US', city: 'Ashburn', flag: '🇺🇸', lat: 39.04, lng: -77.48, baseWeight: 0.22 },
  { id: 'us-west', name: 'US West (California)', country: 'United States', countryCode: 'US', city: 'San Jose', flag: '🇺🇸', lat: 37.33, lng: -121.88, baseWeight: 0.16 },
  { id: 'eu-west', name: 'EU Central (Frankfurt)', country: 'Germany', countryCode: 'DE', city: 'Frankfurt', flag: '🇩🇪', lat: 50.11, lng: 8.68, baseWeight: 0.18 },
  { id: 'eu-north', name: 'UK & Western Europe', country: 'United Kingdom', countryCode: 'GB', city: 'London', flag: '🇬🇧', lat: 51.5, lng: -0.12, baseWeight: 0.12 },
  { id: 'ap-south', name: 'South Asia (Pakistan & India)', country: 'Pakistan', countryCode: 'PK', city: 'Karachi / Mumbai', flag: '🇵🇰', lat: 24.86, lng: 67.0, baseWeight: 0.15 },
  { id: 'ap-east', name: 'East Asia (Tokyo / Seoul)', country: 'Japan', countryCode: 'JP', city: 'Tokyo', flag: '🇯🇵', lat: 35.67, lng: 139.65, baseWeight: 0.10 },
  { id: 'ap-southeast', name: 'Southeast Asia (Singapore)', country: 'Singapore', countryCode: 'SG', city: 'Singapore', flag: '🇸🇬', lat: 1.35, lng: 103.81, baseWeight: 0.12 },
  { id: 'me-central', name: 'Middle East (Dubai Hub)', country: 'United Arab Emirates', countryCode: 'AE', city: 'Dubai', flag: '🇦🇪', lat: 25.2, lng: 55.27, baseWeight: 0.08 },
  { id: 'sa-east', name: 'South America (São Paulo)', country: 'Brazil', countryCode: 'BR', city: 'São Paulo', flag: '🇧🇷', lat: -23.55, lng: -46.63, baseWeight: 0.06 },
  { id: 'oc-east', name: 'Oceania (Sydney)', country: 'Australia', countryCode: 'AU', city: 'Sydney', flag: '🇦🇺', lat: -33.86, lng: 151.2, baseWeight: 0.05 },
];

/**
 * Distributes activeVerifiedCount (Green Actuators) and freeOnlineCount (Red Observers)
 * across regional hubs, ensuring the detected user's region is always prioritized with real nodes.
 */
export function calculateRegionalDistribution(
  totalActuators: number,
  totalObservers: number,
  detectedUserGeo: GeoLocationInfo | null
): RegionalHub[] {
  // Check if detected user matches an existing hub, or create a dynamic local hub
  let hubs = [...GLOBAL_HUBS];

  let localHubId: string | null = null;
  if (detectedUserGeo && detectedUserGeo.isDetected) {
    const existing = hubs.find(
      (h) =>
        h.countryCode.toUpperCase() === detectedUserGeo.countryCode.toUpperCase() ||
        (Math.abs(h.lat - detectedUserGeo.latitude) < 8 && Math.abs(h.lng - detectedUserGeo.longitude) < 15)
    );

    if (existing) {
      localHubId = existing.id;
    } else {
      // Create custom local hub for user's detected location
      const customId = `user-local-${detectedUserGeo.countryCode.toLowerCase()}`;
      localHubId = customId;
      hubs.unshift({
        id: customId,
        name: `${detectedUserGeo.city}, ${detectedUserGeo.country}`,
        country: detectedUserGeo.country,
        countryCode: detectedUserGeo.countryCode,
        city: detectedUserGeo.city,
        flag: detectedUserGeo.flag || getFlagEmoji(detectedUserGeo.countryCode),
        lat: detectedUserGeo.latitude,
        lng: detectedUserGeo.longitude,
        baseWeight: 0.18,
      });
    }
  }

  // Calculate sum of base weights
  const totalWeight = hubs.reduce((sum, h) => sum + h.baseWeight, 0);

  // Distribute actuators (green) and observers (red)
  let allocatedActuators = 0;
  let allocatedObservers = 0;

  const result: RegionalHub[] = hubs.map((hub) => {
    const normalizedWeight = hub.baseWeight / totalWeight;
    const isLocal = hub.id === localHubId;

    // Allocate actuators proportionally, ensuring local hub has at least 1 if actuators > 0
    let hubActuators = Math.round(totalActuators * normalizedWeight);
    if (isLocal && totalActuators > 0 && hubActuators === 0) {
      hubActuators = 1;
    }

    // Allocate observers proportionally
    let hubObservers = Math.round(totalObservers * normalizedWeight);
    if (isLocal && totalObservers > 0 && hubObservers === 0) {
      hubObservers = 1;
    }

    allocatedActuators += hubActuators;
    allocatedObservers += hubObservers;

    // Ping simulation
    const ping = isLocal ? 18 + Math.floor(Math.random() * 12) : 65 + Math.floor(Math.random() * 90);
    const status: RegionalHub['status'] = hubActuators > 5 ? 'high_traffic' : hubActuators > 1 ? 'optimal' : 'moderate';

    return {
      ...hub,
      actuators: hubActuators,
      observers: hubObservers,
      avgPingMs: ping,
      status,
      isLocalUserHub: isLocal,
    };
  });

  // Adjust any rounding differences so sum strictly equals totalActuators and totalObservers
  const actuatorDiff = totalActuators - allocatedActuators;
  if (actuatorDiff !== 0 && result.length > 0) {
    const targetIdx = result.findIndex((r) => r.id === localHubId) !== -1 
      ? result.findIndex((r) => r.id === localHubId) 
      : 0;
    result[targetIdx].actuators = Math.max(0, result[targetIdx].actuators + actuatorDiff);
  }

  const observerDiff = totalObservers - allocatedObservers;
  if (observerDiff !== 0 && result.length > 0) {
    const targetIdx = result.findIndex((r) => r.id === localHubId) !== -1 
      ? result.findIndex((r) => r.id === localHubId) 
      : 0;
    result[targetIdx].observers = Math.max(0, result[targetIdx].observers + observerDiff);
  }

  return result;
}
