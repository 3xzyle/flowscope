// React hook for FlowScope API connection status
// Handles health checks and provides connection state

import { useCallback, useEffect, useState } from 'react';
import { api, SystemTopology } from './client';

interface UseFlowDataResult {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  topology: SystemTopology | null;
  refetch: () => Promise<void>;
}

// Mock data for offline/demo mode
const mockTopology: SystemTopology = {
  totalContainers: 221,
  runningContainers: 205,
  healthyContainers: 189,
  unhealthyContainers: 16,
  categories: {
    valina: 82,
    aiml: 48,
    application: 39,
    val: 14,
    infrastructure: 10,
    monitoring: 8,
    frontend: 7,
    game: 4,
    other: 9,
  },
  flowcharts: [
    { id: 'val-ecosystem', name: 'VAL Ecosystem', nodeCount: 12, category: 'val' },
    { id: 'valina-backend', name: 'Valina Backend Services', nodeCount: 82, category: 'valina' },
    { id: 'aiml-services', name: 'AI/ML Services', nodeCount: 48, category: 'aiml' },
    { id: 'monitoring', name: 'Monitoring & Observability', nodeCount: 8, category: 'monitoring' },
    { id: 'infrastructure', name: 'Infrastructure', nodeCount: 10, category: 'infrastructure' },
  ],
  generatedAt: new Date().toISOString(),
};

export function useFlowData(): UseFlowDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [topology, setTopology] = useState<SystemTopology | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if backend is available
      const connected = await api.checkHealth();
      setIsConnected(connected);
      
      if (connected) {
        // Load real topology from API
        const data = await api.getTopology();
        setTopology(data);
      } else {
        // Use mock data for demo mode
        setTopology(mockTopology);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      setTopology(mockTopology);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    isLoading,
    error,
    isConnected,
    topology,
    refetch,
  };
}

export default useFlowData;
