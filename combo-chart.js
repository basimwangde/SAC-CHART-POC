// (function () {
//   const CDN_CANDIDATES = [
//     "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js",
//     "https://unpkg.com/chart.js@4/dist/chart.umd.min.js"
//   ];

//   function loadScriptSequential(urls) {
//     return new Promise((resolve, reject) => {
//       if (window.Chart) return resolve();
//       const tryNext = (i) => {
//         if (i >= urls.length) return reject(new Error("All Chart.js URLs blocked or unreachable."));
//         const s = document.createElement("script");
//         s.src = urls[i];
//         s.onload = () => resolve();
//         s.onerror = () => { s.remove(); tryNext(i + 1); };
//         document.head.appendChild(s);
//       };
//       tryNext(0);
//     });
//   }

//   class PerciComboChart extends HTMLElement {
//     constructor() {
//       super();
//       this._shadow = this.attachShadow({ mode: "open" });

//       const container = document.createElement("div");
//       Object.assign(container.style, { width: "100%", height: "100%", display: "flex" });

//       this._canvas = document.createElement("canvas");
//       Object.assign(this._canvas.style, { width: "100%", height: "100%" });
//       container.appendChild(this._canvas);
//       this._shadow.appendChild(container);

//       this._chart = null;

//       // Fallback demo data (when nothing is bound)
//       this._demo = {
//         labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
//         bar:    [120, 150,  90, 180, 160, 200],
//         line:   [ 22,  25,  18,  27,  24,  30]
//       };

//       this._barLabel  = this.getAttribute("barlabel")  || "Revenue";
//       this._lineLabel = this.getAttribute("linelabel") || "Margin %";
//     }

//     // SAC will call this when properties change
//     set barLabel(v)  { this._barLabel = v;  this._render(); }
//     set lineLabel(v) { this._lineLabel = v; this._render(); }

//     connectedCallback() {
//       loadScriptSequential(CDN_CANDIDATES)
//         .then(() => this._render())
//         .catch(err => this._showError("Chart.js could not be loaded. Check CSP or host internally."));
//     }

//     // Called by SAC after data/properties are updated
//     onCustomWidgetAfterUpdate() {
//       this._render();
//     }

//     disconnectedCallback() { this._destroy(); }
//     onCustomWidgetResize() { if (this._chart?.resize) this._chart.resize(); }

//     _destroy() {
//       if (this._chart?.destroy) this._chart.destroy();
//       this._chart = null;
//     }

//     _showError(msg) {
//       this._shadow.innerHTML = `<div style="font:14px sans-serif;padding:8px;color:#b00020">${msg}</div>`;
//     }

//     // Build series from SAC binding ("main") if present; otherwise fallback
//     _extractDataFromBinding() {
//       const binding = this.main; // the name must match the key in dataBindings JSON
//       if (!binding || !binding.data || !Array.isArray(binding.data) || binding.data.length === 0) {
//         return {
//           labels: this._demo.labels,
//           bar: this._demo.bar,
//           line: this._demo.line,
//           barLabel: this._barLabel,
//           lineLabel: this._lineLabel
//         };
//       }

//       // Aliases are "dimensions_<index>" and "measures_<index>" per SAP docs.
//       // We take the first dimension for x-axis, measure[0] for bars, measure[1] for line.
//       const rows = binding.data;
//       const labels = [];
//       const bar = [];
//       const line = [];

//       // If only one measure is provided, we'll just show bars.
//       // const hasLine = rows.some(r => r["measures_1"] !== undefined);
//       const hasLine = rows.some(r =>
//         r["measures_1"] !== undefined && r["measures_1"] !== null
//       );


//       console.log ("Basim Test");
//       rows.forEach(r => {

//         //
//         const d = r["dimensions_0"] ? r["dimensions_0"].label : "";
//         if (d !== undefined) labels.push(String(d));
//         const m0 = r["measures_0"] ? Number(r["measures_0"].raw || r["measures_0"].label || r["measures_0"]) : null;
//         const m1 = r["measures_1"] ? Number(r["measures_1"].raw || r["measures_1"].label || r["measures_1"]) : null;
//         bar.push(m0 ?? 0);
//         if (hasLine) line.push(m1 ?? 0);
//       });

//       // Try to read nice series names from metadata; fallback to widget properties
//       let barLabel = this._barLabel;
//       let lineLabel = this._lineLabel;
//       try {
//         const ms = binding.metadata?.mainStructureMembers;
//         if (Array.isArray(ms) && ms[0]?.label) barLabel = ms[0].label;
//         if (Array.isArray(ms) && ms[1]?.label) lineLabel = ms[1].label;
//       } catch (e) { /* noop */ }

//       return { labels, bar, line, barLabel, lineLabel };
//     }

//     _render() {
//       if (!this._canvas || !window.Chart) return;

//       const { labels, bar, line, barLabel, lineLabel } = this._extractDataFromBinding();

//       this._destroy();
//       const ctx = this._canvas.getContext("2d");

//       const datasets = [
//         { type: "bar",  label: barLabel,  data: bar,  borderWidth: 1 }
//       ];
//       // if (line.length > 0)
//       if (Array.isArray(line) && line.length > 0){
//         datasets.push({ type: "line", label: lineLabel, data: line, yAxisID: "y1", tension: 0.3, pointRadius: 3 });
//       }

//       this._chart = new window.Chart(ctx, {
//         type: "bar",
//         data: { labels, datasets },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
//           interaction: { mode: "index", intersect: false },
//           scales: {
//             y:  { beginAtZero: true, title: { display: true, text: barLabel } },
//             y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false },
//                   ticks: { callback: (v) => `${v}%` }, title: { display: true, text: lineLabel } },
//             x:  { title: { display: true, text: "Category" } }
//           }
//         }
//       });
//     }
//   }

//   customElements.define("perci-combo-chart", PerciComboChart);
// })();


// (function () {
//   const CDN_CANDIDATES = [
//     "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js",
//     "https://unpkg.com/chart.js@4/dist/chart.umd.min.js"
//   ];

//   function loadScriptSequential(urls) {
//     return new Promise((resolve, reject) => {
//       if (window.Chart) return resolve();
//       const tryNext = (i) => {
//         if (i >= urls.length) return reject(new Error("All Chart.js URLs blocked or unreachable."));
//         const s = document.createElement("script");
//         s.src = urls[i];
//         s.onload = () => resolve();
//         s.onerror = () => { s.remove(); tryNext(i + 1); };
//         document.head.appendChild(s);
//       };
//       tryNext(0);
//     });
//   }

//   class PerciComboChart extends HTMLElement {
//     constructor() {
//       super();
//       this._shadow = this.attachShadow({ mode: "open" });

//       const container = document.createElement("div");
//       Object.assign(container.style, { width: "100%", height: "100%", display: "flex" });

//       this._canvas = document.createElement("canvas");
//       Object.assign(this._canvas.style, { width: "100%", height: "100%" });
//       container.appendChild(this._canvas);
//       this._shadow.appendChild(container);

//       this._chart = null;

//       // Hardcoded demo data
//       this._demo = {
//         labels: [
//           "15-Sep-25",
//           "16-Sep-25",
//           "17-Sep-25",
//           "18-Sep-25",
//           "19-Sep-25",
//           "20-Sep-25",
//           "21-Sep-25"
//         ],
//         daClearing:  [13.82, 12.16, 24.90,  7.49, 28.30, 68.11, 15.55],
//         octClearing: [ null, 27.98,  null,  null,  null,  null,  null],
//         decClearing: [ null,  null,  null,  null,  null, 30.45,  null],
//         daSpread:    [131,   127,   89,    68,   80,   96,   63],
//         octSpread:   [ null,  94,   null,  null,  null,  null, null],
//         decSpread:   [ null, null,  null,  null,  null, 98,  null]
//       };
//     }

//     connectedCallback() {
//       loadScriptSequential(CDN_CANDIDATES)
//         .then(() => this._render())
//         .catch(err => this._showError("Chart.js could not be loaded. Check CSP or host internally."));
//     }

//     disconnectedCallback() { this._destroy(); }
//     onCustomWidgetAfterUpdate() { this._render(); }
//     onCustomWidgetResize() { if (this._chart?.resize) this._chart.resize(); }

//     _destroy() {
//       if (this._chart?.destroy) this._chart.destroy();
//       this._chart = null;
//     }

//     _showError(msg) {
//       this._shadow.innerHTML = `<div style="font:14px sans-serif;padding:8px;color:#b00020">${msg}</div>`;
//     }

//     _render() {
//       if (!this._canvas || !window.Chart) return;

//       // For now ignore SAC binding and just use hardcoded demo
//       const d = this._demo;

//       this._destroy();
//       const ctx = this._canvas.getContext("2d");

//       this._chart = new window.Chart(ctx, {
//         type: "bar",
//         data: {
//           labels: d.labels,
//           datasets: [
//             // Bars – Clearing Prices
//             {
//               type: "bar",
//               label: "EL DA Clearing Price",
//               data: d.daClearing,
//               backgroundColor: "#1f77b4"
//             },
//             {
//               type: "bar",
//               label: "Oct ii Clearing Price",
//               data: d.octClearing,
//               backgroundColor: "#ff7f0e"
//             },
//             {
//               type: "bar",
//               label: "Dec i Clearing Price",
//               data: d.decClearing,
//               backgroundColor: "#9467bd"
//             },

//             // Lines – Spread Capture %
//             {
//               type: "line",
//               label: "EL DA Spread Capture %",
//               data: d.daSpread,
//               yAxisID: "y1",
//               borderColor: "#ff7f0e",
//               backgroundColor: "transparent",
//               tension: 0.3,
//               pointRadius: 3
//             },
//             {
//               type: "line",
//               label: "Oct ii Spread Capture %",
//               data: d.octSpread,
//               yAxisID: "y1",
//               borderColor: "#17becf",
//               backgroundColor: "transparent",
//               tension: 0.3,
//               pointRadius: 3
//             },
//             {
//               type: "line",
//               label: "Dec i Spread Capture %",
//               data: d.decSpread,
//               yAxisID: "y1",
//               borderColor: "#2ca02c",
//               backgroundColor: "transparent",
//               tension: 0.3,
//               pointRadius: 3
//             }
//           ]
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           interaction: { mode: "index", intersect: false },
//           plugins: {
//             legend: { position: "top" },
//             tooltip: { mode: "index", intersect: false }
//           },
//           scales: {
//             y: {
//               beginAtZero: true,
//               title: { display: true, text: "Clearing Price" }
//             },
//             y1: {
//               beginAtZero: true,
//               position: "right",
//               grid: { drawOnChartArea: false },
//               ticks: { callback: v => v + "%" },
//               title: { display: true, text: "Spread Capture %" }
//             },
//             x: {
//               title: { display: true, text: "Date" }
//             }
//           }
//         }
//       });
//     }
//   }

//   customElements.define("perci-combo-chart", PerciComboChart);
// })();

(function () {

  const CDN_CANDIDATES = [
    "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js",
    "https://unpkg.com/chart.js@4/dist/chart.umd.min.js"
  ];

  function loadScriptSequential(urls) {
    return new Promise((resolve, reject) => {
      if (window.Chart) return resolve();
      const tryNext = (i) => {
        if (i >= urls.length)
          return reject(new Error("All Chart.js URLs blocked or unreachable."));

        const s = document.createElement("script");
        s.src = urls[i];
        s.onload = () => resolve();
        s.onerror = () => {
          s.remove();
          tryNext(i + 1);
        };
        document.head.appendChild(s);
      };
      tryNext(0);
    });
  }

  class PerciComboChart extends HTMLElement {

    constructor() {
      super();

      this._shadow = this.attachShadow({ mode: "open" });

      const container = document.createElement("div");
      Object.assign(container.style, {
        width: "100%",
        height: "100%",
        display: "flex"
      });

      this._canvas = document.createElement("canvas");
      Object.assign(this._canvas.style, {
        width: "100%",
        height: "100%"
      });

      container.appendChild(this._canvas);
      this._shadow.appendChild(container);

      this._chart = null;

      // HARDCODED DEMO DATA 
      this._SourceData = {
        Products: ["Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Oct ii", "Dec i"],
        Date: ["15-Sep-25", "16-Sep-25", "17-Sep-25", "18-Sep-25", "19-Sep-25", "20-Sep-25", "21-Sep-25", "16-Sep-25", "20-Sep-25"],
        ProductCategory: ["Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Long Term", "Long Term"],
        ClearingPrice: [13.82, 12.16, 24.90, 7.49, 28.30, 68.11, 15.55, 27.98, 30.45],
        SpreadCapture: [131, 127, 89, 68, 80, 96, 63, 94, 98]
      };

      // build unique dates + product list + colors from source
      this._buildMetaFromSource();
    }

    _buildMetaFromSource() {
      const src = this._SourceData;

      // unique dates (first-seen order)
      const uniqueDates = Array.from(new Set(src.Date));

      // unique products
      const uniqueProducts = Array.from(new Set(src.Products));

      this._LabelData = { UniqueDate: uniqueDates };
      this._ProductListData = this._buildProductList(uniqueProducts);
    }

    _buildProductList(uniqueProducts) {
      // 25 base colors
      const baseColors = [
        "#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd",
        "#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf",
        "#393b79","#637939","#8c6d31","#843c39","#7b4173",
        "#3182bd","#e6550d","#31a354","#756bb1","#636363",
        "#9c9ede","#e7cb94","#ff9896","#c5b0d5","#c7c7c7"
      ];

      // bar colors ascending
      const barColor = uniqueProducts.map((_, i) =>
        baseColors[i % baseColors.length]
      );

      // line colors descending
      const lineColor = uniqueProducts.map((_, i) => {
        const idx = baseColors.length - 1 - (i % baseColors.length);
        return baseColors[idx];
      });

      return {
        Product: uniqueProducts,
        BarColour: barColor,
        LineColour: lineColor
      };
    }

    connectedCallback() {
      loadScriptSequential(CDN_CANDIDATES)
        .then(() => this._render())
        .catch(err =>
          this._showError("Chart.js could not be loaded. Check CSP or host internally.")
        );
    }

    disconnectedCallback() {
      this._destroy();
    }

    onCustomWidgetAfterUpdate() {
      // in future, you can refresh _SourceData here from binding,
      // then call this._buildMetaFromSource() and _render()
      this._render();
    }

    onCustomWidgetResize() {
      if (this._chart?.resize) this._chart.resize();
    }

    _destroy() {
      if (this._chart?.destroy) this._chart.destroy();
      this._chart = null;
    }

    _showError(msg) {
      this._shadow.innerHTML =
        `<div style="font:14px sans-serif;padding:8px;color:#b00020">${msg}</div>`;
    }

    _buildDatasets() {
      const dates = this._LabelData.UniqueDate;
      const src = this._SourceData;
      const plist = this._ProductListData;

      const datasets = [];

      plist.Product.forEach((prodName, idx) => {

        const barData = new Array(dates.length).fill(null);
        const lineData = new Array(dates.length).fill(null);

        for (let i = 0; i < src.Date.length; i++) {
          if (src.Products[i] !== prodName) continue;

          const date = src.Date[i];
          const pos = dates.indexOf(date);
          if (pos === -1) continue;

          barData[pos] = src.ClearingPrice[i];
          lineData[pos] = src.SpreadCapture[i];
        }

        // Bar series for product
        datasets.push({
          type: "bar",
          label: prodName + " Clearing Price",
          data: barData,
          backgroundColor: plist.BarColour[idx]
        });

        // Line series for product
        datasets.push({
          type: "line",
          label: prodName + " Spread Capture %",
          data: lineData,
          yAxisID: "y1",
          borderColor: plist.LineColour[idx],
          backgroundColor: "transparent",
          tension: 0.3,
          pointRadius: 3
        });
      });

      return datasets;
    }


    _render() {
      if (!this._canvas || !window.Chart) return;

      const labels = this._LabelData.UniqueDate;
      const datasets = this._buildDatasets();

      this._destroy();
      const ctx = this._canvas.getContext("2d");

      this._chart = new window.Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "Clearing Price" }
            },
            y1: {
              beginAtZero: true,
              position: "right",
              grid: { drawOnChartArea: false },
              ticks: { callback: v => v + "%" },
              title: { display: true, text: "Spread Capture %" }
            },
            x: {
              title: { display: true, text: "Date" }
            }
          }
        }
      });
    }

  }

  customElements.define("perci-combo-chart", PerciComboChart);

})();
