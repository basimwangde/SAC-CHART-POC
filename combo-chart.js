(function () {
  const CDN_CANDIDATES = [
    "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js",
    "https://unpkg.com/chart.js@4/dist/chart.umd.min.js"
  ];

  function loadScriptSequential(urls) {
    return new Promise((resolve, reject) => {
      const tryNext = (i) => {
        if (i >= urls.length) return reject(new Error("All Chart.js URLs blocked by CSP or unreachable."));
        const s = document.createElement("script");
        s.src = urls[i];
        s.onload = () => resolve();
        s.onerror = () => {
          s.remove();
          tryNext(i + 1);
        };
        document.head.appendChild(s);
      };
      if (window.Chart) return resolve();
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
      this._barData = [120, 150, 90, 180, 160, 200];
      this._lineData = [22, 25, 18, 27, 24, 30];

      this._barLabel = this.getAttribute("barlabel") || "Revenue";
      this._lineLabel = this.getAttribute("linelabel") || "Margin %";
    }

    set barLabel(v) { this._barLabel = v; this._render(); }
    set lineLabel(v) { this._lineLabel = v; this._render(); }

    connectedCallback() {
      loadScriptSequential(CDN_CANDIDATES)
        .then(() => this._render())
        .catch(err => {
          console.error("[ComboChart] Failed to load Chart.js:", err?.message || err);
          this._showError("Chart.js could not be loaded. Check your tenant CSP or host the file internally.");
        });
    }

    disconnectedCallback() { this._destroy(); }
    onCustomWidgetResize() { if (this._chart?.resize) this._chart.resize(); }

    _destroy() { if (this._chart?.destroy) this._chart.destroy(); this._chart = null; }

    _showError(msg) {
      this._shadow.innerHTML = `<div style="font:14px sans-serif;padding:8px;color:#b00020">${msg}</div>`;
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
            { type: "bar", label: this._barLabel, data: this._barData, borderWidth: 1 },
            { type: "line", label: this._lineLabel, data: this._lineData, yAxisID: "y1", tension: 0.3, pointRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
          interaction: { mode: "index", intersect: false },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: this._barLabel } },
            y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false },
                  ticks: { callback: (v) => `${v}%` }, title: { display: true, text: this._lineLabel } },
            x: { title: { display: true, text: "Month" } }
          }
        }
      });
    }
  }

  customElements.define("perci-combo-chart", PerciComboChart);
})();
