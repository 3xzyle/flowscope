import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Globe,
  Cog,
  Database,
  MessageSquare,
  Zap,
  Network,
  Brain,
  HardDrive,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type {
  ServiceNode as ServiceNodeType,
  ServiceType,
  ServiceStatus,
} from "../data/mockData";
import { useFlowStore } from "../store/flowStore";

// Icon mapping for service types
const serviceTypeIcons: Record<ServiceType, LucideIcon> = {
  api: Globe,
  worker: Cog,
  database: Database,
  queue: MessageSquare,
  cache: Zap,
  gateway: Network,
  ai: Brain,
  storage: HardDrive,
};

// Status color mapping
const statusColors: Record<
  ServiceStatus,
  { bg: string; text: string; border: string }
> = {
  running: {
    bg: "bg-flow-success",
    text: "text-flow-success",
    border: "border-flow-success/30",
  },
  stopped: {
    bg: "bg-flow-muted",
    text: "text-flow-muted",
    border: "border-flow-muted/30",
  },
  warning: {
    bg: "bg-flow-warning",
    text: "text-flow-warning",
    border: "border-flow-warning/30",
  },
  error: {
    bg: "bg-flow-danger",
    text: "text-flow-danger",
    border: "border-flow-danger/30",
  },
};

export const getServiceTypeIcon = (type: ServiceType): LucideIcon =>
  serviceTypeIcons[type];
export const getStatusColor = (status: ServiceStatus) => statusColors[status];

interface ServiceNodeData extends ServiceNodeType {
  label: string;
}

function ServiceNode({ data, selected }: NodeProps<ServiceNodeData>) {
  const { selectNode, navigateToFlowchart } = useFlowStore();

  const Icon = serviceTypeIcons[data.type] || Cog;
  const colors = statusColors[data.status] || statusColors.running;
  const hasDeeper = !!data.linkedFlowchart;

  const handleClick = () => {
    selectNode(data);
  };

  const handleDoubleClick = () => {
    if (hasDeeper) {
      navigateToFlowchart(data.linkedFlowchart!);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        relative group
        bg-flow-surface border-2 rounded-xl
        min-w-[180px] p-4
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20
        ${
          selected
            ? "border-flow-accent shadow-lg shadow-flow-accent/20"
            : colors.border
        }
        ${hasDeeper ? "cursor-pointer" : ""}
      `}
    >
      {/* Incoming handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-flow-border !border-2 !border-flow-surface"
      />

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
          w-10 h-10 rounded-lg bg-flow-bg flex items-center justify-center
          ${colors.text}
        `}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">
              {data.label}
            </h3>
            {hasDeeper && (
              <ChevronRight className="w-4 h-4 text-flow-muted group-hover:text-flow-accent group-hover:translate-x-0.5 transition-all" />
            )}
          </div>

          {/* Status & Type */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${colors.bg} ${
                data.status === "running" ? "animate-pulse" : ""
              }`}
            />
            <span className="text-xs text-flow-muted capitalize">
              {data.type}
            </span>
          </div>

          {/* Quick stats */}
          {(data.cpu || data.memory) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-flow-muted">
              {data.cpu && <span>CPU: {data.cpu}</span>}
              {data.memory && <span>RAM: {data.memory}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Navigate hint for linked nodes */}
      {hasDeeper && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-flow-muted whitespace-nowrap">
            Double-click to explore
          </span>
        </div>
      )}

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-flow-border !border-2 !border-flow-surface"
      />
    </div>
  );
}

export default memo(ServiceNode);
