import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PredictPage from "./pages/PredictPage";
import DashboardPage from "./pages/DashboardPage";
import { getOnnxSession } from "./utils/onnxInference";

export default function App() {
  const [activeTab, setActiveTab] = useState("predict");

  // Preload and compile ONNX model in the background as soon as the user opens the page
  useEffect(() => {
    getOnnxSession().catch((err) => console.log("[ToolVision] Background preload:", err.message));
  }, []);

  return (
    <div className="bg-gradient-pattern" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>
        {activeTab === "predict" ? <PredictPage /> : <DashboardPage />}
      </main>

      {/* Enterprise Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)", padding: "1.75rem 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "1.25rem", fontSize: "0.825rem", color: "var(--text-secondary)" }}>
          <span>YOLOv8n-seg Architecture</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span>ONNX Runtime Engine</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span>18-Class Instance Segmentation</span>
        </div>
      </footer>
    </div>
  );
}
