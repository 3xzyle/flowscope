import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import type { ConnectionType } from "../data/mockData";

// Connection type colors and styles
interface EdgeStyle {
  color: string;
  strokeWidth: number;
  dashArray?: string;
  animated?: boolean;
}

const connectionStyles: Record<ConnectionType, EdgeStyle> = {
  // Standard connections
  http: { color: "#3b82f6", strokeWidth: 2 }, // blue
  grpc: { color: "#8b5cf6", strokeWidth: 2 }, // purple
  redis: { color: "#ef4444", strokeWidth: 2, dashArray: "5,5" }, // red dashed
  postgres: { color: "#10b981", strokeWidth: 2.5 }, // green
  rabbitmq: { color: "#f59e0b", strokeWidth: 2, dashArray: "8,4" }, // orange dashed
  websocket: { color: "#06b6d4", strokeWidth: 2, animated: true }, // cyan animated
  internal: { color: "#64748b", strokeWidth: 1.5 }, // gray
  flow: { color: "#22c55e", strokeWidth: 2 }, // green for process flows
  // Docker relationship connections
  network: {
    color: "#3b82f6",
    strokeWidth: 2,
    dashArray: "3,3",
    animated: true,
  }, // blue dashed animated
  volume: { color: "#f97316", strokeWidth: 2.5, dashArray: "10,5" }, // orange thick dashed
  depends: { color: "#a855f7", strokeWidth: 2, dashArray: "5,3,2,3" }, // purple complex dash
};

interface ServiceEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: unknown;
  targetPosition: unknown;
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
  } as Parameters<typeof getBezierPath>[0]);

  const edgeType = data?.type || "internal";
  const style = connectionStyles[edgeType] || connectionStyles.internal;
  const isAnimated = data?.animated ?? style.animated ?? false;

  // Get icon/label based on connection type
  const getConnectionIcon = (type: ConnectionType): string => {
    switch (type) {
      case "network":
        return "🌐";
      case "volume":
        return "💾";
      case "depends":
        return "⚡";
      case "postgres":
        return "🐘";
      case "redis":
        return "⚡";
      case "rabbitmq":
        return "🐰";
      default:
        return "";
    }
  };

  const icon = getConnectionIcon(edgeType);
  const displayLabel = icon
    ? `${icon} ${data?.label || ""}`.trim()
    : data?.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: style.color,
          strokeWidth: selected ? style.strokeWidth + 1 : style.strokeWidth,
          strokeDasharray: style.dashArray,
          filter: selected ? `drop-shadow(0 0 4px ${style.color})` : undefined,
        }}
        className={isAnimated ? "animated-edge" : ""}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="px-2 py-0.5 bg-flow-bg border border-flow-border rounded text-[10px] text-flow-muted whitespace-nowrap"
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ServiceEdge);
