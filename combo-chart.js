(function () {
  const CDN_CANDIDATES = [
    "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js",
    "https://unpkg.com/chart.js@4/dist/chart.umd.min.js"
  ];

  function loadScriptSequential(urls) {
    return new Promise((resolve, reject) => {
      if (window.Chart) return resolve();
      const tryNext = (i) => {
        if (i >= urls.length) return reject(new Error("All Chart.js URLs blocked or unreachable."));
        const s = document.createElement("script");
        s.src = urls[i];
        s.onload = () => resolve();
        s.onerror = () => { s.remove(); tryNext(i + 1); };
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
      Object.assign(container.style, { width: "100%", height: "100%", display: "flex" });

      this._canvas = document.createElement("canvas");
      Object.assign(this._canvas.style, { width: "100%", height: "100%" });
      container.appendChild(this._canvas);
      this._shadow.appendChild(container);

      this._chart = null;

      // this._SourceData = {
      //   Products: [],
      //   Date: [],
      //   ProductCategory: [],
      //   ClearingPrice: [],
      //   SpreadCapture: []
      // };

      // this._LabelData = { UniqueDate: [] };
      // this._ProductListData = { Product: [], BarColour: [], LineColour: [] };
    }

    // DEMO FALLBACK 
    _loadDemoSourceData() {
      this._SourceData = {
        Products: [
          "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead",
          "Oct ii", "Dec i"
        ],
        Date: [
          "15-Sep-25", "16-Sep-25", "17-Sep-25", "18-Sep-25", "19-Sep-25", "20-Sep-25", "21-Sep-25",
          "16-Sep-25", "20-Sep-25"
        ],
        ProductCategory: [
          "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead", "Day Ahead",
          "Long Term", "Long Term"
        ],
        ClearingPrice: [13.82, 12.16, 24.90, 7.49, 28.30, 68.11, 15.55, 27.98, 30.45],
        SpreadCapture: [131, 127, 89, 68, 80, 96, 63, 94, 98]
      };
    }

    _updateSourceFromBinding(binding) {
      if (binding && Array.isArray(binding.data) && binding.data.length > 0) {
        const rows = binding.data;

        this._SourceData = {
          Products: [],
          Date: [],
          ProductCategory: [],
          ClearingPrice: [],
          SpreadCapture: []
        };

        rows.forEach(r => {
          // Adjust these keys to your model mapping
          const date    = r["dimensions_0"]?.label ?? "";
          const product = r["dimensions_1"]?.label ?? "";
          const cat     = r["Product Category"] ?? r["dimensions_2"]?.label ?? "";

          const m0 = r["measures_0"];
          const m1 = r["measures_1"];

          const clearing = m0 ? Number(m0.raw ?? m0.label ?? m0) : null;
          const spread   = m1 ? Number(m1.raw ?? m1.label ?? m1) : null;

          this._SourceData.Products.push(String(product));
          this._SourceData.Date.push(String(date));
          this._SourceData.ProductCategory.push(String(cat));
          this._SourceData.ClearingPrice.push(clearing);
          this._SourceData.SpreadCapture.push(spread);
        });
      } else {
        this._loadDemoSourceData();
      }

      this._buildMetaFromSource();
    }

    _buildMetaFromSource() {
      const src = this._SourceData;

      const uniqueDates = Array.from(new Set(src.Date));
      const uniqueProducts = Array.from(new Set(src.Products));

      this._LabelData = { UniqueDate: uniqueDates };
      this._ProductListData = this._buildProductList(uniqueProducts);
    }

    _buildProductList(uniqueProducts) {
      const baseColors = [
        "#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd",
        "#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf",
        "#393b79","#637939","#8c6d31","#843c39","#7b4173",
        "#3182bd","#e6550d","#31a354","#756bb1","#636363",
        "#9c9ede","#e7cb94","#ff9896","#c5b0d5","#c7c7c7"
      ];

      const barColor = uniqueProducts.map((_, i) =>
        baseColors[i % baseColors.length]
      );

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
        .then(() => {

          this._SourceData = {
            Products: [],
            Date: [],
            ProductCategory: [],
            ClearingPrice: [],
            SpreadCapture: []
          };

          this._LabelData = { UniqueDate: [] };
          this._ProductListData = { Product: [], BarColour: [], LineColour: [] };
          this._updateSourceFromBinding(this.main);
          this._render();
        })
        .catch(err =>
          this._showError("Chart.js could not be loaded. Check CSP or host internally.")
        );
    }

    onCustomWidgetAfterUpdate() {
      this._updateSourceFromBinding(this.main);
      this._render();
    }

    disconnectedCallback() { this._destroy(); }
    onCustomWidgetResize() { if (this._chart?.resize) this._chart.resize(); }

    _destroy() {
      if (this._chart?.destroy) this._chart.destroy();
      this._chart = null;
    }

    _showError(msg) {
      this._shadow.innerHTML = `<div style="font:14px sans-serif;padding:8px;color:#b00020">${msg}</div>`;
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

        datasets.push({
          type: "bar",
          label: prodName + " Clearing Price",
          data: barData,
          backgroundColor: plist.BarColour[idx]
        });

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
