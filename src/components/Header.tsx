import {
  Compass,
  Layers,
  Zap,
  Download,
  Workflow,
  RefreshCw,
  Move,
} from "lucide-react";
import { useFlowStore } from "../store/flowStore";
import ConnectionStatus from "./ConnectionStatus";
import SearchFilter from "./SearchFilter";
import LayoutSelector from "./LayoutSelector";

interface HeaderProps {
  onExportClick: () => void;
  isConnected?: boolean;
  topology?: {
    totalContainers: number;
    runningContainers: number;
    healthyContainers: number;
    unhealthyContainers: number;
  } | null;
  onRefresh?: () => void;
  onAutoLayout?: () => void;
}

export default function Header({
  onExportClick,
  topology,
  onRefresh,
  onAutoLayout,
}: HeaderProps) {
  const {
    currentFlowchart,
    goHome,
    navigateToFlowchart,
    isDesignMode,
    setDesignMode,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    layoutMode,
    setLayoutMode,
  } = useFlowStore();

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

        <div className="h-6 w-px bg-flow-border mx-1" />

        {/* Search & Filter */}
        <SearchFilter
          onSearchChange={setSearchQuery}
          onStatusFilter={setStatusFilter}
          onCategoryFilter={setCategoryFilter}
          activeStatusFilter={statusFilter}
          activeCategoryFilter={categoryFilter}
        />

        {/* Layout Selector */}
        <LayoutSelector
          currentLayout={layoutMode}
          onLayoutChange={setLayoutMode}
          onAutoLayout={onAutoLayout || (() => {})}
        />
      </div>

      <div className="flex items-center gap-4">
        <ConnectionStatus />

        {topology ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-flow-success">
              <span className="w-2 h-2 rounded-full bg-flow-success animate-pulse" />
              {topology.runningContainers} Running
            </span>
            <span className="flex items-center gap-1.5 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {topology.healthyContainers} Healthy
            </span>
            {topology.unhealthyContainers > 0 && (
              <span className="flex items-center gap-1.5 text-flow-warning">
                <span className="w-2 h-2 rounded-full bg-flow-warning" />
                {topology.unhealthyContainers} Unhealthy
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-flow-success">
              <span className="w-2 h-2 rounded-full bg-flow-success animate-pulse" />
              6 Running
            </span>
            <span className="flex items-center gap-1.5 text-flow-warning">
              <span className="w-2 h-2 rounded-full bg-flow-warning" />1 Warning
            </span>
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 text-flow-muted hover:text-white hover:bg-flow-bg rounded transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onExportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-flow-bg hover:bg-flow-border text-white rounded-lg text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-flow-accent/10 text-flow-accent rounded-lg text-sm hover:bg-flow-accent/20 transition-colors">
          <Zap className="w-4 h-4" />
          <span>Quick Actions</span>
        </button>

        <button
          onClick={() => setDesignMode(!isDesignMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            isDesignMode
              ? "bg-flow-accent text-white"
              : "bg-flow-bg hover:bg-flow-border text-flow-muted hover:text-white"
          }`}
          title={
            isDesignMode
              ? "Exit design mode"
              : "Enter design mode to drag nodes"
          }
        >
          <Move className="w-4 h-4" />
          <span>{isDesignMode ? "Exit Design" : "Design Mode"}</span>
        </button>
      </div>
    </header>
  );
}
