import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

// Decision node - diamond shape for branching logic
interface DecisionNodeData {
  label: string;
  description?: string;
}

interface DecisionNodeProps {
  data: DecisionNodeData;
  selected?: boolean;
}

function DecisionNode({ data, selected }: DecisionNodeProps) {
  return (
    <div className="relative">
      {/* Incoming handle - top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-flow-warning !border-2 !border-flow-surface"
      />

      {/* Diamond shape */}
      <div
        className={`
          w-32 h-32 rotate-45
          bg-flow-surface border-2 
          flex items-center justify-center
          transition-all duration-200 ease-out
          hover:scale-105 hover:shadow-lg hover:shadow-black/20
          ${
            selected
              ? "border-flow-accent shadow-lg shadow-flow-accent/20"
              : "border-flow-warning/50"
          }
        `}
      >
        <div className="-rotate-45 text-center px-2">
          <span className="text-sm font-medium text-white">{data.label}</span>
        </div>
      </div>

      {/* Outgoing handles */}
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        className="!w-3 !h-3 !bg-flow-danger !border-2 !border-flow-surface !-left-1.5"
        style={{ top: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!w-3 !h-3 !bg-flow-success !border-2 !border-flow-surface"
      />
    </div>
  );
}

export default memo(DecisionNode);
