import { useState, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowCanvas from "./components/FlowCanvas";
import Header from "./components/Header";
import Breadcrumbs from "./components/Breadcrumbs";
import ServicePanel from "./components/ServicePanel";
import ExportPanel from "./components/ExportPanel";
import { useFlowStore } from "./store/flowStore";
import { useLiveData } from "./hooks/useLiveData";

function App() {
  const { selectedNode } = useFlowStore();
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

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-flow-bg">
        <Header
          onExportClick={() => setShowExport(!showExport)}
          isConnected={isConnected}
          topology={topology}
          onRefresh={refetch}
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
          {selectedNode && <ServicePanel />}
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
