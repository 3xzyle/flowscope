import { create } from "zustand";
import {
  flowchartData,
  type ServiceFlowchart,
  type ServiceNode,
} from "../data/mockData";

interface NavigationItem {
  id: string;
  label: string;
}

// Store for live flowcharts fetched from API
const liveFlowchartCache: Record<string, ServiceFlowchart> = {};

interface FlowState {
  // Current flowchart being viewed
  currentFlowchartId: string;
  currentFlowchart: ServiceFlowchart | null;

  // Navigation history (breadcrumbs)
  navigationStack: NavigationItem[];

  // Selected node for detail panel
  selectedNode: ServiceNode | null;

  // Data source mode
  isLiveMode: boolean;

  // Actions
  navigateToFlowchart: (id: string) => void;
  navigateBack: (toIndex?: number) => void;
  selectNode: (node: ServiceNode | null) => void;
  goHome: () => void;
  setLiveFlowchart: (flowchart: ServiceFlowchart) => void;
  setLiveMode: (enabled: boolean) => void;
}

// Get flowchart from cache (live first, then mock)
function getFlowchart(
  id: string,
  isLiveMode: boolean
): ServiceFlowchart | undefined {
  if (isLiveMode && liveFlowchartCache[id]) {
    return liveFlowchartCache[id];
  }
  return flowchartData[id];
}

export const useFlowStore = create<FlowState>((set, get) => ({
  currentFlowchartId: "system-overview",
  currentFlowchart: flowchartData["system-overview"],
  navigationStack: [{ id: "system-overview", label: "System Overview" }],
  selectedNode: null,
  isLiveMode: false,

  navigateToFlowchart: (id: string) => {
    const { isLiveMode } = get();
    const flowchart = getFlowchart(id, isLiveMode);
    if (!flowchart) return;

    const current = get().currentFlowchartId;
    if (current === id) return;

    set((state) => ({
      currentFlowchartId: id,
      currentFlowchart: flowchart,
      navigationStack: [
        ...state.navigationStack,
        { id, label: flowchart.name },
      ],
      selectedNode: null,
    }));
  },

  navigateBack: (toIndex?: number) => {
    const { navigationStack, isLiveMode } = get();
    if (navigationStack.length <= 1) return;

    const targetIndex = toIndex ?? navigationStack.length - 2;
    const target = navigationStack[targetIndex];
    const flowchart = getFlowchart(target.id, isLiveMode);

    set({
      currentFlowchartId: target.id,
      currentFlowchart: flowchart || null,
      navigationStack: navigationStack.slice(0, targetIndex + 1),
      selectedNode: null,
    });
  },

  selectNode: (node: ServiceNode | null) => {
    set({ selectedNode: node });
  },

  goHome: () => {
    const { isLiveMode } = get();
    const homeFlowchart = getFlowchart("system-overview", isLiveMode);

    set({
      currentFlowchartId: "system-overview",
      currentFlowchart: homeFlowchart || flowchartData["system-overview"],
      navigationStack: [{ id: "system-overview", label: "System Overview" }],
      selectedNode: null,
    });
  },

  setLiveFlowchart: (flowchart: ServiceFlowchart) => {
    // Cache the live flowchart
    liveFlowchartCache[flowchart.id] = flowchart;

    // If this is the current flowchart, update the view
    const { currentFlowchartId } = get();
    if (currentFlowchartId === flowchart.id) {
      set({ currentFlowchart: flowchart });
    }
  },

  setLiveMode: (enabled: boolean) => {
    set({ isLiveMode: enabled });

    // Refresh current view with appropriate data source
    const { currentFlowchartId } = get();
    const flowchart = getFlowchart(currentFlowchartId, enabled);
    if (flowchart) {
      set({ currentFlowchart: flowchart });
    }
  },
}));
