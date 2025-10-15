(function () {
  class PerciComboChart extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: "open" });

      const container = document.createElement("div");
      Object.assign(container.style, {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "stretch"
      });

      this._canvas = document.createElement("canvas");
      Object.assign(this._canvas.style, { width: "100%", height: "100%" });

      container.appendChild(this._canvas);
      this._shadow.appendChild(container);

      this._chart = null;

      // Demo data
      this._labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      this._barData = [120, 150, 90, 180, 160, 200]; // Revenue
      this._lineData = [22, 25, 18, 27, 24, 30];     // Margin %

      // SAC property defaults (SAC will overwrite when bound)
      this._barLabel = this.getAttribute("barlabel") || "Revenue";
      this._lineLabel = this.getAttribute("linelabel") || "Margin %";
    }

    set barLabel(val) {
      this._barLabel = val;
      this._render();
    }
    set lineLabel(val) {
      this._lineLabel = val;
      this._render();
    }

    connectedCallback() {
      if (!window.Chart) {
        // Chart.js should be loaded via "resources" in the manifest before this runs
        console.error("Chart.js not found. Check 'resources' in manifest.");
        return;
      }
      this._render();
    }

    disconnectedCallback() {
      this._destroy();
    }

    onCustomWidgetResize() {
      if (this._chart && this._chart.resize) this._chart.resize();
    }

    _destroy() {
      if (this._chart && typeof this._chart.destroy === "function") {
        this._chart.destroy();
      }
      this._chart = null;
    }

    _render() {
      if (!this._canvas || !window.Chart) return;
      const ctx = this._canvas.getContext("2d");
      this._destroy();

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

  customElements.define("perci-combo-chart", PerciComboChart);
})();
