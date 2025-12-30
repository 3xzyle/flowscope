import { memo } from "react";
import { NodeResizer } from "@xyflow/react";

// Group node - container for organizing related nodes
interface GroupNodeData {
  label: string;
  description?: string;
  color?: string;
}

interface GroupNodeProps {
  data: GroupNodeData;
  selected?: boolean;
}

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
  },
  green: {
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    text: "text-green-400",
  },
  orange: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    text: "text-orange-400",
  },
  pink: {
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    text: "text-pink-400",
  },
  cyan: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
  },
  default: {
    border: "border-flow-border",
    bg: "bg-flow-surface/30",
    text: "text-flow-muted",
  },
};

function GroupNode({ data, selected }: GroupNodeProps) {
  const colors = colorMap[data.color || "default"] || colorMap.default;

  return (
    <div
      className={`
        min-w-[200px] min-h-[150px] w-full h-full
        rounded-xl border-2 border-dashed
        ${colors.border} ${colors.bg}
        transition-all duration-200 ease-out
        ${selected ? "border-solid !border-flow-accent" : ""}
      `}
    >
      {/* Header */}
      <div
        className={`
        px-4 py-2 border-b border-dashed ${colors.border}
        flex items-center gap-2
      `}
      >
        <span className={`text-sm font-medium ${colors.text}`}>
          {data.label}
        </span>
      </div>

      {/* Resize handle - only shown when selected */}
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected ?? false}
        lineClassName="!border-flow-accent"
        handleClassName="!w-2 !h-2 !bg-flow-accent !border-0"
      />
    </div>
  );
}

export default memo(GroupNode);
