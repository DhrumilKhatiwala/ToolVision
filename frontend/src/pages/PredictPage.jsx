import React, { useState } from "react";
import { Sliders, Play, AlertCircle, Zap, Target, Layers, CheckCircle2 } from "lucide-react";
import ImageUploader from "../components/ImageUploader";
import PredictionView from "../components/PredictionView";
import { predictTool } from "../utils/api";

export default function PredictPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPredictionResult(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPredictionResult(null);
    setErrorMessage(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await predictTool(selectedFile, confidence);
      setPredictionResult(result);
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred during tool detection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: "5rem" }}>
      {/* Professional Hero Section */}
      <section style={{ textAlign: "center", padding: "3.5rem 1.5rem 2.25rem 1.5rem" }}>
        {/* Technical Chips */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--accent-primary)",
            backgroundColor: "var(--bg-accent-subtle)",
            border: "1px solid var(--bg-accent-muted)",
            padding: "0.25rem 0.65rem",
            borderRadius: "4px"
          }}>
            <Zap size={12} />
            <span>YOLOv8 Instance Segmentation</span>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--success)",
            backgroundColor: "var(--success-bg)",
            border: "1px solid var(--success-border)",
            padding: "0.25rem 0.65rem",
            borderRadius: "4px"
          }}>
            <Target size={12} />
            <span>80.0% mAP@50 Benchmark</span>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-subtle)",
            padding: "0.25rem 0.65rem",
            borderRadius: "4px"
          }}>
            <Layers size={12} />
            <span>18 Tool Categories</span>
          </div>
        </div>

        <h1 style={{ fontSize: "2.85rem", letterSpacing: "-0.03em", marginBottom: "0.75rem", fontWeight: 800, lineHeight: 1.15, color: "var(--text-primary)" }}>
          Hand Tool Detection & Segmentation
        </h1>

        <p style={{ maxWidth: "680px", margin: "0 auto", color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6 }}>
          Automated computer vision system for industrial tool localization and sub-pixel polygon boundary extraction using fine-tuned deep learning models.
        </p>
      </section>

      {/* Main Studio Container */}
      <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Error Alert */}
        {errorMessage && (
          <div
            className="animate-fade-in"
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "6px",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.9rem"
            }}
          >
            <AlertCircle size={18} />
            <div style={{ flex: 1 }}>{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="btn btn-sm"
              style={{ background: "transparent", color: "var(--danger)", border: "none" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload & Inference Controls Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 0.9fr", gap: "1.5rem", alignItems: "stretch" }}>
          
          {/* Left: Uploader */}
          <ImageUploader
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onSelectFile={handleSelectFile}
            onClear={handleClear}
            isLoading={isLoading}
          />

          {/* Right: Controls & Parameters */}
          <div className="card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sliders size={18} color="var(--accent-primary)" />
                  <span>Inference Parameters</span>
                </h3>
                <span style={{
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  padding: "0.15rem 0.45rem",
                  borderRadius: "4px",
                  backgroundColor: "var(--bg-subtle)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)"
                }}>
                  YOLOv8n-seg
                </span>
              </div>

              {/* Confidence Threshold Slider */}
              <div className="slider-container" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="conf-slider" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    Confidence Threshold
                  </label>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: "var(--accent-primary)",
                      backgroundColor: "var(--bg-accent-subtle)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      border: "1px solid var(--bg-accent-muted)"
                    }}
                  >
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
                
                <input
                  id="conf-slider"
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="slider-track"
                  disabled={isLoading}
                />
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Presets:
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setConfidence(0.15)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.3rem 0.65rem",
                      border: confidence === 0.15 ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                      background: confidence === 0.15 ? "var(--bg-accent-subtle)" : "var(--bg-surface)",
                      color: confidence === 0.15 ? "var(--accent-primary)" : "var(--text-secondary)",
                      fontWeight: confidence === 0.15 ? 600 : 500,
                      borderRadius: "4px"
                    }}
                  >
                    0.15 (High Recall)
                  </button>
                  <button
                    onClick={() => setConfidence(0.25)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.3rem 0.65rem",
                      border: confidence === 0.25 ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                      background: confidence === 0.25 ? "var(--bg-accent-subtle)" : "var(--bg-surface)",
                      color: confidence === 0.25 ? "var(--accent-primary)" : "var(--text-secondary)",
                      fontWeight: confidence === 0.25 ? 600 : 500,
                      borderRadius: "4px"
                    }}
                  >
                    0.25 (Balanced)
                  </button>
                  <button
                    onClick={() => setConfidence(0.50)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.3rem 0.65rem",
                      border: confidence === 0.50 ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                      background: confidence === 0.50 ? "var(--bg-accent-subtle)" : "var(--bg-surface)",
                      color: confidence === 0.50 ? "var(--accent-primary)" : "var(--text-secondary)",
                      fontWeight: confidence === 0.50 ? 600 : 500,
                      borderRadius: "4px"
                    }}
                  >
                    0.50 (High Precision)
                  </button>
                </div>
              </div>

              {/* Model Specs Card */}
              <div style={{
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "6px",
                padding: "0.85rem 1rem",
                fontSize: "0.8rem",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem"
              }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Pipeline Capabilities:
                </div>
                <div style={{ color: "var(--text-secondary)" }}>• Sub-pixel contour polygon mask extraction</div>
                <div style={{ color: "var(--text-secondary)" }}>• Bounding box localization: [x1, y1, x2, y2]</div>
                <div style={{ color: "var(--text-secondary)" }}>• 18 Specialized hand tool classes</div>
              </div>
            </div>

            {/* Run Button */}
            <div style={{ marginTop: "1.75rem" }}>
              <button
                id="btn-run-inference"
                onClick={handlePredict}
                disabled={!selectedFile || isLoading}
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                  fontSize: "0.975rem",
                  padding: "0.85rem 1.5rem",
                  borderRadius: "6px"
                }}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    <span>Processing Inference...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Run Tool Detection</span>
                  </>
                )}
              </button>
              {!selectedFile && (
                <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Select an image or choose one of the benchmark samples
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Prediction Results Visualizer */}
        {predictionResult && (
          <div style={{ marginTop: "1rem" }}>
            <PredictionView
              predictionResult={predictionResult}
              originalUrl={previewUrl}
            />
          </div>
        )}

      </div>
    </div>
  );
}
