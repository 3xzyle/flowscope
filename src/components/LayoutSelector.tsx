import { useState } from "react";
import { LayoutGrid, GitBranch, Layers, ChevronDown, Zap } from "lucide-react";

export type LayoutMode = "default" | "grid" | "hierarchical" | "force";

interface LayoutSelectorProps {
  currentLayout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  onAutoLayout: () => void;
}

const LAYOUT_OPTIONS: {
  mode: LayoutMode;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    mode: "default",
    label: "Default",
    icon: Layers,
    description: "Preset positions",
  },
  {
    mode: "grid",
    label: "Grid",
    icon: LayoutGrid,
    description: "Aligned grid layout",
  },
  {
    mode: "hierarchical",
    label: "Hierarchy",
    icon: GitBranch,
    description: "Top-down tree",
  },
  {
    mode: "force",
    label: "Force",
    icon: Zap,
    description: "Physics-based",
  },
];

export default function LayoutSelector({
  currentLayout,
  onLayoutChange,
  onAutoLayout,
}: LayoutSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption =
    LAYOUT_OPTIONS.find((opt) => opt.mode === currentLayout) ||
    LAYOUT_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-flow-surface border border-flow-border rounded-lg text-sm text-white hover:border-flow-accent transition-colors"
      >
        <CurrentIcon className="w-4 h-4 text-flow-accent" />
        <span>{currentOption.label}</span>
        <ChevronDown
          className={`w-3 h-3 text-flow-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-flow-surface border border-flow-border rounded-lg shadow-xl z-20 overflow-hidden">
            {LAYOUT_OPTIONS.map((option) => (
              <button
                key={option.mode}
                onClick={() => {
                  onLayoutChange(option.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${
                  currentLayout === option.mode
                    ? "bg-flow-accent/10 text-flow-accent"
                    : "text-white hover:bg-flow-bg"
                }`}
              >
                <option.icon className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-flow-muted">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}

            {/* Auto Layout Button */}
            <div className="border-t border-flow-border p-2">
              <button
                onClick={() => {
                  onAutoLayout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-flow-accent/10 hover:bg-flow-accent/20 text-flow-accent rounded text-sm font-medium transition-colors"
              >
                <Zap className="w-4 h-4" />
                Apply Auto-Layout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Layout algorithms
export function applyGridLayout(
  nodes: { id: string; position: { x: number; y: number } }[],
  columns: number = 4,
  nodeWidth: number = 200,
  nodeHeight: number = 100,
  gapX: number = 50,
  gapY: number = 50
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  nodes.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    positions[node.id] = {
      x: col * (nodeWidth + gapX) + 50,
      y: row * (nodeHeight + gapY) + 50,
    };
  });

  return positions;
}

export function applyHierarchicalLayout(
  nodes: { id: string; position: { x: number; y: number } }[],
  connections: { source: string; target: string }[],
  levelHeight: number = 150,
  nodeSpacing: number = 200
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // Find root nodes (nodes with no incoming connections)
  const targetNodes = new Set(connections.map((c) => c.target));
  const rootNodes = nodes.filter((n) => !targetNodes.has(n.id));

  // Build adjacency list
  const children: Record<string, string[]> = {};
  connections.forEach((c) => {
    if (!children[c.source]) children[c.source] = [];
    children[c.source].push(c.target);
  });

  // BFS to assign levels
  const levels: Record<string, number> = {};
  const queue = rootNodes.map((n) => ({ id: n.id, level: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    levels[id] = level;

    const nodeChildren = children[id] || [];
    nodeChildren.forEach((childId) => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }

  // Assign nodes without connections to level 0
  nodes.forEach((n) => {
    if (levels[n.id] === undefined) {
      levels[n.id] = 0;
    }
  });

  // Group by level
  const nodesPerLevel: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, level]) => {
    if (!nodesPerLevel[level]) nodesPerLevel[level] = [];
    nodesPerLevel[level].push(id);
  });

  // Position nodes
  Object.entries(nodesPerLevel).forEach(([levelStr, nodeIds]) => {
    const level = parseInt(levelStr);
    const totalWidth = (nodeIds.length - 1) * nodeSpacing;
    const startX = -totalWidth / 2;

    nodeIds.forEach((id, index) => {
      positions[id] = {
        x: startX + index * nodeSpacing + 400,
        y: level * levelHeight + 50,
      };
    });
  });

  return positions;
}

export function applyForceLayout(
  nodes: { id: string; position: { x: number; y: number } }[],
  connections: { source: string; target: string }[],
  iterations: number = 100
): Record<string, { x: number; y: number }> {
  // Simple force-directed layout
  const positions: Record<string, { x: number; y: number }> = {};
  const velocities: Record<string, { x: number; y: number }> = {};

  // Initialize with current or random positions
  nodes.forEach((node) => {
    positions[node.id] = { ...node.position };
    velocities[node.id] = { x: 0, y: 0 };
  });

  const repulsionStrength = 5000;
  const attractionStrength = 0.05;
  const damping = 0.9;
  const centerX = 400;
  const centerY = 300;

  for (let i = 0; i < iterations; i++) {
    // Repulsion between all nodes
    nodes.forEach((nodeA) => {
      nodes.forEach((nodeB) => {
        if (nodeA.id === nodeB.id) return;

        const dx = positions[nodeB.id].x - positions[nodeA.id].x;
        const dy = positions[nodeB.id].y - positions[nodeA.id].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = repulsionStrength / (dist * dist);
        velocities[nodeA.id].x -= (dx / dist) * force;
        velocities[nodeA.id].y -= (dy / dist) * force;
      });
    });

    // Attraction along edges
    connections.forEach((conn) => {
      const posA = positions[conn.source];
      const posB = positions[conn.target];
      if (!posA || !posB) return;

      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;

      velocities[conn.source].x += dx * attractionStrength;
      velocities[conn.source].y += dy * attractionStrength;
      velocities[conn.target].x -= dx * attractionStrength;
      velocities[conn.target].y -= dy * attractionStrength;
    });

    // Center gravity
    nodes.forEach((node) => {
      const dx = centerX - positions[node.id].x;
      const dy = centerY - positions[node.id].y;
      velocities[node.id].x += dx * 0.01;
      velocities[node.id].y += dy * 0.01;
    });

    // Apply velocities
    nodes.forEach((node) => {
      positions[node.id].x += velocities[node.id].x;
      positions[node.id].y += velocities[node.id].y;
      velocities[node.id].x *= damping;
      velocities[node.id].y *= damping;
    });
  }

  return positions;
}
