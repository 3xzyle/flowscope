// FlowScope API Client
// Connects to the Rust backend for real Docker container data

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'healthy' | 'unhealthy' | 'exited' | 'created' | 'paused' | 'restarting' | 'dead';
  health: string | null;
  category: 'aiml' | 'application' | 'infrastructure' | 'frontend' | 'monitoring' | 'game' | 'val' | 'blockchain' | 'other';
  ports: PortMapping[];
  networks: string[];
  created: string;
  labels: Record<string, string>;
  rustEquivalent: string | null;
}

export interface PortMapping {
  hostPort: number | null;
  containerPort: number;
  protocol: string;
}

export interface SystemTopology {
  totalContainers: number;
  runningContainers: number;
  healthyContainers: number;
  unhealthyContainers: number;
  categories: Record<string, number>;
  flowcharts: FlowchartSummary[];
  generatedAt: string;
}

export interface FlowchartSummary {
  id: string;
  name: string;
  nodeCount: number;
  category: string;
}

export interface Flowchart {
  id: string;
  name: string;
  description: string;
  nodes: FlowchartNode[];
  connections: FlowchartConnection[];
  parentId: string | null;
}

export interface FlowchartNode {
  id: string;
  name: string;
  description: string;
  status: string;
  nodeType: 'service' | 'process' | 'decision' | 'group';
  category: string;
  port: number | null;
  childFlowchart: string | null;
  metrics: NodeMetrics | null;
}

export interface NodeMetrics {
  cpuPercent: number | null;
  memoryMb: number | null;
  uptimeHours: number | null;
}

export interface FlowchartConnection {
  id: string;
  source: string;
  target: string;
  label: string | null;
  connectionType: 'primary' | 'secondary' | 'data' | 'control' | 'network';
}

export interface NetworkInfo {
  id: string;
  name: string;
  driver: string;
  containers: string[];
}

class FlowScopeAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async getTopology(): Promise<SystemTopology> {
    return this.fetch<SystemTopology>('/topology');
  }

  async getContainers(): Promise<ContainerInfo[]> {
    return this.fetch<ContainerInfo[]>('/containers');
  }

  async getNetworks(): Promise<NetworkInfo[]> {
    return this.fetch<NetworkInfo[]>('/networks');
  }

  async getFlowchart(id: string): Promise<Flowchart> {
    return this.fetch<Flowchart>(`/flowchart/${encodeURIComponent(id)}`);
  }

  async getContainer(id: string): Promise<ContainerInfo> {
    return this.fetch<ContainerInfo>(`/container/${encodeURIComponent(id)}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const api = new FlowScopeAPI();
export default api;
