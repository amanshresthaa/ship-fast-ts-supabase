'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export interface UseNetworkResult {
  online: boolean;
  effectiveConnectionType: NetworkStatus;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean | null;
  unsupported: boolean;
  isMetered: boolean | null;
  isSlow: boolean;
}

/**
 * React hook that provides real-time network connectivity and connection quality information.
 *
 * Uses the Network Information API when available to report connection type, estimated speed, round-trip time, data saver status, and metered connection status. Falls back to basic online/offline detection if the API is unsupported.
 *
 * @returns An object containing network status properties, including online state, effective connection type, downlink speed, round-trip time, data saver mode, metered connection status, a flag for unsupported environments, and a derived flag indicating if the connection is slow.
 *
 * @remark The `unsupported` property is `true` if the Network Information API is not available in the current browser.
 */
export default function useNetwork(): UseNetworkResult {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Check if Network Information API is supported
  // @ts-ignore - Connection property not in all browsers
  const connection = isBrowser ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection) : null;
  const unsupported = !connection;

  // State for network status
  const [online, setOnline] = useState<boolean>(isBrowser ? navigator.onLine : true);
  const [effectiveConnectionType, setEffectiveConnectionType] = useState<NetworkStatus>(
    // @ts-ignore - effectiveType not in all browsers
    connection?.effectiveType || 'unknown'
  );
  const [downlink, setDownlink] = useState<number | null>(connection?.downlink || null);
  const [rtt, setRtt] = useState<number | null>(connection?.rtt || null);
  const [saveData, setSaveData] = useState<boolean | null>(connection?.saveData || null);
  const [isMetered, setIsMetered] = useState<boolean | null>(connection?.metered || null);

  // Calculate if the connection is slow
  const isSlow = useMemo(() => {
    // Consider slow connection if:
    // - Offline
    // - Explicitly using slow connection (slow-2g, 2g)
    // - High RTT (>500ms)
    // - Low downlink (<1Mbps)
    // - Data saver mode is on
    return !online || 
           effectiveConnectionType === 'slow-2g' || 
           effectiveConnectionType === '2g' ||
           (rtt !== null && rtt > 500) ||
           (downlink !== null && downlink < 1) ||
           !!saveData;
  }, [online, effectiveConnectionType, rtt, downlink, saveData]);

  // Update network state
  const updateNetworkStatus = useCallback(() => {
    if (!isBrowser) return;

    setOnline(navigator.onLine);

    if (connection) {
      // @ts-ignore - effectiveType not in all browsers
      setEffectiveConnectionType(connection.effectiveType || 'unknown');
      setDownlink(connection.downlink || null);
      setRtt(connection.rtt || null);
      setSaveData(connection.saveData || false);
      setIsMetered(connection.metered || false);
    }
  }, [connection, isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;

    // Initialize with current status
    updateNetworkStatus();

    // Set up event listeners for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Set up event listener for connection changes if supported
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      // Clean up event listeners
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);

      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus, isBrowser, connection]);

  return {
    online,
    effectiveConnectionType,
    downlink,
    rtt,
    saveData,
    unsupported,
    isMetered,
    isSlow
  };
}
