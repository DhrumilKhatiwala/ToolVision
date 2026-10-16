import React, { useState } from "react";
import Navbar from "./components/Navbar";
import PredictPage from "./pages/PredictPage";
import DashboardPage from "./pages/DashboardPage";
import { ExternalLink } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("predict");

  // Dynamic backend API Swagger documentation URL
  const backendBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  const backendDocsUrl = backendBase ? `${backendBase}/docs` : "http://127.0.0.1:8000/docs";

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
          <span>FastAPI Architecture</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span>YOLOv8n-seg PyTorch Engine</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <a
            id="footer-swagger-link"
            href={backendDocsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 500 }}
            title="FastAPI Interactive Documentation"
          >
            <span>Interactive Swagger API</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
