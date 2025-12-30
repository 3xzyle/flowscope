import { ChevronRight, Home } from "lucide-react";
import { useFlowStore } from "../store/flowStore";

export default function Breadcrumbs() {
  const { navigationStack, navigateBack, goHome } = useFlowStore();

  if (navigationStack.length <= 1) {
    return (
      <div className="h-10 bg-flow-bg border-b border-flow-border/50 flex items-center px-4">
        <div className="flex items-center gap-2 text-sm text-flow-muted">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-10 bg-flow-bg border-b border-flow-border/50 flex items-center px-4">
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={goHome}
          className="flex items-center gap-1 text-flow-muted hover:text-white transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>

        {navigationStack.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-flow-border" />
            <button
              onClick={() => navigateBack(index)}
              className={`px-2 py-0.5 rounded transition-colors ${
                index === navigationStack.length - 1
                  ? "text-white bg-flow-surface"
                  : "text-flow-muted hover:text-white"
              }`}
            >
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
