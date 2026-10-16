import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Wrench, Hammer, Scissors, Sparkles, FolderUp } from "lucide-react";

export default function ImageUploader({ selectedFile, previewUrl, onSelectFile, onClear, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onSelectFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onSelectFile(e.target.files[0]);
    }
  };

  // Load real benchmark evaluation photos
  const loadSampleImage = async (toolType) => {
    try {
      const response = await fetch(`/samples/sample_${toolType}.jpg`);
      if (!response.ok) {
        throw new Error(`Failed to load ${toolType} sample image`);
      }
      const blob = await response.blob();
      const file = new File([blob], `sample_${toolType}.jpg`, { type: "image/jpeg" });
      onSelectFile(file);
    } catch (err) {
      console.error("Error loading sample image from /samples/:", err);
      // Fallback: fetch from backend /api/samples/ endpoint
      try {
        const apiRes = await fetch(`/api/samples/${toolType}`);
        const apiBlob = await apiRes.blob();
        const apiFile = new File([apiBlob], `sample_${toolType}.jpg`, { type: "image/jpeg" });
        onSelectFile(apiFile);
      } catch (fallbackErr) {
        console.error("Fallback error loading sample image:", fallbackErr);
      }
    }
  };


  return (
    <div className="card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ImageIcon size={18} color="var(--accent-primary)" />
            <span>Image Input</span>
          </h3>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Upload high-resolution photography or select a benchmark sample
          </p>
        </div>
        {previewUrl && (
          <button 
            id="btn-clear-image"
            onClick={onClear} 
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Modernized Dropzone */}
      <div
        id="image-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${isDragging ? "var(--accent-primary)" : "var(--border-medium)"}`,
          borderRadius: "8px",
          backgroundColor: isDragging ? "var(--bg-accent-subtle)" : previewUrl ? "#FFFFFF" : "var(--bg-subtle)",
          padding: previewUrl ? "1.25rem" : "3rem 1.5rem",
          textAlign: "center",
          cursor: previewUrl ? "default" : "pointer",
          transition: "all var(--transition-normal)",
          position: "relative",
          minHeight: "280px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input
          ref={fileInputRef}
          id="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {previewUrl ? (
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "380px" }}>
            <img
              id="upload-preview-img"
              src={previewUrl}
              alt="Upload Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "330px",
                borderRadius: "6px",
                boxShadow: "var(--shadow-sm)",
                objectFit: "contain",
                border: "1px solid var(--border-subtle)"
              }}
            />
            <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <span style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)"
              }}>
                {selectedFile?.name}
              </span>
              <span style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)"
              }}>
                {(selectedFile?.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "10px",
              background: "var(--bg-surface)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-xs)"
            }}>
              <FolderUp size={28} />
            </div>
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>
              Drag and drop tool image here
            </div>
            <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Supported formats: JPEG, PNG, WebP (Max 10 MB)
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <span className="btn btn-secondary btn-sm" style={{ pointerEvents: "none", fontWeight: 500, fontSize: "0.8rem" }}>
                Select File
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Preset Sample Buttons */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
          Benchmark Evaluation Samples:
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
          <button
            id="sample-hammer-btn"
            onClick={() => loadSampleImage("hammer")}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            style={{ justifyContent: "center", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
          >
            <Hammer size={14} color="var(--text-secondary)" />
            <span>Claw Hammer</span>
          </button>
          <button
            id="sample-wrench-btn"
            onClick={() => loadSampleImage("wrench")}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            style={{ justifyContent: "center", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
          >
            <Wrench size={14} color="var(--text-secondary)" />
            <span>Spanner Wrench</span>
          </button>
          <button
            id="sample-pliers-btn"
            onClick={() => loadSampleImage("pliers")}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            style={{ justifyContent: "center", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
          >
            <Scissors size={14} color="var(--text-secondary)" />
            <span>Combination Pliers</span>
          </button>
          <button
            id="sample-screwdriver-btn"
            onClick={() => loadSampleImage("screwdriver")}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
            style={{ justifyContent: "center", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
          >
            <Wrench size={14} color="var(--text-secondary)" />
            <span>Screwdriver</span>
          </button>
        </div>
      </div>
    </div>
  );
}
