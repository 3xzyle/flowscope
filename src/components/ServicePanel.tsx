import {
  X,
  ExternalLink,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useFlowStore } from "../store/flowStore";
import { getServiceTypeIcon, getStatusColor } from "./ServiceNode";

export default function ServicePanel() {
  const { selectedNode, selectNode, navigateToFlowchart } = useFlowStore();

  if (!selectedNode) return null;

  const StatusIcon = getServiceTypeIcon(selectedNode.type);
  const statusColor = getStatusColor(selectedNode.status);

  return (
    <div className="w-80 bg-flow-surface border-l border-flow-border flex flex-col transition-view">
      {/* Header */}
      <div className="p-4 border-b border-flow-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-flow-bg flex items-center justify-center ${statusColor.text}`}
            >
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-white">{selectedNode.label}</h3>
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
      </div>

      {/* Description */}
      <div className="p-4 border-b border-flow-border">
        <p className="text-sm text-flow-muted">{selectedNode.description}</p>
      </div>

      {/* Metrics */}
      <div className="p-4 border-b border-flow-border">
        <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
          Resources
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {selectedNode.port && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-flow-muted" />
              <div>
                <div className="text-xs text-flow-muted">Port</div>
                <div className="text-sm text-white">{selectedNode.port}</div>
              </div>
            </div>
          )}
          {selectedNode.cpu && (
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-flow-muted" />
              <div>
                <div className="text-xs text-flow-muted">CPU</div>
                <div className="text-sm text-white">{selectedNode.cpu}</div>
              </div>
            </div>
          )}
          {selectedNode.memory && (
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-flow-muted" />
              <div>
                <div className="text-xs text-flow-muted">Memory</div>
                <div className="text-sm text-white">{selectedNode.memory}</div>
              </div>
            </div>
          )}
          {selectedNode.uptime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-flow-muted" />
              <div>
                <div className="text-xs text-flow-muted">Uptime</div>
                <div className="text-sm text-white">{selectedNode.uptime}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      {selectedNode.metrics && (
        <div className="p-4 border-b border-flow-border">
          <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
            Performance
          </h4>
          <div className="space-y-2">
            {selectedNode.metrics.requests && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-flow-muted">Requests</span>
                <span className="text-sm text-white font-medium">
                  {selectedNode.metrics.requests}
                </span>
              </div>
            )}
            {selectedNode.metrics.latency && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-flow-muted">Latency</span>
                <span className="text-sm text-white font-medium">
                  {selectedNode.metrics.latency}
                </span>
              </div>
            )}
            {selectedNode.metrics.errorRate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-flow-muted">Error Rate</span>
                <span
                  className={`text-sm font-medium ${
                    parseFloat(selectedNode.metrics.errorRate) > 1
                      ? "text-flow-danger"
                      : "text-flow-success"
                  }`}
                >
                  {selectedNode.metrics.errorRate}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigate Deeper */}
      {selectedNode.linkedFlowchart && (
        <div className="p-4">
          <button
            onClick={() => navigateToFlowchart(selectedNode.linkedFlowchart!)}
            className="w-full flex items-center justify-between px-4 py-3 bg-flow-accent/10 hover:bg-flow-accent/20 text-flow-accent rounded-lg transition-colors group"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="font-medium">Explore Details</span>
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
