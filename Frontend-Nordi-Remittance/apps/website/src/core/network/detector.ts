// ============================================================================
// NETWORK DETECTOR — Real-time network quality monitoring
//
// Detects: offline, poor, slow, good, excellent
// Sources: navigator.onLine, navigator.connection, request latency tracking
// Pattern: Singleton + useSyncExternalStore-compatible (getSnapshot/subscribe)
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ───────────────────────────────────────────────────────────────────

export type NetworkQuality = 'excellent' | 'good' | 'slow' | 'poor' | 'offline';

export interface NetworkState {
  /** Current network quality tier */
  quality: NetworkQuality;
  /** Whether the browser reports navigator.onLine */
  isOnline: boolean;
  /** True when quality is 'slow' or 'poor' */
  isSlowNetwork: boolean;
  /** The effective connection type from Network Information API (or null) */
  effectiveType: string | null;
  /** Estimated round-trip time in ms (from API or navigator.connection) */
  rtt: number;
  /** Estimated downlink Mbps (from navigator.connection, or -1) */
  downlink: number;
  /** Timestamp of the last quality change */
  lastChanged: number;
  /** Whether we've ever confirmed connectivity with a real request */
  hasConfirmedConnection: boolean;
}

type Listener = () => void;

// ─── Connection API type (not all browsers expose this) ──────────────────────

interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?(type: string, listener: () => void): void;
  removeEventListener?(type: string, listener: () => void): void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LATENCY_SAMPLE_SIZE = 10;
// Note: reportLatency() measures full HTTP API round-trip + backend DB processing time,
// not raw ICMP ping. Thresholds must account for normal server/database execution time
// so strong Wi-Fi is never misclassified as "slow" due to a 500ms-2000ms backend query.
const EXCELLENT_RTT = 800;   // ms
const GOOD_RTT = 4000;       // ms
const SLOW_RTT = 8000;       // ms
// Above SLOW_RTT → "poor"

// ─── Singleton Class ─────────────────────────────────────────────────────────

class NetworkDetector {
  private state: NetworkState;
  private listeners = new Set<Listener>();
  private latencySamples: number[] = [];
  private consecutiveFailures = 0;
  private connectionApi: NetworkInformationLike | null = null;

  constructor() {
    this.state = {
      quality: navigator.onLine ? 'good' : 'offline',
      isOnline: navigator.onLine,
      isSlowNetwork: false,
      effectiveType: null,
      rtt: 0,
      downlink: -1,
      lastChanged: Date.now(),
      hasConfirmedConnection: false,
    };

    this.init();
  }

  // ─── Initialization ────────────────────────────────────────────────────

  private init(): void {
    // 1. Browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // 2. Network Information API (Chrome/Edge/Android)
    const nav = navigator as any;
    const conn: NetworkInformationLike | undefined =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    if (conn) {
      this.connectionApi = conn;
      this.syncFromConnectionApi();
      conn.addEventListener?.('change', this.handleConnectionChange);
    }
  }

  // ─── Event handlers ────────────────────────────────────────────────────

  private handleOnline = (): void => {
    this.updateState({ isOnline: true });
    this.recomputeQuality();
  };

  private handleOffline = (): void => {
    this.updateState({
      isOnline: false,
      quality: 'offline',
      isSlowNetwork: false,
      hasConfirmedConnection: false,
    });
  };

  private handleConnectionChange = (): void => {
    this.syncFromConnectionApi();
    this.recomputeQuality();
  };

  // ─── Connection API sync ───────────────────────────────────────────────

  private syncFromConnectionApi(): void {
    if (!this.connectionApi) return;

    const updates: Partial<NetworkState> = {};

    if (this.connectionApi.effectiveType) {
      updates.effectiveType = this.connectionApi.effectiveType;
    }
    if (typeof this.connectionApi.rtt === 'number') {
      updates.rtt = this.connectionApi.rtt;
    }
    if (typeof this.connectionApi.downlink === 'number') {
      updates.downlink = this.connectionApi.downlink;
    }

    this.updateState(updates);
  }

  // ─── Quality computation ──────────────────────────────────────────────

  private recomputeQuality(): void {
    if (!this.state.isOnline) {
      this.updateState({ quality: 'offline', isSlowNetwork: false });
      return;
    }

    let quality: NetworkQuality = 'good';

    // Check browser hardware link metrics first (Chrome/Edge Network Information API)
    const etype = this.state.effectiveType;
    const browserRtt = typeof this.connectionApi?.rtt === 'number' ? this.connectionApi.rtt : 0;
    const downlink = typeof this.connectionApi?.downlink === 'number' ? this.connectionApi.downlink : -1;

    // If browser explicitly knows we are on a high-speed link (4g / Wi-Fi with good downlink/rtt)
    // and we don't have repeated network-level drops, do not penalize for backend query time.
    const hasStrongBrowserSignal =
      etype === '4g' && (downlink < 0 || downlink >= 1.5) && (browserRtt === 0 || browserRtt <= 350);

    if (etype === 'slow-2g' || etype === '2g') {
      quality = 'poor';
    } else if (etype === '3g' && downlink > 0 && downlink < 1.0) {
      quality = 'slow';
    } else if (hasStrongBrowserSignal && this.consecutiveFailures < 3) {
      quality = browserRtt > 0 && browserRtt <= 100 ? 'excellent' : 'good';
    } else {
      quality = this.qualityFromRtt(this.getEffectiveRtt());
    }

    this.updateState({
      quality,
      isSlowNetwork: quality === 'slow' || quality === 'poor',
    });
  }

  private qualityFromRtt(rtt: number): NetworkQuality {
    if (rtt <= 0) return 'good'; // No data yet, assume good
    if (rtt <= EXCELLENT_RTT) return 'excellent';
    if (rtt <= GOOD_RTT) return 'good';
    if (rtt <= SLOW_RTT) return 'slow';
    return 'poor';
  }

  private getEffectiveRtt(): number {
    // Prefer browser-reported link RTT if available and healthy
    const browserRtt = typeof this.connectionApi?.rtt === 'number' ? this.connectionApi.rtt : 0;
    if (browserRtt > 0 && browserRtt <= 300 && this.consecutiveFailures === 0) {
      return browserRtt;
    }

    // Otherwise use median of recent API durations
    if (this.latencySamples.length >= 3) {
      const sorted = [...this.latencySamples].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    }
    return this.state.rtt;
  }

  // ─── Public API: Report request latency (called from axios interceptor) ─

  reportLatency(ms: number): void {
    this.consecutiveFailures = 0;
    // Cap individual backend query time so a single heavy endpoint doesn't skew link quality
    const cappedMs = Math.min(ms, GOOD_RTT);
    this.latencySamples.push(cappedMs);
    if (this.latencySamples.length > LATENCY_SAMPLE_SIZE) {
      this.latencySamples.shift();
    }

    this.updateState({ rtt: this.getEffectiveRtt(), hasConfirmedConnection: true });
    this.recomputeQuality();
  }

  /** Call when a network request fails with a network error (not HTTP error) */
  reportNetworkError(): void {
    this.consecutiveFailures += 1;
    // Only degrade link quality if multiple consecutive network-level failures occur
    if (this.consecutiveFailures >= 3) {
      this.latencySamples.push(SLOW_RTT + 1000);
      if (this.latencySamples.length > LATENCY_SAMPLE_SIZE) {
        this.latencySamples.shift();
      }
      this.recomputeQuality();
    }
  }

  /** Call when a request succeeds to confirm we're online */
  reportRequestSuccess(): void {
    this.consecutiveFailures = 0;
    if (!this.state.hasConfirmedConnection) {
      this.updateState({ hasConfirmedConnection: true });
    }
    if (!this.state.isOnline || this.state.quality === 'slow' || this.state.quality === 'poor') {
      this.updateState({ isOnline: true });
      this.recomputeQuality();
    }
  }

  // ─── State management ─────────────────────────────────────────────────

  private updateState(partial: Partial<NetworkState>): void {
    const prev = this.state;
    const next = { ...prev, ...partial };

    // Only notify if something actually changed
    if (
      prev.quality !== next.quality ||
      prev.isOnline !== next.isOnline ||
      prev.isSlowNetwork !== next.isSlowNetwork ||
      prev.effectiveType !== next.effectiveType
    ) {
      next.lastChanged = Date.now();
    }

    this.state = next;
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  // ─── useSyncExternalStore interface ────────────────────────────────────

  /** For useSyncExternalStore — returns immutable snapshot */
  getSnapshot = (): NetworkState => {
    return this.state;
  };

  /** For useSyncExternalStore — subscribe to changes */
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  // ─── Convenience getters ──────────────────────────────────────────────

  get isOnline(): boolean {
    return this.state.isOnline;
  }

  get quality(): NetworkQuality {
    return this.state.quality;
  }

  get isSlowNetwork(): boolean {
    return this.state.isSlowNetwork;
  }

  // ─── Cleanup (for tests) ──────────────────────────────────────────────

  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.connectionApi) {
      this.connectionApi.removeEventListener?.('change', this.handleConnectionChange);
    }
    this.listeners.clear();
    this.latencySamples = [];
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

export const networkDetector = new NetworkDetector();
export default networkDetector;
