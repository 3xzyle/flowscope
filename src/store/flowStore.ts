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

interface FlowState {
  // Current flowchart being viewed
  currentFlowchartId: string;
  currentFlowchart: ServiceFlowchart | null;

  // Navigation history (breadcrumbs)
  navigationStack: NavigationItem[];

  // Selected node for detail panel
  selectedNode: ServiceNode | null;

  // Actions
  navigateToFlowchart: (id: string) => void;
  navigateBack: (toIndex?: number) => void;
  selectNode: (node: ServiceNode | null) => void;
  goHome: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  currentFlowchartId: "system-overview",
  currentFlowchart: flowchartData["system-overview"],
  navigationStack: [{ id: "system-overview", label: "System Overview" }],
  selectedNode: null,

  navigateToFlowchart: (id: string) => {
    const flowchart = flowchartData[id];
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
    const stack = get().navigationStack;
    if (stack.length <= 1) return;

    const targetIndex = toIndex ?? stack.length - 2;
    const target = stack[targetIndex];
    const flowchart = flowchartData[target.id];

    set({
      currentFlowchartId: target.id,
      currentFlowchart: flowchart,
      navigationStack: stack.slice(0, targetIndex + 1),
      selectedNode: null,
    });
  },

  selectNode: (node: ServiceNode | null) => {
    set({ selectedNode: node });
  },

  goHome: () => {
    set({
      currentFlowchartId: "system-overview",
      currentFlowchart: flowchartData["system-overview"],
      navigationStack: [{ id: "system-overview", label: "System Overview" }],
      selectedNode: null,
    });
  },
}));
