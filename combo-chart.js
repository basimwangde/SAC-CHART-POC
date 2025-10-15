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

      // Fallback demo data (when nothing is bound)
      this._demo = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        bar:    [120, 150,  90, 180, 160, 200],
        line:   [ 22,  25,  18,  27,  24,  30]
      };

      this._barLabel  = this.getAttribute("barlabel")  || "Revenue";
      this._lineLabel = this.getAttribute("linelabel") || "Margin %";
    }

    // SAC will call this when properties change
    set barLabel(v)  { this._barLabel = v;  this._render(); }
    set lineLabel(v) { this._lineLabel = v; this._render(); }

    connectedCallback() {
      loadScriptSequential(CDN_CANDIDATES)
        .then(() => this._render())
        .catch(err => this._showError("Chart.js could not be loaded. Check CSP or host internally."));
    }

    // Called by SAC after data/properties are updated
    onCustomWidgetAfterUpdate() {
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

    // Build series from SAC binding ("main") if present; otherwise fallback
    _extractDataFromBinding() {
      const binding = this.main; // the name must match the key in dataBindings JSON
      if (!binding || !binding.data || !Array.isArray(binding.data) || binding.data.length === 0) {
        return {
          labels: this._demo.labels,
          bar: this._demo.bar,
          line: this._demo.line,
          barLabel: this._barLabel,
          lineLabel: this._lineLabel
        };
      }

      // Aliases are "dimensions_<index>" and "measures_<index>" per SAP docs.
      // We take the first dimension for x-axis, measure[0] for bars, measure[1] for line.
      const rows = binding.data;
      const labels = [];
      const bar = [];
      const line = [];

      // If only one measure is provided, we'll just show bars.
      const hasLine = rows.some(r => r["measures_1"] !== undefined);

      rows.forEach(r => {
        const d = r["dimensions_0"] ? r["dimensions_0"].label : "";
        if (d !== undefined) labels.push(String(d));
        const m0 = r["measures_0"] ? Number(r["measures_0"].raw || r["measures_0"].label || r["measures_0"]) : null;
        const m1 = r["measures_1"] ? Number(r["measures_1"].raw || r["measures_1"].label || r["measures_1"]) : null;
        bar.push(m0 ?? 0);
        if (hasLine) line.push(m1 ?? 0);
      });

      // Try to read nice series names from metadata; fallback to widget properties
      let barLabel = this._barLabel;
      let lineLabel = this._lineLabel;
      try {
        const ms = binding.metadata?.mainStructureMembers;
        if (Array.isArray(ms) && ms[0]?.label) barLabel = ms[0].label;
        if (Array.isArray(ms) && ms[1]?.label) lineLabel = ms[1].label;
      } catch (e) { /* noop */ }

      return { labels, bar, line, barLabel, lineLabel };
    }

    _render() {
      if (!this._canvas || !window.Chart) return;

      const { labels, bar, line, barLabel, lineLabel } = this._extractDataFromBinding();

      this._destroy();
      const ctx = this._canvas.getContext("2d");

      const datasets = [
        { type: "bar",  label: barLabel,  data: bar,  borderWidth: 1 }
      ];
      if (line.length > 0) {
        datasets.push({ type: "line", label: lineLabel, data: line, yAxisID: "y1", tension: 0.3, pointRadius: 3 });
      }

      this._chart = new window.Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top" }, tooltip: { mode: "index", intersect: false } },
          interaction: { mode: "index", intersect: false },
          scales: {
            y:  { beginAtZero: true, title: { display: true, text: barLabel } },
            y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false },
                  ticks: { callback: (v) => `${v}%` }, title: { display: true, text: lineLabel } },
            x:  { title: { display: true, text: "Category" } }
          }
        }
      });
    }
  }

  customElements.define("perci-combo-chart", PerciComboChart);
})();
