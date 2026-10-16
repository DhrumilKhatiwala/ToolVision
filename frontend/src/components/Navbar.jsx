import React from "react";
import { Crosshair, BarChart3 } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="card-glass" style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "70px" }}>
        
        {/* Enterprise Brand Logo & Title */}
        <div 
          id="nav-brand" 
          onClick={() => setActiveTab("predict")}
          style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer", userSelect: "none" }}
        >
          {/* Minimalist Vision Aperture Emblem */}
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            background: "#0F172A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8V4M4 4H8M4 4L9 9" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 8V4M20 4H16M20 4L15 9" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16V20M4 20H8M4 20L9 15" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 16V20M20 20H16M20 20L15 15" stroke="#94A3B8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" fill="#6366F1"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              ToolVision
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "-1px" }}>
              Computer Vision & Instance Segmentation
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          background: "var(--bg-subtle)",
          padding: "0.25rem",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)"
        }}>
          <button
            id="tab-predict"
            onClick={() => setActiveTab("predict")}
            className="btn btn-sm"
            style={{
              background: activeTab === "predict" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "predict" ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: activeTab === "predict" ? "var(--shadow-xs)" : "none",
              borderRadius: "6px",
              fontWeight: activeTab === "predict" ? 600 : 500,
              padding: "0.45rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem"
            }}
          >
            <Crosshair size={15} />
            <span>Detection Studio</span>
          </button>
          
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className="btn btn-sm"
            style={{
              background: activeTab === "dashboard" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "dashboard" ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: activeTab === "dashboard" ? "var(--shadow-xs)" : "none",
              borderRadius: "6px",
              fontWeight: activeTab === "dashboard" ? 600 : 500,
              padding: "0.45rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem"
            }}
          >
            <BarChart3 size={15} />
            <span>Model Analytics</span>
          </button>
        </nav>

      </div>
    </header>
  );
}
