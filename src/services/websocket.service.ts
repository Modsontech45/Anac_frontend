type MessageHandler = (data: unknown) => void;

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

interface RfidScanResult {
  uid: string;
  success: boolean;
  message?: string;
}

interface WebSocketServiceConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalClose = false;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;

  constructor(config: WebSocketServiceConfig = {}) {
    // Derive WebSocket URL from API URL or use explicit WS URL
    if (import.meta.env.VITE_WS_URL) {
      this.url = config.url || `${import.meta.env.VITE_WS_URL}/ws`;
    } else if (import.meta.env.VITE_API_URL) {
      // Convert API URL to WebSocket URL
      // e.g., https://anac-backend.onrender.com/api -> wss://anac-backend.onrender.com/ws
      let apiUrl = (import.meta.env.VITE_API_URL as string).trim();
      const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      // Remove protocol, /api, and any trailing slashes
      let urlWithoutProtocol = apiUrl
        .replace(/^https?:\/\//, '')
        .replace(/\/api\/?$/, '')
        .replace(/\/$/, '');
      this.url = config.url || `${wsProtocol}//${urlWithoutProtocol}/ws`;
    } else {
      // Local development fallback
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = config.url || `${protocol}//${window.location.hostname}:3000/ws`;
    }

    this.reconnectInterval = config.reconnectInterval || 3000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;

    console.log('[WS] WebSocket URL configured:', this.url);
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.isIntentionalClose = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          this.emit('connected', {});
          if (this.connectionResolve) {
            this.connectionResolve();
            this.connectionResolve = null;
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WS] Disconnected', event.code, event.reason);
          this.emit('disconnected', { code: event.code, reason: event.reason });
          this.connectionPromise = null;

          if (!this.isIntentionalClose) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          this.emit('error', { error });
          if (this.connectionResolve) {
            reject(error);
            this.connectionResolve = null;
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(data);
          } catch (error) {
            console.error('[WS] Failed to parse message:', error);
          }
        };
      } catch (error) {
        reject(error);
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionPromise = null;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      this.emit('maxReconnectAttemptsReached', {});
      return;
    }

    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Error handled in connect()
      });
    }, delay);
  }

  private handleMessage(data: WebSocketMessage): void {
    const { type } = data;

    // Emit to specific type handlers
    this.emit(type, data);

    // Emit to wildcard handlers
    this.emit('*', data);
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send message: not connected');
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  off(type: string, handler: MessageHandler): void {
    this.messageHandlers.get(type)?.delete(handler);
  }

  private emit(type: string, data: unknown): void {
    this.messageHandlers.get(type)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WS] Error in handler for ${type}:`, error);
      }
    });
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // RFID-specific methods

  authenticate(clientId: string): void {
    this.send({
      type: 'client_auth',
      client_id: clientId,
      client_type: 'frontend',
    });
  }

  requestRfidScan(timeout = 30000, deviceUid?: string): Promise<RfidScanResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Scan timeout'));
      }, timeout);

      const unsubscribeScanned = this.on('rfid_scanned', (data) => {
        cleanup();
        const result = data as RfidScanResult;
        resolve(result);
      });

      const unsubscribeTimeout = this.on('scan_timeout', () => {
        cleanup();
        reject(new Error('Scan timeout from server'));
      });

      const unsubscribeError = this.on('scan_error', (data) => {
        cleanup();
        const error = data as { message?: string };
        reject(new Error(error.message || 'Scan error'));
      });

      const unsubscribeDuplicate = this.on('card_already_registered', (data) => {
        cleanup();
        const result = data as { uid: string; user?: string };
        reject(new Error(`Card ${result.uid} is already registered${result.user ? ` to ${result.user}` : ''}`));
      });

      const cleanup = () => {
        clearTimeout(timeoutId);
        unsubscribeScanned();
        unsubscribeTimeout();
        unsubscribeError();
        unsubscribeDuplicate();
      };

      this.send({
        type: 'request_rfid_scan',
        device_uid: deviceUid,
      });
    });
  }

  enterRegistrationMode(): void {
    this.send({
      type: 'enter_registration_mode',
    });
  }

  exitRegistrationMode(): void {
    this.send({
      type: 'exit_registration_mode',
    });
  }

  cancelRfidScan(): void {
    this.exitRegistrationMode();
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
export type { RfidScanResult, WebSocketMessage };
