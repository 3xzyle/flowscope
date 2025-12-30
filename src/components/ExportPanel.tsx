import { useState, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import { saveAs } from "file-saver";
import { Download, Image, FileCode, Code, Copy, Check, X } from "lucide-react";
import { useFlowStore } from "../store/flowStore";

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportPanel({ isOpen, onClose }: ExportPanelProps) {
  const { currentFlowchart } = useFlowStore();
  useReactFlow(); // Keep hook for potential future use
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportScale, setExportScale] = useState(2);

  const getFlowElement = useCallback(() => {
    return document.querySelector(".react-flow") as HTMLElement;
  }, []);

  const exportToPng = useCallback(async () => {
    const element = getFlowElement();
    if (!element) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: "#0f1419",
        pixelRatio: exportScale,
        filter: (node) => {
          // Exclude controls and minimap from export
          if (node.classList?.contains("react-flow__controls")) return false;
          if (node.classList?.contains("react-flow__minimap")) return false;
          return true;
        },
      });

      const filename = `${
        currentFlowchart?.name || "flowchart"
      }-${Date.now()}.png`;
      saveAs(dataUrl, filename.replace(/\s+/g, "-").toLowerCase());
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [getFlowElement, currentFlowchart, exportScale]);

  const exportToSvg = useCallback(async () => {
    const element = getFlowElement();
    if (!element) return;

    setIsExporting(true);
    try {
      const dataUrl = await toSvg(element, {
        backgroundColor: "#0f1419",
        filter: (node) => {
          if (node.classList?.contains("react-flow__controls")) return false;
          if (node.classList?.contains("react-flow__minimap")) return false;
          return true;
        },
      });

      const filename = `${
        currentFlowchart?.name || "flowchart"
      }-${Date.now()}.svg`;
      saveAs(dataUrl, filename.replace(/\s+/g, "-").toLowerCase());
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [getFlowElement, currentFlowchart]);

  const generateEmbedCode = useCallback(() => {
    const flowchartId = currentFlowchart?.id || "unknown";
    // This would be a real embed URL in production
    return `<iframe 
  src="https://flowscope.local/embed/${flowchartId}"
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 8px; border: 1px solid #2d3748;"
></iframe>`;
  }, [currentFlowchart]);

  const generateMarkdownLink = useCallback(() => {
    const name = currentFlowchart?.name || "Flowchart";
    const id = currentFlowchart?.id || "unknown";
    return `![${name}](./flowcharts/${id}.png)`;
  }, [currentFlowchart]);

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const exportToJson = useCallback(() => {
    if (!currentFlowchart) return;

    const data = JSON.stringify(currentFlowchart, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const filename = `${currentFlowchart.name}-${Date.now()}.json`;
    saveAs(blob, filename.replace(/\s+/g, "-").toLowerCase());
  }, [currentFlowchart]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 w-80 bg-flow-surface border border-flow-border rounded-xl shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-flow-border">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-flow-accent" />
          <h3 className="font-medium text-white">Export Flowchart</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-flow-muted hover:text-white transition-colors"
          title="Close export panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Export Options */}
      <div className="p-4 space-y-4">
        {/* Image Exports */}
        <div>
          <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
            Image Export
          </h4>

          {/* Scale selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-flow-muted">Resolution:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((scale) => (
                <button
                  key={scale}
                  onClick={() => setExportScale(scale)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    exportScale === scale
                      ? "bg-flow-accent text-white"
                      : "bg-flow-bg text-flow-muted hover:text-white"
                  }`}
                >
                  {scale}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToPng}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-flow-accent hover:bg-flow-accent/80 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Image className="w-4 h-4" />
              <span>PNG</span>
            </button>
            <button
              onClick={exportToSvg}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-flow-bg hover:bg-flow-border text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FileCode className="w-4 h-4" />
              <span>SVG</span>
            </button>
          </div>
        </div>

        {/* Data Export */}
        <div>
          <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
            Data Export
          </h4>
          <button
            onClick={exportToJson}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-flow-bg hover:bg-flow-border text-white rounded-lg transition-colors"
          >
            <Code className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Embed Code */}
        <div>
          <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
            Embed Code
          </h4>
          <div className="relative">
            <pre className="p-3 bg-flow-bg rounded-lg text-xs text-flow-muted overflow-x-auto max-h-24">
              {generateEmbedCode()}
            </pre>
            <button
              onClick={() => copyToClipboard(generateEmbedCode())}
              className="absolute top-2 right-2 p-1.5 bg-flow-surface hover:bg-flow-border rounded transition-colors"
              title="Copy embed code"
            >
              {copied ? (
                <Check className="w-3 h-3 text-flow-success" />
              ) : (
                <Copy className="w-3 h-3 text-flow-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Markdown */}
        <div>
          <h4 className="text-xs font-medium text-flow-muted uppercase tracking-wide mb-3">
            Markdown
          </h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-flow-bg rounded-lg text-xs text-flow-muted truncate">
              {generateMarkdownLink()}
            </code>
            <button
              onClick={() => copyToClipboard(generateMarkdownLink())}
              className="p-2 bg-flow-bg hover:bg-flow-border rounded-lg transition-colors"
              title="Copy markdown"
            >
              {copied ? (
                <Check className="w-4 h-4 text-flow-success" />
              ) : (
                <Copy className="w-4 h-4 text-flow-muted" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-flow-bg/50 border-t border-flow-border">
        <p className="text-xs text-flow-muted text-center">
          {currentFlowchart?.nodes.length || 0} nodes •{" "}
          {currentFlowchart?.connections.length || 0} connections
        </p>
      </div>
    </div>
  );
}
