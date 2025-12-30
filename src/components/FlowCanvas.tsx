import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlowStore } from "../store/flowStore";
import ServiceNode from "./ServiceNode";
import ServiceEdge from "./ServiceEdge";
import DecisionNode from "./DecisionNode";
import GroupNode from "./GroupNode";
import ProcessNode from "./ProcessNode";
import type {
  ServiceNode as ServiceNodeType,
  ServiceConnection,
} from "../data/mockData";

// Custom node types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = {
  service: ServiceNode,
  decision: DecisionNode,
  group: GroupNode,
  process: ProcessNode,
};

// Custom edge types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: any = {
  service: ServiceEdge,
};

// Check if a flowchart is a process/workflow type (has process nodes)
function isProcessFlow(nodes: ServiceNodeType[]): boolean {
  return nodes.some(
    (n) => n.nodeType === "process" || n.nodeType === "decision"
  );
}

// Auto-layout helper - adapts based on flowchart type
function layoutNodes(nodes: ServiceNodeType[]): Node[] {
  // If this is a process flow (like coding loop), use vertical layout
  if (isProcessFlow(nodes)) {
    return layoutProcessNodes(nodes);
  }

  // Otherwise use grid layout for service architecture
  return layoutGridNodes(nodes);
}

// Grid layout for service architecture diagrams
function layoutGridNodes(nodes: ServiceNodeType[]): Node[] {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const nodeWidth = 220;
  const nodeHeight = 140;
  const gapX = 100;
  const gapY = 80;

  return nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      id: node.id,
      type: node.nodeType || "service",
      position: {
        x: col * (nodeWidth + gapX),
        y: row * (nodeHeight + gapY),
      },
      data: { ...node },
    };
  });
}

// Vertical layout for process/workflow diagrams
function layoutProcessNodes(nodes: ServiceNodeType[]): Node[] {
  const nodeHeight = 60;
  const nodeWidth = 180;
  const gapY = 50;
  const triggerGap = 200;

  // Separate triggers from other nodes
  const triggers = nodes.filter((n) => n.processType === "trigger");
  const otherNodes = nodes.filter((n) => n.processType !== "trigger");

  const result: Node[] = [];

  // Layout triggers horizontally at the top
  triggers.forEach((node, index) => {
    result.push({
      id: node.id,
      type: node.nodeType || "process",
      position: {
        x: index * triggerGap,
        y: 0,
      },
      data: { ...node },
    });
  });

  // Layout other nodes vertically, with branching for decision outcomes
  let currentY = 120;
  const centerX = ((triggers.length - 1) * triggerGap) / 2;

  // Group nodes by their role in the flow
  const mainFlow: ServiceNodeType[] = [];
  const successPath: ServiceNodeType[] = [];
  const errorPath: ServiceNodeType[] = [];

  otherNodes.forEach((node) => {
    if (node.processType === "success") {
      successPath.push(node);
    } else if (node.processType === "error") {
      errorPath.push(node);
    } else {
      mainFlow.push(node);
    }
  });

  // Layout main flow vertically
  mainFlow.forEach((node) => {
    result.push({
      id: node.id,
      type: node.nodeType || "process",
      position: {
        x: centerX,
        y: currentY,
      },
      data: { ...node },
    });
    currentY += node.nodeType === "decision" ? 140 : nodeHeight + gapY;
  });

  // Layout success path (left side, below decision)
  let successY = currentY;
  successPath.forEach((node) => {
    result.push({
      id: node.id,
      type: node.nodeType || "process",
      position: {
        x: centerX - 100,
        y: successY,
      },
      data: { ...node },
    });
    successY += nodeHeight + gapY;
  });

  // Layout error path (right side, same level as first success)
  let errorY = currentY;
  errorPath.forEach((node) => {
    result.push({
      id: node.id,
      type: node.nodeType || "process",
      position: {
        x: centerX + 180,
        y: errorY,
      },
      data: { ...node },
    });
    errorY += nodeHeight + gapY;
  });

  return result;
}

// Convert connections to React Flow edges
function layoutEdges(connections: ServiceConnection[]): Edge[] {
  return connections.map((conn) => ({
    id: conn.id,
    source: conn.source,
    target: conn.target,
    type: "service",
    data: {
      type: conn.type,
      label: conn.label,
      animated: conn.animated,
    },
  }));
}

export default function FlowCanvas() {
  const {
    currentFlowchart,
    selectNode,
    isDesignMode,
    nodePositions,
    setNodePosition,
    isNavigating,
    navigateToFlowchart,
    navigateToFlowchartAsync,
    isLiveMode,
  } = useFlowStore();

  const initialNodes = useMemo(() => {
    if (!currentFlowchart) return [];
    const layoutedNodes = layoutNodes(currentFlowchart.nodes);

    // Apply saved positions in design mode
    if (isDesignMode) {
      return layoutedNodes.map((node) => {
        const savedPos = nodePositions[node.id];
        if (savedPos) {
          return { ...node, position: savedPos };
        }
        return node;
      });
    }

    return layoutedNodes;
  }, [currentFlowchart, isDesignMode, nodePositions]);

  const initialEdges = useMemo(() => {
    if (!currentFlowchart) return [];
    return layoutEdges(currentFlowchart.connections);
  }, [currentFlowchart]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when flowchart changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node drag end in design mode
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (isDesignMode) {
        setNodePosition(node.id, node.position);
      }
    },
    [isDesignMode, setNodePosition]
  );

  // Handle background click to deselect
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Handle node double-click for navigation
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const linkedFlowchart = node.data?.linkedFlowchart as string | undefined;
      if (linkedFlowchart && !isNavigating) {
        console.log(
          "[FlowCanvas] Double-click navigation to:",
          linkedFlowchart
        );
        if (isLiveMode) {
          navigateToFlowchartAsync(linkedFlowchart);
        } else {
          navigateToFlowchart(linkedFlowchart);
        }
      }
    },
    [isNavigating, isLiveMode, navigateToFlowchart, navigateToFlowchartAsync]
  );

  return (
    <div className="flex-1 transition-view relative">
      {/* Navigation loading indicator */}
      {isNavigating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-flow-bg/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 bg-flow-surface rounded-lg border border-flow-border">
            <div className="w-5 h-5 border-2 border-flow-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-flow-text">Loading flowchart...</span>
          </div>
        </div>
      )}

      {/* Design mode indicator */}
      {isDesignMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-flow-accent/20 border border-flow-accent/40 rounded-full">
          <span className="text-xs font-medium text-flow-accent">
            Design Mode - Drag nodes to reposition
          </span>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={isDesignMode}
        nodesConnectable={isDesignMode}
        elementsSelectable={true}
        zoomOnDoubleClick={false}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "service",
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2d3748"
        />
        <Controls
          showInteractive={false}
          className="!bg-flow-surface !border-flow-border !rounded-lg"
        />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data?.status;
            if (status === "running") return "#10b981";
            if (status === "warning") return "#f59e0b";
            if (status === "error") return "#ef4444";
            return "#64748b";
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="!bg-flow-surface !border-flow-border"
        />
      </ReactFlow>
    </div>
  );
}
