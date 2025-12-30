import { Compass, Layers, Zap, Download, Workflow } from "lucide-react";
import { useFlowStore } from "../store/flowStore";

interface HeaderProps {
  onExportClick: () => void;
}

export default function Header({ onExportClick }: HeaderProps) {
  const { currentFlowchart, goHome, navigateToFlowchart } = useFlowStore();

  return (
    <header className="h-14 bg-flow-surface border-b border-flow-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={goHome}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">FlowScope</span>
        </button>

        <div className="h-6 w-px bg-flow-border mx-2" />

        <div className="flex items-center gap-2 text-flow-muted text-sm">
          <Layers className="w-4 h-4" />
          <span>{currentFlowchart?.name || "Loading..."}</span>
        </div>

        {/* Quick access to demo process flow */}
        <button
          onClick={() => navigateToFlowchart("val-coding-loop")}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-flow-muted hover:text-white hover:bg-flow-bg rounded transition-colors"
          title="View Val's Coding Loop (Process Flow Demo)"
        >
          <Workflow className="w-3 h-3" />
          <span>Coding Loop</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-flow-success">
            <span className="w-2 h-2 rounded-full bg-flow-success animate-pulse" />
            6 Running
          </span>
          <span className="flex items-center gap-1.5 text-flow-warning">
            <span className="w-2 h-2 rounded-full bg-flow-warning" />1 Warning
          </span>
        </div>

        <button
          onClick={onExportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-flow-bg hover:bg-flow-border text-white rounded-lg text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-flow-accent/10 text-flow-accent rounded-lg text-sm hover:bg-flow-accent/20 transition-colors">
          <Zap className="w-4 h-4" />
          <span>Design Mode</span>
        </button>
      </div>
    </header>
  );
}
