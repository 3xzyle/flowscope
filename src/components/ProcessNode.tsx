import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Play,
  Cog,
  CheckCircle,
  AlertCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Process node - for workflow steps (like your coding loop steps)
export type ProcessType =
  | "trigger"
  | "process"
  | "validation"
  | "success"
  | "error"
  | "action";

interface ProcessNodeData {
  label: string;
  description?: string;
  processType?: ProcessType;
  isActive?: boolean;
}

interface ProcessNodeProps {
  data: ProcessNodeData;
  selected?: boolean;
}

const processConfig: Record<
  ProcessType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  trigger: {
    icon: Play,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/30",
  },
  process: {
    icon: Cog,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/30",
  },
  validation: {
    icon: CheckCircle,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10 border-cyan-500/30",
  },
  success: {
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10 border-green-500/30",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/30",
  },
  action: {
    icon: Zap,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/30",
  },
};

function ProcessNode({ data, selected }: ProcessNodeProps) {
  const type = data.processType || "process";
  const config = processConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        relative group
        min-w-[160px] px-4 py-3
        rounded-lg border-2
        ${config.bgColor}
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20
        ${selected ? "!border-flow-accent shadow-lg shadow-flow-accent/20" : ""}
        ${
          data.isActive
            ? "ring-2 ring-flow-accent ring-offset-2 ring-offset-flow-bg"
            : ""
        }
      `}
    >
      {/* Incoming handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-flow-border !border-2 !border-flow-surface"
      />

      {/* Content */}
      <div className="flex items-center gap-3">
        <div className={`${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {data.label}
          </h3>
          {data.description && (
            <p className="text-xs text-flow-muted truncate mt-0.5">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-flow-border !border-2 !border-flow-surface"
      />
    </div>
  );
}

export default memo(ProcessNode);
