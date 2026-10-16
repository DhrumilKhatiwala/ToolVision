import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Award, Layers, Clock, ZoomIn, X, Search, Activity, Image as ImageIcon } from "lucide-react";
import { fetchMetrics, fetchModelInfo, getMetricImageUrl } from "../utils/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeArtifactTab, setActiveArtifactTab] = useState("confusion_matrix_normalized.png");
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [m, info] = await Promise.all([fetchMetrics(), fetchModelInfo()]);
        if (isMounted) {
          setMetrics(m);
          setModelInfo(info);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "6rem 1rem" }}>
        <div className="spinner spinner-indigo" style={{ width: 36, height: 36, margin: "0 auto 1.25rem auto" }} />
        <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Loading Model Analytics & Metrics...</div>
      </div>
    );
  }

  const records = metrics?.records || [];

  // Technical category grouping
  const getToolCategory = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("hammer")) return "Striking Tools";
    if (n.includes("wrench") || n.includes("spanner") || n.includes("ratchet")) return "Wrenches & Spanners";
    if (n.includes("pliers")) return "Pliers & Gripping";
    if (n.includes("saw") || n.includes("knife")) return "Cutting Tools";
    if (n.includes("caliper") || n.includes("measure")) return "Precision Gauging";
    if (n.includes("drill") || n.includes("screwdriver") || n.includes("gun")) return "Fastening & Power";
    return "Auxiliary & Ergonomics";
  };

  const classesList = modelInfo?.classes ? Object.entries(modelInfo.classes).map(([id, name]) => {
    return { id: parseInt(id), name, category: getToolCategory(name) };
  }) : [];

  const filteredClasses = classesList.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "all" || c.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Render SVG Line Chart for loss curves
  const renderLossChart = () => {
    if (records.length === 0) return <div>No training records available.</div>;

    const width = 560;
    const height = 240;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };

    const maxLoss = Math.max(
      ...records.map(r => Math.max(r.train_box_loss || 0, r.train_seg_loss || 0, r.val_box_loss || 0, r.val_seg_loss || 0))
    ) * 1.1 || 2.5;

    const scaleX = (epoch) => padding.left + ((epoch - 1) / (records.length - 1)) * (width - padding.left - padding.right);
    const scaleY = (val) => height - padding.bottom - (val / maxLoss) * (height - padding.top - padding.bottom);

    const makePath = (key) => {
      return records
        .map((r, i) => {
          const x = scaleX(r.epoch);
          const y = scaleY(r[key] || 0);
          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        {/* Y Axis Grid lines */}
        {[0, 0.5, 1.0, 1.5, 2.0].map((v) => {
          if (v > maxLoss) return null;
          const y = scaleY(v);
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} fontSize="10" fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">{v.toFixed(1)}</text>
            </g>
          );
        })}

        {/* X Axis labels */}
        {records.filter(r => r.epoch === 1 || r.epoch % 3 === 0 || r.epoch === records.length).map(r => (
          <text key={r.epoch} x={scaleX(r.epoch)} y={height - 8} fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontFamily="var(--font-mono)">
            Ep {r.epoch}
          </text>
        ))}

        {/* Lines */}
        <path d={makePath("train_box_loss")} fill="none" stroke="#4F46E5" strokeWidth="2.5" />
        <path d={makePath("train_seg_loss")} fill="none" stroke="#0EA5E9" strokeWidth="2.5" />
        <path d={makePath("val_box_loss")} fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={makePath("val_seg_loss")} fill="none" stroke="#0EA5E9" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    );
  };

  // Render SVG Line Chart for mAP metric curves
  const renderMapChart = () => {
    if (records.length === 0) return null;

    const width = 560;
    const height = 240;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };

    const scaleX = (epoch) => padding.left + ((epoch - 1) / (records.length - 1)) * (width - padding.left - padding.right);
    const scaleY = (val) => height - padding.bottom - (val / 1.0) * (height - padding.top - padding.bottom);

    const makePath = (key) => {
      return records
        .map((r, i) => {
          const x = scaleX(r.epoch);
          const y = scaleY(r[key] || 0);
          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
    };

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
          const y = scaleY(v);
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} fontSize="10" fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">{(v * 100).toFixed(0)}%</text>
            </g>
          );
        })}

        {records.filter(r => r.epoch === 1 || r.epoch % 3 === 0 || r.epoch === records.length).map(r => (
          <text key={r.epoch} x={scaleX(r.epoch)} y={height - 8} fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontFamily="var(--font-mono)">
            Ep {r.epoch}
          </text>
        ))}

        <path d={makePath("metrics_mAP50_b")} fill="none" stroke="#10B981" strokeWidth="2.5" />
        <path d={makePath("metrics_mAP50_95_b")} fill="none" stroke="#6366F1" strokeWidth="2.5" />
        <path d={makePath("metrics_mAP50_m")} fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={makePath("metrics_mAP50_95_m")} fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    );
  };

  const artifactTabs = [
    { id: "confusion_matrix_normalized.png", label: "Confusion Matrix (Norm)" },
    { id: "confusion_matrix.png", label: "Confusion Matrix (Raw)" },
    { id: "results.png", label: "Training History" },
    { id: "BoxPR_curve.png", label: "Box PR Curve" },
    { id: "MaskPR_curve.png", label: "Mask PR Curve" },
    { id: "val_batch0_pred.jpg", label: "Validation Predictions" },
  ];

  return (
    <div className="container" style={{ padding: "3rem 1.5rem 5rem 1.5rem" }}>
      
      {/* Title */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--accent-primary)",
          backgroundColor: "var(--bg-accent-subtle)",
          border: "1px solid var(--bg-accent-muted)",
          padding: "0.2rem 0.6rem",
          borderRadius: "4px",
          marginBottom: "0.5rem"
        }}>
          <Activity size={12} />
          <span>Evaluation Metrics</span>
        </div>
        <h1 style={{ fontSize: "2.25rem", letterSpacing: "-0.03em", marginBottom: "0.5rem", fontWeight: 800 }}>
          Model Analytics & Benchmarks
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
          Validation loss convergence curves, precision metrics, confusion matrix, and class taxonomy for YOLOv8n-seg.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        
        {/* KPI 1 */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Best mAP@50
            </span>
            <Award size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            {(metrics?.best_map50 * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 500, marginTop: "0.25rem" }}>
            Boundary segmentation benchmark
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Best mAP@50-95
            </span>
            <TrendingUp size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            {(metrics?.best_map50_95 * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--accent-primary)", fontWeight: 500, marginTop: "0.25rem" }}>
            COCO standard strict threshold
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Training Epochs
            </span>
            <Clock size={16} color="#0EA5E9" />
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            {metrics?.final_epoch || 15}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            15 epochs completed
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Tool Categories
            </span>
            <Layers size={16} color="#6366F1" />
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            {modelInfo?.num_classes || 18}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Roboflow modified dataset
          </div>
        </div>

      </div>

      {/* SVG Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
        
        {/* Loss Convergence Chart */}
        <div className="card" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                Loss Convergence
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Bounding box and segmentation loss</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", fontWeight: 600 }}>
              <span style={{ color: "#4F46E5" }}>■ Box Loss</span>
              <span style={{ color: "#0EA5E9" }}>■ Seg Loss</span>
            </div>
          </div>
          {renderLossChart()}
        </div>

        {/* mAP Metrics Chart */}
        <div className="card" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                Mean Average Precision
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>mAP metric curves across 15 epochs</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", fontWeight: 600 }}>
              <span style={{ color: "#10B981" }}>■ mAP@50</span>
              <span style={{ color: "#6366F1" }}>■ mAP@50-95</span>
            </div>
          </div>
          {renderMapChart()}
        </div>

      </div>

      {/* Evaluation Artifacts Viewer */}
      <div className="card" style={{ padding: "1.75rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              Model Evaluation Artifacts
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              High-resolution evaluation plots generated during model validation.
            </p>
          </div>

          {/* Artifact Tabs */}
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", backgroundColor: "var(--bg-subtle)", padding: "0.25rem", borderRadius: "6px" }}>
            {artifactTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveArtifactTab(tab.id)}
                className="btn btn-sm"
                style={{
                  background: activeArtifactTab === tab.id ? "var(--bg-surface)" : "transparent",
                  color: activeArtifactTab === tab.id ? "var(--accent-primary)" : "var(--text-secondary)",
                  boxShadow: activeArtifactTab === tab.id ? "var(--shadow-xs)" : "none",
                  fontWeight: activeArtifactTab === tab.id ? 600 : 500,
                  fontSize: "0.78rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "4px"
                }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Artifact Image Container */}
        <div
          style={{
            position: "relative",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "6px",
            padding: "1.5rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "440px",
            cursor: "pointer",
          }}
          onClick={() => setSelectedImageModal(getMetricImageUrl(activeArtifactTab))}
          title="Click to view full size"
        >
          <img
            src={getMetricImageUrl(activeArtifactTab)}
            alt={activeArtifactTab}
            style={{
              maxWidth: "100%",
              maxHeight: "560px",
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "1.25rem",
              right: "1.25rem",
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              color: "#FFF",
              padding: "0.35rem 0.75rem",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.78rem",
              fontWeight: 500,
              backdropFilter: "blur(4px)",
            }}
          >
            <ZoomIn size={14} />
            <span>Enlarge</span>
          </div>
        </div>
      </div>

      {/* Hand Tool Classes Taxonomy */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              18 Hand Tool Taxonomy
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              Full classification directory recognized by the YOLOv8 instance segmentation model.
            </p>
          </div>

          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Filter tool categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                borderRadius: "6px",
                border: "1px solid var(--border-medium)",
                fontSize: "0.825rem",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Classes Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.75rem" }}>
          {filteredClasses.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "6px",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.925rem", color: "var(--text-primary)" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {item.category}
                </div>
              </div>
              <span style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--accent-primary)",
                backgroundColor: "var(--bg-surface)",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px",
                border: "1px solid var(--border-subtle)"
              }}>
                #{String(item.id).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              onClick={() => setSelectedImageModal(null)}
              className="btn btn-secondary btn-sm"
              style={{ position: "absolute", top: "-2.5rem", right: 0, color: "#FFF", backgroundColor: "rgba(255,255,255,0.2)", border: "none" }}
            >
              <X size={16} />
              <span>Close</span>
            </button>
            <img
              src={selectedImageModal}
              alt="Enlarged evaluation artifact"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "6px", boxShadow: "var(--shadow-xl)" }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
