import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '@/services/websocket.service';

interface UseRfidScannerOptions {
  onScanSuccess?: (uid: string) => void;
  onScanError?: (error: string) => void;
  timeout?: number;
}

interface UseRfidScannerReturn {
  startScan: (deviceUid?: string) => Promise<void>;
  cancelScan: () => void;
  isScanning: boolean;
  scannedUid: string | null;
  error: string | null;
  isDeviceConnected: boolean;
  connectedDevices: string[];
  clearResult: () => void;
}

export function useRfidScanner(options: UseRfidScannerOptions = {}): UseRfidScannerReturn {
  const { onScanSuccess, onScanError, timeout = 30000 } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

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
        setConnectedDevices([]);
        if (isScanning) {
          setIsScanning(false);
          setError('Connection lost');
        }
      }
    });

    // Subscribe to client auth response to get connected devices
    const unsubscribeAuthResponse = websocketService.on('client_auth_response', (data) => {
      if (isMounted.current) {
        const response = data as { connected_devices?: string[] };
        if (response.connected_devices) {
          setConnectedDevices(response.connected_devices);
          setIsDeviceConnected(response.connected_devices.length > 0);
        }
      }
    });

    // Subscribe to device status updates
    const unsubscribeDeviceConnected = websocketService.on('device_connected', (data) => {
      if (isMounted.current) {
        const { device_uid } = data as { device_uid: string };
        setConnectedDevices((prev) => {
          if (!prev.includes(device_uid)) {
            return [...prev, device_uid];
          }
          return prev;
        });
        setIsDeviceConnected(true);
      }
    });

    const unsubscribeDeviceDisconnected = websocketService.on('device_disconnected', (data) => {
      if (isMounted.current) {
        const { device_uid } = data as { device_uid: string };
        setConnectedDevices((prev) => {
          const updated = prev.filter((uid) => uid !== device_uid);
          setIsDeviceConnected(updated.length > 0);
          return updated;
        });
      }
    });

    // Set initial connection status
    setIsDeviceConnected(websocketService.isConnected);

    return () => {
      isMounted.current = false;
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeAuthResponse();
      unsubscribeDeviceConnected();
      unsubscribeDeviceDisconnected();

      // Cancel any ongoing scan when unmounting
      if (isScanning) {
        websocketService.cancelRfidScan();
      }
    };
  }, []);

  const startScan = useCallback(async (deviceUid?: string) => {
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

      // Request scan and wait for result (pass device UID if specified)
      const result = await websocketService.requestRfidScan(timeout, deviceUid);

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
    connectedDevices,
    clearResult,
  };
}
