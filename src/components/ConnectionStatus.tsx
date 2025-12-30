import { useEffect, useState } from "react";
import { api } from "../api";
import { useWebSocket } from "../hooks/useWebSocket";

interface ConnectionStatusProps {
  onStatusChange?: (connected: boolean) => void;
}

export default function ConnectionStatus({
  onStatusChange,
}: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // WebSocket for real-time updates
  const {
    connected: wsConnected,
    stats,
    lastUpdate,
  } = useWebSocket({ enabled: true });

  const checkConnection = async () => {
    const connected = await api.checkHealth();
    setIsConnected(connected);
    setLastCheck(new Date());
    onStatusChange?.(connected);
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80"
        onClick={checkConnection}
        title={`Last checked: ${lastCheck?.toLocaleTimeString() || "never"}`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        <span className={isConnected ? "text-green-400" : "text-yellow-400"}>
          {isConnected ? "Live" : "Demo Mode"}
        </span>
      </div>

      {/* WebSocket status */}
      {wsConnected && (
        <div
          className="flex items-center gap-1.5 text-xs text-blue-400"
          title={
            lastUpdate
              ? `Last update: ${new Date(lastUpdate).toLocaleTimeString()}`
              : undefined
          }
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>WS</span>
        </div>
      )}

      {/* Real-time stats from WebSocket */}
      {stats && (
        <div className="flex items-center gap-2 text-xs text-flow-muted">
          <span>
            {stats.runningContainers}/{stats.totalContainers}
          </span>
        </div>
      )}
    </div>
  );
}
