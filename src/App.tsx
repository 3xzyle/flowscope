import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowCanvas from "./components/FlowCanvas";
import Header from "./components/Header";
import Breadcrumbs from "./components/Breadcrumbs";
import ServicePanel from "./components/ServicePanel";
import ExportPanel from "./components/ExportPanel";
import { useFlowStore } from "./store/flowStore";

function App() {
  const { selectedNode } = useFlowStore();
  const [showExport, setShowExport] = useState(false);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-flow-bg">
        <Header onExportClick={() => setShowExport(!showExport)} />
        <Breadcrumbs />
        <div className="flex-1 flex relative">
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
