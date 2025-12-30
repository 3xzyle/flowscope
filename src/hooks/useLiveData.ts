// Live Data Provider for FlowScope
// Fetches from Rust backend API and converts to store format

import { useCallback, useEffect, useState } from "react";
import { api, SystemTopology, Flowchart as APIFlowchart } from "../api";
import { useFlowStore } from "../store/flowStore";
import type {
  ServiceFlowchart,
  ServiceNode,
  ServiceConnection,
  ServiceStatus,
  ServiceType,
} from "../data/mockData";

interface UseLiveDataResult {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  topology: SystemTopology | null;
  fetchFlowchart: (id: string) => Promise<ServiceFlowchart | null>;
  refetch: () => Promise<void>;
}

// Map API status to store status
function mapStatus(status: string): ServiceStatus {
  switch (status.toLowerCase()) {
    case "running":
    case "healthy":
      return "running";
    case "unhealthy":
    case "warning":
      return "warning";
    case "exited":
    case "dead":
    case "error":
      return "error";
    default:
      return "stopped";
  }
}

// Map API category to service type
function mapServiceType(category: string): ServiceType {
  switch (category.toLowerCase()) {
    case "aiml":
      return "ai";
    case "infrastructure":
    case "monitoring":
      return "database";
    case "frontend":
      return "gateway";
    case "blockchain":
      return "worker";
    default:
      return "api";
  }
}

// Convert API topology to overview flowchart
function topologyToFlowchart(topology: SystemTopology): ServiceFlowchart {
  const nodes: ServiceNode[] = [];
  const connections: ServiceConnection[] = [];

  // Create nodes for each category
  Object.entries(topology.categories).forEach(([category, count]) => {
    nodes.push({
      id: `${category}-overview`,
      label: `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } (${count})`,
      type: mapServiceType(category),
      status: "running",
      description: `${count} containers in ${category} category`,
      linkedFlowchart: `${category}-overview`,
      metrics: {
        requests: `${count} services`,
      },
    });
  });

  // Add hub connections from a central "VAL Core" node if multiple categories
  if (nodes.length > 1) {
    nodes.unshift({
      id: "val-core",
      label: "VAL Core",
      type: "gateway",
      status: "running",
      description: `${topology.totalContainers} containers, ${topology.runningContainers} running`,
      metrics: {
        requests: `${topology.healthyContainers} healthy`,
        errorRate: `${topology.unhealthyContainers} unhealthy`,
      },
    });

    // Connect core to each category
    nodes.slice(1).forEach((node, index) => {
      connections.push({
        id: `core-to-${node.id}`,
        source: "val-core",
        target: node.id,
        type: "internal",
        animated: index % 2 === 0,
      });
    });
  }

  return {
    id: "system-overview",
    name: "VAL System Overview",
    description: `Live topology: ${topology.totalContainers} containers discovered`,
    nodes,
    connections,
  };
}

// Convert API flowchart to store format
function apiFlowchartToStore(apiFlowchart: APIFlowchart): ServiceFlowchart {
  const nodes: ServiceNode[] = apiFlowchart.nodes.map((node) => ({
    id: node.id,
    label: node.name,
    type: mapServiceType(node.category),
    status: mapStatus(node.status),
    description: node.description,
    port: node.port || undefined,
    linkedFlowchart: node.childFlowchart || undefined,
    metrics: node.metrics
      ? {
          requests: node.metrics.cpuPercent
            ? `${node.metrics.cpuPercent.toFixed(1)}% CPU`
            : undefined,
          latency: node.metrics.memoryMb
            ? `${node.metrics.memoryMb.toFixed(0)}MB`
            : undefined,
          errorRate: node.metrics.uptimeHours
            ? `${node.metrics.uptimeHours.toFixed(1)}h uptime`
            : undefined,
        }
      : undefined,
  }));

  const connections: ServiceConnection[] = apiFlowchart.connections.map(
    (conn) => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      type: conn.connectionType === "data" ? "grpc" : "http",
      label: conn.label || undefined,
      animated: conn.connectionType === "data",
    })
  );

  return {
    id: apiFlowchart.id,
    name: apiFlowchart.name,
    description: apiFlowchart.description,
    nodes,
    connections,
  };
}

export function useLiveData(): UseLiveDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [topology, setTopology] = useState<SystemTopology | null>(null);

  const { setLiveFlowchart, setLiveMode, setFetchCallback } = useFlowStore();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const connected = await api.checkHealth();
      setIsConnected(connected);
      setLiveMode(connected);

      if (connected) {
        const data = await api.getTopology();
        setTopology(data);

        // Cache the live system overview
        const overviewFlowchart = topologyToFlowchart(data);
        setLiveFlowchart(overviewFlowchart);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      setIsConnected(false);
      setLiveMode(false);
    } finally {
      setIsLoading(false);
    }
  }, [setLiveFlowchart, setLiveMode]);

  const fetchFlowchart = useCallback(
    async (id: string): Promise<ServiceFlowchart | null> => {
      if (!isConnected) return null;

      try {
        // For system overview, use topology data
        if (id === "system-overview" && topology) {
          return topologyToFlowchart(topology);
        }

        // For other flowcharts, fetch from API
        const apiFlowchart = await api.getFlowchart(id);
        return apiFlowchartToStore(apiFlowchart);
      } catch (err) {
        console.error("Failed to fetch flowchart:", id, err);
        return null;
      }
    },
    [isConnected, topology]
  );

  // Register fetch callback with store
  useEffect(() => {
    setFetchCallback(fetchFlowchart);
    return () => {
      setFetchCallback(null);
    };
  }, [fetchFlowchart, setFetchCallback]);

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    isLoading,
    error,
    isConnected,
    topology,
    fetchFlowchart,
    refetch,
  };
}

export default useLiveData;
