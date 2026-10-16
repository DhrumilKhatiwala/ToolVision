import React, { useState } from "react";
import { Eye, Layers, Clock, Download, AlertCircle, Columns, Target, Maximize2 } from "lucide-react";
import DetectionCard from "./DetectionCard";

export default function PredictionView({ predictionResult, originalUrl }) {
  const [activeView, setActiveView] = useState("annotated"); // "annotated" | "original" | "split"

  if (!predictionResult) return null;

  const { detections, total_detections, inference_time_ms, annotated_image, image_width, image_height } = predictionResult;

  const downloadAnnotatedImage = () => {
    const link = document.createElement("a");
    link.href = annotated_image;
    link.download = `toolvision_annotated_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="animate-fade-in">
      {/* Metrics Banner */}
      <div
        className="card metrics-banner"
        style={{
          padding: "1.25rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--border-subtle)"
        }}
      >
        <div className="metrics-row">
          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Target size={13} color="var(--accent-primary)" />
              <span>Detections</span>
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: total_detections > 0 ? "var(--accent-primary)" : "var(--text-secondary)" }}>
              {total_detections} {total_detections === 1 ? "Object" : "Objects"}
            </div>
          </div>

          <div className="metric-divider" style={{ width: "1px", height: "36px", backgroundColor: "var(--border-subtle)" }} />

          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Clock size={13} color="var(--accent-primary)" />
              <span>Latency</span>
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              {inference_time_ms} ms
            </div>
          </div>

          <div className="metric-divider" style={{ width: "1px", height: "36px", backgroundColor: "var(--border-subtle)" }} />

          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Maximize2 size={13} color="var(--accent-primary)" />
              <span>Resolution</span>
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {image_width} × {image_height}
            </div>
          </div>
        </div>

        {/* View Switcher & Export */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", width: "100%", justifyContent: "space-between" }}>
          <div className="tabs-scroll-container">
            <button
              id="view-annotated-btn"
              onClick={() => setActiveView("annotated")}
              className="btn btn-sm"
              style={{
                background: activeView === "annotated" ? "var(--bg-surface)" : "transparent",
                color: activeView === "annotated" ? "var(--accent-primary)" : "var(--text-secondary)",
                boxShadow: activeView === "annotated" ? "var(--shadow-xs)" : "none",
                fontWeight: activeView === "annotated" ? 600 : 500,
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap"
              }}
            >
              <Layers size={13} />
              <span>Mask</span>
            </button>

            <button
              id="view-original-btn"
              onClick={() => setActiveView("original")}
              className="btn btn-sm"
              style={{
                background: activeView === "original" ? "var(--bg-surface)" : "transparent",
                color: activeView === "original" ? "var(--accent-primary)" : "var(--text-secondary)",
                boxShadow: activeView === "original" ? "var(--shadow-xs)" : "none",
                fontWeight: activeView === "original" ? 600 : 500,
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap"
              }}
            >
              <Eye size={13} />
              <span>Original</span>
            </button>

            <button
              id="view-split-btn"
              onClick={() => setActiveView("split")}
              className="btn btn-sm"
              style={{
                background: activeView === "split" ? "var(--bg-surface)" : "transparent",
                color: activeView === "split" ? "var(--accent-primary)" : "var(--text-secondary)",
                boxShadow: activeView === "split" ? "var(--shadow-xs)" : "none",
                fontWeight: activeView === "split" ? 600 : 500,
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap"
              }}
            >
              <Columns size={13} />
              <span>Side-by-Side</span>
            </button>
          </div>

          <button
            id="btn-download-annotated"
            onClick={downloadAnnotatedImage}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 500, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            title="Download annotated image"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Content: Visualizer & Detection List */}
      <div className="prediction-grid">
        
        {/* Visualizer Frame */}
        <div className="card" style={{ padding: "1.25rem", overflow: "hidden" }}>
          {activeView === "split" ? (
            <div className="split-view-grid">
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Original Image
                </div>
                <img
                  src={originalUrl}
                  alt="Original"
                  style={{ width: "100%", height: "auto", borderRadius: "6px", objectFit: "contain", border: "1px solid var(--border-subtle)" }}
                />
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
                  YOLOv8 Segmentation
                </div>
                <img
                  src={annotated_image}
                  alt="Annotated Prediction"
                  style={{ width: "100%", height: "auto", borderRadius: "6px", objectFit: "contain", border: "1px solid var(--border-subtle)" }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "380px",
              background: "#0F172A",
              borderRadius: "6px",
              overflow: "hidden",
            }}>
              <img
                id="display-result-image"
                src={activeView === "annotated" ? annotated_image : originalUrl}
                alt="Prediction Result"
                style={{
                  maxWidth: "100%",
                  maxHeight: "540px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}
        </div>

        {/* Detections Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Detected Hand Tools ({total_detections})
            </h3>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)"
            }}>
              Instance Segmentation
            </span>
          </div>

          {detections.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                backgroundColor: "var(--bg-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <AlertCircle size={28} color="var(--warning)" style={{ margin: "0 auto 0.5rem auto" }} />
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>No Tools Detected</div>
              <div style={{ fontSize: "0.825rem", marginTop: "0.25rem" }}>
                Lower the confidence threshold or provide an image with higher lighting and clearer tool boundaries.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
              {detections.map((det, idx) => (
                <DetectionCard key={idx} detection={det} index={idx} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
