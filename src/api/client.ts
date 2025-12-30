// FlowScope API Client
// Connects to the Rust backend for real Docker container data

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface ContainerStats {
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
  networkRxMb: number;
  networkTxMb: number;
  blockReadMb: number;
  blockWriteMb: number;
  pids: number;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status:
    | "running"
    | "healthy"
    | "unhealthy"
    | "exited"
    | "created"
    | "paused"
    | "restarting"
    | "dead";
  health: string | null;
  category:
    | "aiml"
    | "application"
    | "infrastructure"
    | "frontend"
    | "monitoring"
    | "game"
    | "val"
    | "blockchain"
    | "other";
  ports: PortMapping[];
  networks: string[];
  created: string;
  labels: Record<string, string>;
  rustEquivalent: string | null;
  stats: ContainerStats | null;
  imageSizeMb: number | null;
}

export interface PortMapping {
  hostPort: number | null;
  containerPort: number;
  protocol: string;
}

export interface VolumeMount {
  source: string;
  destination: string;
  mode: string;
}

export interface HealthCheckConfig {
  test: string[];
  intervalSeconds: number;
  timeoutSeconds: number;
  retries: number;
  startPeriodSeconds: number;
}

export interface ContainerDetail extends ContainerInfo {
  environment: string[];
  command: string | null;
  entrypoint: string[] | null;
  workingDir: string | null;
  volumes: VolumeMount[];
  healthCheck: HealthCheckConfig | null;
}

export interface ContainerLogs {
  containerId: string;
  containerName: string;
  logs: string[];
  tail: number;
  since: string | null;
}

export interface ActionResult {
  success: boolean;
  containerId: string;
  containerName: string;
  action: string;
  message: string;
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
  nodeType: "service" | "process" | "decision" | "group";
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
  connectionType:
    | "primary"
    | "secondary"
    | "data"
    | "control"
    | "network"
    | "volume"
    | "depends";
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
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async getTopology(): Promise<SystemTopology> {
    return this.fetch<SystemTopology>("/topology");
  }

  async getContainers(): Promise<ContainerInfo[]> {
    return this.fetch<ContainerInfo[]>("/containers");
  }

  async getNetworks(): Promise<NetworkInfo[]> {
    return this.fetch<NetworkInfo[]>("/networks");
  }

  async getFlowchart(id: string): Promise<Flowchart> {
    return this.fetch<Flowchart>(`/flowchart/${encodeURIComponent(id)}`);
  }

  async getContainer(id: string): Promise<ContainerInfo> {
    return this.fetch<ContainerInfo>(`/container/${encodeURIComponent(id)}`);
  }

  async getContainerDetail(id: string): Promise<ContainerDetail> {
    return this.fetch<ContainerDetail>(
      `/container/${encodeURIComponent(id)}/detail`
    );
  }

  async getContainerLogs(
    id: string,
    tail: number = 100
  ): Promise<ContainerLogs> {
    return this.fetch<ContainerLogs>(
      `/container/${encodeURIComponent(id)}/logs?tail=${tail}`
    );
  }

  async restartContainer(id: string): Promise<ActionResult> {
    const response = await fetch(
      `${this.baseUrl}/container/${encodeURIComponent(id)}/restart`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async stopContainer(id: string): Promise<ActionResult> {
    const response = await fetch(
      `${this.baseUrl}/container/${encodeURIComponent(id)}/stop`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async startContainer(id: string): Promise<ActionResult> {
    const response = await fetch(
      `${this.baseUrl}/container/${encodeURIComponent(id)}/start`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl.replace("/api", "")}/health`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getContainerStats(id: string): Promise<ContainerStats> {
    return this.fetch<ContainerStats>(
      `/container/${encodeURIComponent(id)}/stats`
    );
  }

  async getContainersWithStats(): Promise<ContainerInfo[]> {
    return this.fetch<ContainerInfo[]>("/containers/stats");
  }

  async getImageSizes(): Promise<Record<string, number>> {
    return this.fetch<Record<string, number>>("/images/sizes");
  }
}

export const api = new FlowScopeAPI();
export default api;
