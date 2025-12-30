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

// Callback for fetching live flowcharts - set by useLiveData hook
let fetchLiveFlowchartCallback:
  | ((id: string) => Promise<ServiceFlowchart | null>)
  | null = null;

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

  // Design mode (allows drag/drop)
  isDesignMode: boolean;

  // Loading state for async navigation
  isNavigating: boolean;

  // Node positions (for design mode persistence)
  nodePositions: Record<string, { x: number; y: number }>;

  // Actions
  navigateToFlowchart: (id: string) => void;
  navigateToFlowchartAsync: (id: string) => Promise<void>;
  navigateBack: (toIndex?: number) => void;
  selectNode: (node: ServiceNode | null) => void;
  goHome: () => void;
  setLiveFlowchart: (flowchart: ServiceFlowchart) => void;
  setLiveMode: (enabled: boolean) => void;
  setDesignMode: (enabled: boolean) => void;
  setNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  setFetchCallback: (
    callback: ((id: string) => Promise<ServiceFlowchart | null>) | null
  ) => void;
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
  isDesignMode: false,
  isNavigating: false,
  nodePositions: {},

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

  navigateToFlowchartAsync: async (id: string) => {
    const { isLiveMode, currentFlowchartId } = get();
    if (currentFlowchartId === id) return;

    // First check cache
    const cached = getFlowchart(id, isLiveMode);
    if (cached) {
      set((state) => ({
        currentFlowchartId: id,
        currentFlowchart: cached,
        navigationStack: [...state.navigationStack, { id, label: cached.name }],
        selectedNode: null,
      }));
      return;
    }

    // If live mode and callback available, fetch from API
    if (isLiveMode && fetchLiveFlowchartCallback) {
      set({ isNavigating: true });
      try {
        const flowchart = await fetchLiveFlowchartCallback(id);
        if (flowchart) {
          // Cache it
          liveFlowchartCache[id] = flowchart;
          set((state) => ({
            currentFlowchartId: id,
            currentFlowchart: flowchart,
            navigationStack: [
              ...state.navigationStack,
              { id, label: flowchart.name },
            ],
            selectedNode: null,
            isNavigating: false,
          }));
        } else {
          set({ isNavigating: false });
        }
      } catch (error) {
        console.error("Failed to fetch flowchart:", error);
        set({ isNavigating: false });
      }
    }
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

  setDesignMode: (enabled: boolean) => {
    set({ isDesignMode: enabled });
  },

  setNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    set((state) => ({
      nodePositions: {
        ...state.nodePositions,
        [nodeId]: position,
      },
    }));
  },

  setFetchCallback: (callback) => {
    fetchLiveFlowchartCallback = callback;
  },
}));
