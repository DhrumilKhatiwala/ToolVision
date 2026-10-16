import React, { useState } from "react";
import { Crosshair, Layers, Copy, Check } from "lucide-react";

export default function DetectionCard({ detection, index }) {
  const [copied, setCopied] = useState(false);
  const confPercent = Math.round(detection.confidence * 100);

  // Confidence color badges
  const getConfMeta = (score) => {
    if (score >= 0.75) return { bg: "var(--success-bg)", text: "var(--success)", border: "var(--success-border)", label: "High Confidence" };
    if (score >= 0.45) return { bg: "var(--warning-bg)", text: "#D97706", border: "var(--warning-border)", label: "Moderate" };
    return { bg: "var(--bg-subtle)", text: "var(--text-secondary)", border: "var(--border-subtle)", label: "Low" };
  };

  const confMeta = getConfMeta(detection.confidence);

  const copyBbox = () => {
    const text = `[${Math.round(detection.bbox.x1)}, ${Math.round(detection.bbox.y1)}, ${Math.round(detection.bbox.x2)}, ${Math.round(detection.bbox.y2)}]`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`detection-card-${index}`}
      className="card animate-fade-in"
      style={{
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        borderLeft: `3px solid ${confMeta.text}`,
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Header: Class Name, ID & Match Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--accent-primary)",
            backgroundColor: "var(--bg-accent-subtle)",
            border: "1px solid var(--bg-accent-muted)",
            padding: "0.15rem 0.45rem",
            borderRadius: "4px"
          }}>
            #{String(detection.class_id).padStart(2, '0')}
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.975rem", color: "var(--text-primary)" }}>
            {detection.class_name}
          </span>
        </div>

        <span
          style={{
            backgroundColor: confMeta.bg,
            color: confMeta.text,
            border: `1px solid ${confMeta.border}`,
            fontWeight: 600,
            fontSize: "0.75rem",
            padding: "0.2rem 0.55rem",
            borderRadius: "4px",
            fontFamily: "var(--font-mono)"
          }}
        >
          {confPercent}%
        </span>
      </div>

      {/* Confidence Bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
          <span>Score</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {detection.confidence.toFixed(4)}
          </span>
        </div>
        <div style={{ height: "4px", width: "100%", backgroundColor: "var(--border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${confPercent}%`,
              backgroundColor: confMeta.text,
              borderRadius: "2px",
              transition: "width 0.4s ease-out",
            }}
          />
        </div>
      </div>

      {/* Bounding Box Info */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.35rem",
        backgroundColor: "var(--bg-subtle)",
        padding: "0.45rem 0.65rem",
        borderRadius: "4px",
        fontSize: "0.75rem",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-mono)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <Crosshair size={12} color="var(--accent-primary)" />
          <span>[{Math.round(detection.bbox.x1)}, {Math.round(detection.bbox.y1)}, {Math.round(detection.bbox.x2)}, {Math.round(detection.bbox.y2)}]</span>
        </div>

        <button
          onClick={copyBbox}
          className="btn btn-sm"
          style={{
            padding: "0.15rem 0.4rem",
            background: copied ? "var(--success-bg)" : "transparent",
            color: copied ? "var(--success)" : "var(--text-secondary)",
            border: "none",
            cursor: "pointer",
            fontSize: "0.7rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
          title="Copy bounding box coordinates"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
