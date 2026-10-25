# Live Event Biometric Gallery Platform

[![Category](https://img.shields.io/badge/Category-Full--Stack%20%26%20Edge%20CV-gold)](https://framesbyhithu.pages.dev)
[![Deployment](https://img.shields.io/badge/Live-Cloudflare%20Pages-orange)](https://framesbyhithu.pages.dev)
[![Privacy](https://img.shields.io/badge/Privacy-Zero--Server%20Biometrics-emerald)](https://framesbyhithu.pages.dev)

High-throughput live event photography platform featuring client-side 128D facial descriptor extraction, zero-server biometric compute, and instant vector search across thousands of event captures.

---

## 🌐 Live Production Deployment

- **Live URL:** [https://framesbyhithu.pages.dev](https://framesbyhithu.pages.dev)
- **Architectural Showcase Page:** View `showcase.html` for technical breakdowns and benchmarks.

---

## 🎯 Key Engineering Metrics

- **128D Client-Side Vector Extraction:** Facial landmarks and deep descriptor vectors generated directly in the browser via WebAssembly.
- **$0 / 0 ms Server Compute Overhead:** Zero cloud GPU or server inference needed for guest face-matching.
- **Sub-200ms Instant Match Search:** High-performance cosine distance comparison across thousands of event photographs in dedicated Web Workers.
- **100% Privacy by Design:** Conforms strictly to GDPR Article 9; guest selfie imagery is processed in memory and never transmitted to backend servers.

---

## 🏗️ Architecture & Processing Flow

```
[ Attendee Browser ]
       │
       ▼
[ Camera Capture via HTML5 MediaDevices ]
       │
       ▼
[ Web Worker: Face-API.js (WASM / WebGL) ] ➔ 128-Dimensional Probe Vector
       │
       ▼
[ Client-Side Cosine Distance Matrix Comparison ] ➔ Threshold Distance < 0.45
       │
       ▼
[ Instant Filtered Photo Masonry Grid Rendered ]
```

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for Cloudflare Pages
npm run build
```
