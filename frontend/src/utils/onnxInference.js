import * as ort from "onnxruntime-web";

if (typeof window !== "undefined") {
  ort.env.wasm.numThreads = 1;
  // Use jsdelivr CDN to prevent Vite dev server from intercepting wasm/mjs helper modules
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
}

export const TOOL_CLASSES = {
  0: "search-for-tools",
  1: "Adjustable spanner",
  2: "Backsaw",
  3: "Calipers",
  4: "Cutting pliers",
  5: "Drill",
  6: "Gas wrench",
  7: "Gun",
  8: "Hammer",
  9: "Hand",
  10: "Handsaw",
  11: "Needle-nose pliers",
  12: "Pliers",
  13: "Ratchet",
  14: "Screwdriver",
  15: "Tape measure",
  16: "Utility knife",
  17: "Wrench",
};

// Colors for overlaying tool detections
const CLASS_COLORS = [
  "#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16", "#0EA5E9",
  "#A855F7", "#D946EF", "#EAB308", "#22C55E", "#3B82F6", "#64748B",
];

let sessionInstance = null;
let isSessionLoading = false;

/**
 * Initializes or returns cached ONNX InferenceSession for YOLOv8n-seg
 */
export async function getOnnxSession() {
  if (sessionInstance) return sessionInstance;
  if (isSessionLoading) {
    while (isSessionLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return sessionInstance;
  }

  try {
    isSessionLoading = true;
    console.log("[ToolVision ONNX] Loading YOLOv8n-seg model into browser memory...");
    sessionInstance = await ort.InferenceSession.create("/model/best.onnx", {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    console.log("[ToolVision ONNX] Model loaded successfully!");
    return sessionInstance;
  } catch (err) {
    console.error("[ToolVision ONNX] Error loading model:", err);
    throw new Error(`Failed to load in-browser ONNX model: ${err.message}`);
  } finally {
    isSessionLoading = false;
  }
}

/**
 * Preprocesses an image to [1, 3, 640, 640] normalized Float32Array tensor
 */
function preprocessImage(imgElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Draw scaled image to 640x640
  ctx.drawImage(imgElement, 0, 0, 640, 640);
  const imgData = ctx.getImageData(0, 0, 640, 640);
  const data = imgData.data;

  const float32Data = new Float32Array(3 * 640 * 640);
  const channelSize = 640 * 640;

  for (let i = 0; i < channelSize; i++) {
    const idx = i * 4;
    float32Data[i] = data[idx] / 255.0;                      // Red
    float32Data[channelSize + i] = data[idx + 1] / 255.0;    // Green
    float32Data[channelSize * 2 + i] = data[idx + 2] / 255.0;// Blue
  }

  return new ort.Tensor("float32", float32Data, [1, 3, 640, 640]);
}

/**
 * Calculate Intersection Over Union (IoU)
 */
function calculateIoU(box1, box2) {
  const x1 = Math.max(box1.x1, box2.x1);
  const y1 = Math.max(box1.y1, box2.y1);
  const x2 = Math.min(box1.x2, box2.x2);
  const y2 = Math.min(box1.y2, box2.y2);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area1 = (box1.x2 - box1.x1) * (box1.y2 - box1.y1);
  const area2 = (box2.x2 - box2.x1) * (box2.y2 - box2.y1);
  const union = area1 + area2 - intersection;

  return union <= 0 ? 0 : intersection / union;
}

/**
 * Non-Maximum Suppression (NMS)
 */
function nonMaxSuppression(candidates, iouThreshold = 0.45) {
  candidates.sort((a, b) => b.confidence - a.confidence);
  const selected = [];

  for (const current of candidates) {
    let keep = true;
    for (const chosen of selected) {
      if (current.class_id === chosen.class_id) {
        if (calculateIoU(current.bbox, chosen.bbox) > iouThreshold) {
          keep = false;
          break;
        }
      }
    }
    if (keep) {
      selected.push(current);
    }
  }

  return selected;
}

/**
 * Run end-to-end client-side YOLOv8 segmentation inference
 */
export async function predictToolOnnx(fileOrBlob, confThreshold = 0.25) {
  const session = await getOnnxSession();

  // Load image into HTML Image object
  const imgUrl = URL.createObjectURL(fileOrBlob);
  const imgElement = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imgUrl;
  });

  const origW = imgElement.naturalWidth || imgElement.width;
  const origH = imgElement.naturalHeight || imgElement.height;
  const scaleX = origW / 640;
  const scaleY = origH / 640;

  const startTime = performance.now();

  // Preprocess
  const inputTensor = preprocessImage(imgElement);

  // Run model inference
  const results = await session.run({ images: inputTensor });
  const latency = Math.round((performance.now() - startTime) * 100) / 100;

  // output0: [1, 54, 8400]
  // output1: [1, 32, 160, 160] (prototypes)
  const output0 = results["output0"] || Object.values(results)[0];
  const output1 = results["output1"] || Object.values(results)[1];

  const data0 = output0.data;
  const numChannels = 54;
  const numAnchors = 8400;

  const rawCandidates = [];

  for (let anchor = 0; anchor < numAnchors; anchor++) {
    // Find best class score among 18 classes (indices 4..21)
    let maxScore = 0;
    let bestClass = 0;

    for (let c = 0; c < 18; c++) {
      const score = data0[(4 + c) * numAnchors + anchor];
      if (score > maxScore) {
        maxScore = score;
        bestClass = c;
      }
    }

    if (maxScore >= confThreshold) {
      const cx = data0[0 * numAnchors + anchor];
      const cy = data0[1 * numAnchors + anchor];
      const w = data0[2 * numAnchors + anchor];
      const h = data0[3 * numAnchors + anchor];

      // Convert to bounding box in original image coordinates
      const x1 = Math.max(0, (cx - w / 2) * scaleX);
      const y1 = Math.max(0, (cy - h / 2) * scaleY);
      const x2 = Math.min(origW, (cx + w / 2) * scaleX);
      const y2 = Math.min(origH, (cy + h / 2) * scaleY);

      // Extract 32 mask coefficients (indices 22..53)
      const maskCoeffs = new Float32Array(32);
      for (let m = 0; m < 32; m++) {
        maskCoeffs[m] = data0[(22 + m) * numAnchors + anchor];
      }

      rawCandidates.push({
        class_id: bestClass,
        class_name: TOOL_CLASSES[bestClass] || `Tool-${bestClass}`,
        confidence: Math.round(maxScore * 10000) / 10000,
        bbox: {
          x1: Math.round(x1),
          y1: Math.round(y1),
          x2: Math.round(x2),
          y2: Math.round(y2),
        },
        maskCoeffs,
      });
    }
  }

  // Filter with Non-Maximum Suppression
  const detections = nonMaxSuppression(rawCandidates, 0.45);

  // Generate Annotated Result Canvas
  const outCanvas = document.createElement("canvas");
  outCanvas.width = origW;
  outCanvas.height = origH;
  const outCtx = outCanvas.getContext("2d");

  // Draw original image
  outCtx.drawImage(imgElement, 0, 0);

  // Decode segmentation masks if prototype masks exist
  if (output1 && output1.data && detections.length > 0) {
    const protoData = output1.data; // [32, 160, 160]
    const protoH = 160;
    const protoW = 160;
    const planeSize = protoH * protoW;

    for (const det of detections) {
      const color = CLASS_COLORS[det.class_id % CLASS_COLORS.length];
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = protoW;
      maskCanvas.height = protoH;
      const maskCtx = maskCanvas.getContext("2d");
      const maskImgData = maskCtx.createImageData(protoW, protoH);
      const d = maskImgData.data;

      // Parse RGB from hex
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      // Multiply prototype masks with coefficients (ultra-fast vector dot product)
      const maskCoeffs = det.maskCoeffs;
      for (let p = 0; p < planeSize; p++) {
        let sum = 0;
        for (let m = 0; m < 32; m++) {
          sum += maskCoeffs[m] * protoData[m * planeSize + p];
        }
        // Mathematically: sigmoid(sum) > 0.5 is exactly equivalent to sum > 0
        const idx = p * 4;
        if (sum > 0) {
          d[idx] = r;
          d[idx + 1] = g;
          d[idx + 2] = b;
          d[idx + 3] = 115; // Semi-transparent overlay
        } else {
          d[idx + 3] = 0;
        }
      }

      maskCtx.putImageData(maskImgData, 0, 0);

      // Crop mask strictly to bounding box
      outCtx.save();
      outCtx.beginPath();
      outCtx.rect(det.bbox.x1, det.bbox.y1, det.bbox.x2 - det.bbox.x1, det.bbox.y2 - det.bbox.y1);
      outCtx.clip();
      outCtx.drawImage(maskCanvas, 0, 0, origW, origH);
      outCtx.restore();
    }
  }

  // Draw Bounding Boxes and Labels
  for (const det of detections) {
    const color = CLASS_COLORS[det.class_id % CLASS_COLORS.length];
    const bw = det.bbox.x2 - det.bbox.x1;
    const bh = det.bbox.y2 - det.bbox.y1;

    // Box stroke
    outCtx.strokeStyle = color;
    outCtx.lineWidth = Math.max(2, Math.round(origW / 280));
    outCtx.strokeRect(det.bbox.x1, det.bbox.y1, bw, bh);

    // Label tag
    const labelText = `${det.class_name} ${Math.round(det.confidence * 100)}%`;
    outCtx.font = `bold ${Math.max(12, Math.round(origW / 45))}px Inter, sans-serif`;
    const textWidth = outCtx.measureText(labelText).width;
    const tagHeight = Math.max(18, Math.round(origW / 35));

    outCtx.fillStyle = color;
    outCtx.fillRect(det.bbox.x1, Math.max(0, det.bbox.y1 - tagHeight), textWidth + 10, tagHeight);

    outCtx.fillStyle = "#FFFFFF";
    outCtx.fillText(labelText, det.bbox.x1 + 5, Math.max(tagHeight - 4, det.bbox.y1 - 4));
  }

  const annotatedBase64 = outCanvas.toDataURL("image/jpeg", 0.92);
  URL.revokeObjectURL(imgUrl);

  return {
    detections: detections.map((d) => ({
      class_id: d.class_id,
      class_name: d.class_name,
      confidence: d.confidence,
      bbox: d.bbox,
      mask: { points: [], area: null },
    })),
    total_detections: detections.length,
    image_width: origW,
    image_height: origH,
    inference_time_ms: latency,
    annotated_image: annotatedBase64,
    engine: "ONNX Runtime Web (In-Browser Client)",
  };
}
