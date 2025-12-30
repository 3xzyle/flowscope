import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import type { ConnectionType } from "../data/mockData";

// Connection type colors
const connectionColors: Record<ConnectionType, string> = {
  http: "#3b82f6", // blue
  grpc: "#8b5cf6", // purple
  redis: "#ef4444", // red
  postgres: "#10b981", // green
  rabbitmq: "#f59e0b", // orange
  websocket: "#06b6d4", // cyan
  internal: "#64748b", // gray
  flow: "#22c55e", // green for process flows
};

interface ServiceEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  data?: {
    type?: ConnectionType;
    label?: string;
    animated?: boolean;
  };
  selected?: boolean;
}

function ServiceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: ServiceEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = data?.type || "internal";
  const color = connectionColors[edgeType] || connectionColors.internal;
  const isAnimated = data?.animated ?? false;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          filter: selected ? `drop-shadow(0 0 4px ${color})` : undefined,
        }}
        className={isAnimated ? "animated-edge" : ""}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="px-2 py-0.5 bg-flow-bg border border-flow-border rounded text-[10px] text-flow-muted"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ServiceEdge);
