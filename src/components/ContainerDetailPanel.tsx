import { useState, useEffect, useCallback } from "react";
import {
  X,
  ExternalLink,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  ChevronRight,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Key,
  Folder,
  Heart,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useFlowStore } from "../store/flowStore";
import { getServiceTypeIcon, getStatusColor } from "./ServiceNode";
import { api, ContainerDetail, ContainerLogs, ActionResult } from "../api";

type TabType = "overview" | "logs" | "environment" | "volumes" | "health";

// Check if a node is an actual container vs a category group
function isActualContainer(
  node: { id: string; nodeType?: string } | null
): boolean {
  if (!node) return false;
  // Group nodes are category overviews, not real containers
  if (node.nodeType === "group") return false;
  // Category overview IDs end with "-overview" or are just category names
  if (node.id.endsWith("-overview")) return false;
  // Category IDs without hyphens followed by numbers are likely not containers
  const categoryNames = [
    "aiml",
    "application",
    "infrastructure",
    "frontend",
    "monitoring",
    "game",
    "val",
    "blockchain",
    "other",
  ];
  if (categoryNames.includes(node.id.toLowerCase())) return false;
  return true;
}

export default function ContainerDetailPanel() {
  const { selectedNode, selectNode, navigateToFlowchartAsync, isLiveMode } =
    useFlowStore();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [containerDetail, setContainerDetail] =
    useState<ContainerDetail | null>(null);
  const [logs, setLogs] = useState<ContainerLogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  // Check if this is an actual container (not a category group)
  const isContainer = isActualContainer(selectedNode);

  // Fetch container details when node selected (live mode only, actual containers only)
  useEffect(() => {
    if (selectedNode && isLiveMode && isContainer) {
      fetchContainerDetail();
    } else {
      setContainerDetail(null);
      setLogs(null);
      setError(null);
    }
  }, [selectedNode?.id, isLiveMode, isContainer]);

  const fetchContainerDetail = async () => {
    if (!selectedNode || !isContainer) return;

    setLoading(true);
    setError(null);
    try {
      const detail = await api.getContainerDetail(selectedNode.id);
      setContainerDetail(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!selectedNode || !isContainer) return;

    setLogsLoading(true);
    try {
      const containerLogs = await api.getContainerLogs(selectedNode.id, 100);
      setLogs(containerLogs);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [selectedNode, isContainer]);

  // Fetch logs when switching to logs tab
  useEffect(() => {
    if (
      activeTab === "logs" &&
      isLiveMode &&
      selectedNode &&
      isContainer &&
      !logs
    ) {
      fetchLogs();
    }
  }, [activeTab, isLiveMode, selectedNode, isContainer, logs, fetchLogs]);

  const handleAction = async (action: "restart" | "stop" | "start") => {
    if (!selectedNode || !isContainer) return;

    setActionLoading(action);
    setActionResult(null);
    try {
      let result: ActionResult;
      switch (action) {
        case "restart":
          result = await api.restartContainer(selectedNode.id);
          break;
        case "stop":
          result = await api.stopContainer(selectedNode.id);
          break;
        case "start":
          result = await api.startContainer(selectedNode.id);
          break;
      }
      setActionResult(result);
      // Refresh details after action
      if (result.success) {
        setTimeout(fetchContainerDetail, 2000);
      }
    } catch (err) {
      setActionResult({
        success: false,
        containerId: selectedNode.id,
        containerName: selectedNode.label,
        action,
        message: err instanceof Error ? err.message : "Action failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (!selectedNode) return null;

  const StatusIcon = getServiceTypeIcon(selectedNode.type);
  const statusColor = getStatusColor(selectedNode.status);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] =
    isContainer
      ? [
          { id: "overview", label: "Overview", icon: Activity },
          { id: "logs", label: "Logs", icon: Terminal },
          { id: "environment", label: "Env", icon: Key },
          { id: "volumes", label: "Volumes", icon: Folder },
          { id: "health", label: "Health", icon: Heart },
        ]
      : [{ id: "overview", label: "Overview", icon: Activity }];

  const isRunning =
    selectedNode.status === "running" || selectedNode.status === "healthy";
  const isStopped = selectedNode.status === "exited";

  return (
    <div className="w-96 bg-flow-surface border-l border-flow-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-flow-border shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-flow-bg flex items-center justify-center ${statusColor.text}`}
            >
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-white text-sm truncate max-w-[200px]">
                {selectedNode.label}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${statusColor.bg}`} />
                <span className={`text-xs capitalize ${statusColor.text}`}>
                  {selectedNode.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="p-1 text-flow-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Container Actions - only show for actual containers */}
        {isLiveMode && isContainer && (
          <div className="flex gap-2 mt-3">
            {isRunning && (
              <>
                <button
                  onClick={() => handleAction("restart")}
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-flow-accent/10 hover:bg-flow-accent/20 text-flow-accent rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === "restart" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3" />
                  )}
                  Restart
                </button>
                <button
                  onClick={() => handleAction("stop")}
                  disabled={actionLoading !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === "stop" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Square className="w-3 h-3" />
                  )}
                  Stop
                </button>
              </>
            )}
            {isStopped && (
              <button
                onClick={() => handleAction("start")}
                disabled={actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === "start" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Start
              </button>
            )}
          </div>
        )}

        {/* Action Result */}
        {actionResult && (
          <div
            className={`mt-2 p-2 rounded text-xs flex items-center gap-2 ${
              actionResult.success
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {actionResult.success ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {actionResult.message}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-flow-border shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "text-flow-accent border-b-2 border-flow-accent bg-flow-accent/5"
                : "text-flow-muted hover:text-white"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-flow-accent animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="p-4 space-y-4">
                <p className="text-sm text-flow-muted">
                  {selectedNode.description}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedNode.port && (
                    <MetricCard
                      icon={ExternalLink}
                      label="Port"
                      value={String(selectedNode.port)}
                    />
                  )}
                  {selectedNode.cpu && (
                    <MetricCard
                      icon={Cpu}
                      label="CPU"
                      value={selectedNode.cpu}
                    />
                  )}
                  {selectedNode.memory && (
                    <MetricCard
                      icon={HardDrive}
                      label="Memory"
                      value={selectedNode.memory}
                    />
                  )}
                  {selectedNode.uptime && (
                    <MetricCard
                      icon={Clock}
                      label="Uptime"
                      value={selectedNode.uptime}
                    />
                  )}
                </div>

                {/* All Ports */}
                {containerDetail && containerDetail.ports.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-2">
                      All Ports
                    </h4>
                    <div className="space-y-1">
                      {containerDetail.ports.map((port, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs bg-flow-bg p-2 rounded"
                        >
                          <span className="text-white">
                            {port.containerPort}/{port.protocol}
                          </span>
                          <span className="text-flow-muted">
                            → {port.hostPort || "not mapped"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Networks */}
                {containerDetail && containerDetail.networks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-2">
                      Networks
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {containerDetail.networks.map((network) => (
                        <span
                          key={network}
                          className="px-2 py-0.5 bg-flow-accent/10 text-flow-accent text-xs rounded"
                        >
                          {network}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigate Deeper */}
                {selectedNode.linkedFlowchart && (
                  <button
                    onClick={() =>
                      navigateToFlowchartAsync(selectedNode.linkedFlowchart!)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-flow-accent/10 hover:bg-flow-accent/20 text-flow-accent rounded-lg transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="font-medium">Explore Details</span>
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === "logs" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide">
                    Recent Logs
                  </h4>
                  <button
                    onClick={fetchLogs}
                    disabled={logsLoading}
                    className="p-1 text-flow-muted hover:text-white transition-colors"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>

                {!isLiveMode ? (
                  <p className="text-sm text-flow-muted">
                    Logs are only available in Live Mode
                  </p>
                ) : logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-flow-accent animate-spin" />
                  </div>
                ) : logs ? (
                  <div className="bg-flow-bg rounded-lg p-3 max-h-[400px] overflow-y-auto">
                    <pre className="text-xs text-flow-muted font-mono whitespace-pre-wrap break-all">
                      {logs.logs.join("\n") || "No logs available"}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-flow-muted">
                    Click refresh to load logs
                  </p>
                )}
              </div>
            )}

            {/* Environment Tab */}
            {activeTab === "environment" && (
              <div className="p-4">
                <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
                  Environment Variables
                </h4>

                {!isLiveMode ? (
                  <p className="text-sm text-flow-muted">
                    Environment variables are only available in Live Mode
                  </p>
                ) : containerDetail?.environment.length ? (
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {containerDetail.environment.map((env, i) => {
                      const [key, ...valueParts] = env.split("=");
                      const value = valueParts.join("=");
                      const isSecret =
                        key.toLowerCase().includes("password") ||
                        key.toLowerCase().includes("secret") ||
                        key.toLowerCase().includes("key") ||
                        key.toLowerCase().includes("token");

                      return (
                        <div
                          key={i}
                          className="text-xs bg-flow-bg p-2 rounded font-mono"
                        >
                          <span className="text-flow-accent">{key}</span>
                          <span className="text-flow-muted">=</span>
                          <span className="text-white">
                            {isSecret ? "••••••••" : value || '""'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-flow-muted">
                    No environment variables defined
                  </p>
                )}

                {containerDetail?.command && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-2">
                      Command
                    </h4>
                    <div className="text-xs bg-flow-bg p-2 rounded font-mono text-white">
                      {containerDetail.command}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Volumes Tab */}
            {activeTab === "volumes" && (
              <div className="p-4">
                <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
                  Volume Mounts
                </h4>

                {!isLiveMode ? (
                  <p className="text-sm text-flow-muted">
                    Volume information is only available in Live Mode
                  </p>
                ) : containerDetail?.volumes.length ? (
                  <div className="space-y-2">
                    {containerDetail.volumes.map((vol, i) => (
                      <div key={i} className="bg-flow-bg p-3 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-flow-accent font-medium">
                            {vol.mode === "ro" ? "Read-only" : "Read-write"}
                          </span>
                        </div>
                        <div className="text-flow-muted truncate">
                          {vol.source}
                        </div>
                        <div className="text-white truncate">
                          → {vol.destination}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-flow-muted">No volumes mounted</p>
                )}
              </div>
            )}

            {/* Health Tab */}
            {activeTab === "health" && (
              <div className="p-4">
                <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
                  Health Check Configuration
                </h4>

                {!isLiveMode ? (
                  <p className="text-sm text-flow-muted">
                    Health check information is only available in Live Mode
                  </p>
                ) : containerDetail?.healthCheck ? (
                  <div className="space-y-3">
                    <div className="bg-flow-bg p-3 rounded">
                      <div className="text-xs text-flow-muted mb-1">Test</div>
                      <div className="text-xs text-white font-mono break-all">
                        {containerDetail.healthCheck.test.join(" ")}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-flow-bg p-2 rounded">
                        <div className="text-xs text-flow-muted">Interval</div>
                        <div className="text-sm text-white">
                          {containerDetail.healthCheck.intervalSeconds}s
                        </div>
                      </div>
                      <div className="bg-flow-bg p-2 rounded">
                        <div className="text-xs text-flow-muted">Timeout</div>
                        <div className="text-sm text-white">
                          {containerDetail.healthCheck.timeoutSeconds}s
                        </div>
                      </div>
                      <div className="bg-flow-bg p-2 rounded">
                        <div className="text-xs text-flow-muted">Retries</div>
                        <div className="text-sm text-white">
                          {containerDetail.healthCheck.retries}
                        </div>
                      </div>
                      <div className="bg-flow-bg p-2 rounded">
                        <div className="text-xs text-flow-muted">
                          Start Period
                        </div>
                        <div className="text-sm text-white">
                          {containerDetail.healthCheck.startPeriodSeconds}s
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-flow-muted">
                    No health check configured
                  </p>
                )}

                {/* Current Health Status */}
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-2">
                    Current Status
                  </h4>
                  <div
                    className={`flex items-center gap-2 p-3 rounded ${
                      selectedNode.status === "healthy"
                        ? "bg-green-500/10 text-green-400"
                        : selectedNode.status === "unhealthy"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-flow-bg text-flow-muted"
                    }`}
                  >
                    {selectedNode.status === "healthy" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : selectedNode.status === "unhealthy" ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {selectedNode.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-flow-bg rounded">
      <Icon className="w-4 h-4 text-flow-muted" />
      <div>
        <div className="text-xs text-flow-muted">{label}</div>
        <div className="text-sm text-white">{value}</div>
      </div>
    </div>
  );
}
