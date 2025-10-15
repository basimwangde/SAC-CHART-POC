/* global CSSStyleSheet */
(function () {
  const CHARTJS_URL = "https://cdn.jsdelivr.net/npm/chart.js";

  class PerciComboChart extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: "open" });

      // Root container
      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.display = "flex";
      container.style.alignItems = "stretch";

      // Canvas
      this._canvas = document.createElement("canvas");
      this._canvas.style.width = "100%";
      this._canvas.style.height = "100%";

      container.appendChild(this._canvas);
      this._shadow.appendChild(container);

      this._chart = null;
      this._chartReady = false;

      // Hardcoded demo data
      this._labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      this._barData = [120, 150, 90, 180, 160, 200]; // e.g., Revenue
      this._lineData = [22, 25, 18, 27, 24, 30];     // e.g., Margin %

      // Properties with defaults (SAC will override if you bind)
      this._barLabel = this.getAttribute("barlabel") || "Revenue";
      this._lineLabel = this.getAttribute("linelabel") || "Margin %";
    }

    // SAC property setters (optional)
    set barLabel(val) {
      this._barLabel = val;
      this._renderChart();
    }
    set lineLabel(val) {
      this._lineLabel = val;
      this._renderChart();
    }

    connectedCallback() {
      this._ensureChartJs().then(() => {
        this._chartReady = true;
        this._renderChart();
      });
    }

    disconnectedCallback() {
      this._destroyChart();
    }

    onCustomWidgetResize(width, height) {
      // SAC calls this on resize
      if (this._chart) {
        this._chart.resize();
      }
    }

    _destroyChart() {
      if (this._chart && typeof this._chart.destroy === "function") {
        this._chart.destroy();
      }
      this._chart = null;
    }

    async _ensureChartJs() {
      if (window.Chart) return;
      await new Promise((resolve, reject) => {
        const existing = Array.from(document.getElementsByTagName("script"))
          .find(s => s.src && s.src.indexOf("chart.js") !== -1);
        if (existing && window.Chart) return resolve();

        const script = document.createElement("script");
        script.src = CHARTJS_URL;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Chart.js"));
        document.head.appendChild(script);
      });
    }

    _renderChart() {
      if (!this._chartReady || !this._canvas) return;

      this._destroyChart();
      const ctx = this._canvas.getContext("2d");

      // Build chart
      this._chart = new window.Chart(ctx, {
        type: "bar",
        data: {
          labels: this._labels,
          datasets: [
            {
              type: "bar",
              label: this._barLabel,
              data: this._barData,
              borderWidth: 1
            },
            {
              type: "line",
              label: this._lineLabel,
              data: this._lineData,
              yAxisID: "y1",
              tension: 0.3,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false }
          },
          interaction: { mode: "index", intersect: false },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: this._barLabel }
            },
            y1: {
              beginAtZero: true,
              position: "right",
              grid: { drawOnChartArea: false },
              ticks: {
                callback: (val) => `${val}%`
              },
              title: { display: true, text: this._lineLabel }
            },
            x: { title: { display: true, text: "Month" } }
          }
        }
      });
    }
  }

  // Register element
  customElements.define("perci-combo-chart", PerciComboChart);
})();
