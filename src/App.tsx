import { useState, useEffect, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowCanvas from "./components/FlowCanvas";
import Header from "./components/Header";
import Breadcrumbs from "./components/Breadcrumbs";
import ContainerDetailPanel from "./components/ContainerDetailPanel";
import ExportPanel from "./components/ExportPanel";
import { useFlowStore } from "./store/flowStore";
import { useLiveData } from "./hooks/useLiveData";
import {
  applyGridLayout,
  applyHierarchicalLayout,
  applyForceLayout,
} from "./components/LayoutSelector";

function App() {
  const { selectedNode, currentFlowchart, layoutMode, saveNodePositions } =
    useFlowStore();
  const [showExport, setShowExport] = useState(false);
  const { isConnected, topology, refetch, isLoading } = useLiveData();

  // Show loading state
  useEffect(() => {
    if (isConnected && topology) {
      console.log(
        `🔭 FlowScope connected: ${topology.totalContainers} containers discovered`
      );
    }
  }, [isConnected, topology]);

  // Auto-layout handler
  const handleAutoLayout = useCallback(() => {
    if (!currentFlowchart) return;

    const nodes = currentFlowchart.nodes.map((n) => ({
      id: n.id,
      position: { x: 0, y: 0 },
    }));

    const connections = currentFlowchart.connections.map((c) => ({
      source: c.source,
      target: c.target,
    }));

    let positions: Record<string, { x: number; y: number }>;

    switch (layoutMode) {
      case "grid":
        positions = applyGridLayout(nodes);
        break;
      case "hierarchical":
        positions = applyHierarchicalLayout(nodes, connections);
        break;
      case "force":
        positions = applyForceLayout(nodes, connections);
        break;
      default:
        positions = {};
    }

    if (Object.keys(positions).length > 0) {
      saveNodePositions(currentFlowchart.id, positions);
    }
  }, [currentFlowchart, layoutMode, saveNodePositions]);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-flow-bg">
        <Header
          onExportClick={() => setShowExport(!showExport)}
          isConnected={isConnected}
          topology={topology}
          onRefresh={refetch}
          onAutoLayout={handleAutoLayout}
        />
        <Breadcrumbs />
        <div className="flex-1 flex relative">
          {isLoading && !topology && (
            <div className="absolute inset-0 flex items-center justify-center bg-flow-bg/80 z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-flow-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-flow-muted text-sm">
                  Discovering containers...
                </p>
              </div>
            </div>
          )}
          <FlowCanvas />
          {selectedNode && <ContainerDetailPanel />}
          <ExportPanel
            isOpen={showExport}
            onClose={() => setShowExport(false)}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
