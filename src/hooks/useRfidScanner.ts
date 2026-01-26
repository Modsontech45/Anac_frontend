import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '@/services/websocket.service';

interface UseRfidScannerOptions {
  onScanSuccess?: (uid: string) => void;
  onScanError?: (error: string) => void;
  timeout?: number;
}

interface UseRfidScannerReturn {
  startScan: () => Promise<void>;
  cancelScan: () => void;
  isScanning: boolean;
  scannedUid: string | null;
  error: string | null;
  isDeviceConnected: boolean;
  clearResult: () => void;
}

export function useRfidScanner(options: UseRfidScannerOptions = {}): UseRfidScannerReturn {
  const { onScanSuccess, onScanError, timeout = 30000 } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);

  const isMounted = useRef(true);
  const clientId = useRef(`frontend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    isMounted.current = true;

    // Connect to WebSocket
    websocketService.connect().then(() => {
      if (isMounted.current) {
        websocketService.authenticate(clientId.current);
      }
    }).catch((err) => {
      console.error('[useRfidScanner] Failed to connect:', err);
    });

    // Subscribe to connection status
    const unsubscribeConnected = websocketService.on('connected', () => {
      if (isMounted.current) {
        setIsDeviceConnected(true);
        websocketService.authenticate(clientId.current);
      }
    });

    const unsubscribeDisconnected = websocketService.on('disconnected', () => {
      if (isMounted.current) {
        setIsDeviceConnected(false);
        if (isScanning) {
          setIsScanning(false);
          setError('Connection lost');
        }
      }
    });

    // Subscribe to device status updates
    const unsubscribeDeviceOnline = websocketService.on('device_online', () => {
      if (isMounted.current) {
        setIsDeviceConnected(true);
      }
    });

    const unsubscribeDeviceOffline = websocketService.on('device_offline', () => {
      if (isMounted.current) {
        setIsDeviceConnected(false);
      }
    });

    // Set initial connection status
    setIsDeviceConnected(websocketService.isConnected);

    return () => {
      isMounted.current = false;
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeDeviceOnline();
      unsubscribeDeviceOffline();

      // Cancel any ongoing scan when unmounting
      if (isScanning) {
        websocketService.cancelRfidScan();
      }
    };
  }, []);

  const startScan = useCallback(async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScannedUid(null);
    setError(null);

    try {
      // Ensure connected
      if (!websocketService.isConnected) {
        await websocketService.connect();
        websocketService.authenticate(clientId.current);
      }

      // Enter registration mode
      websocketService.enterRegistrationMode();

      // Request scan and wait for result
      const result = await websocketService.requestRfidScan(timeout);

      if (isMounted.current) {
        setScannedUid(result.uid);
        setIsScanning(false);
        onScanSuccess?.(result.uid);
      }
    } catch (err) {
      if (isMounted.current) {
        const errorMessage = err instanceof Error ? err.message : 'Scan failed';
        setError(errorMessage);
        setIsScanning(false);
        onScanError?.(errorMessage);
      }
    } finally {
      // Always exit registration mode
      websocketService.exitRegistrationMode();
    }
  }, [isScanning, timeout, onScanSuccess, onScanError]);

  const cancelScan = useCallback(() => {
    if (isScanning) {
      websocketService.cancelRfidScan();
      setIsScanning(false);
      setError(null);
    }
  }, [isScanning]);

  const clearResult = useCallback(() => {
    setScannedUid(null);
    setError(null);
  }, []);

  return {
    startScan,
    cancelScan,
    isScanning,
    scannedUid,
    error,
    isDeviceConnected,
    clearResult,
  };
}
