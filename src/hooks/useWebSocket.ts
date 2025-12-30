/**
 * FlowScope WebSocket Hook
 *
 * Real-time container status updates via WebSocket connection
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useFlowStore } from "../store/flowStore";

interface WsTopologyUpdate {
  type: "topologyUpdate";
  totalContainers: number;
  runningContainers: number;
  healthyContainers: number;
  unhealthyContainers: number;
  timestamp: string;
}

interface WsContainerUpdate {
  type: "containerUpdate";
  containers: Array<{
    id: string;
    name: string;
    status: string;
    health: string;
  }>;
  timestamp: string;
}

interface WsHeartbeat {
  type: "heartbeat";
  timestamp: string;
}

type WsMessage = WsTopologyUpdate | WsContainerUpdate | WsHeartbeat;

interface UseWebSocketOptions {
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface WebSocketState {
  connected: boolean;
  lastUpdate: string | null;
  stats: {
    totalContainers: number;
    runningContainers: number;
    healthyContainers: number;
    unhealthyContainers: number;
  } | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    lastUpdate: null,
    stats: null,
  });

  const { isLiveMode } = useFlowStore();

  const connect = useCallback(() => {
    if (!enabled || !isLiveMode) return;

    // Determine WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log("[WS] Connecting to", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
        reconnectAttemptsRef.current = 0;
        setState((prev) => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);

          switch (message.type) {
            case "topologyUpdate":
              setState((prev) => ({
                ...prev,
                lastUpdate: message.timestamp,
                stats: {
                  totalContainers: message.totalContainers,
                  runningContainers: message.runningContainers,
                  healthyContainers: message.healthyContainers,
                  unhealthyContainers: message.unhealthyContainers,
                },
              }));
              break;

            case "containerUpdate":
              // Could update individual container nodes here
              console.log(
                "[WS] Container update:",
                message.containers.length,
                "containers"
              );
              break;

            case "heartbeat":
              console.log("[WS] Heartbeat:", message.timestamp);
              break;
          }
        } catch (e) {
          console.error("[WS] Failed to parse message:", e);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected");
        setState((prev) => ({ ...prev, connected: false }));
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[WS] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error("[WS] Error:", error);
      };
    } catch (e) {
      console.error("[WS] Failed to connect:", e);
    }
  }, [enabled, isLiveMode, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState((prev) => ({ ...prev, connected: false }));
  }, []);

  // Connect when enabled and in live mode
  useEffect(() => {
    if (enabled && isLiveMode) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, isLiveMode, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
  };
}
