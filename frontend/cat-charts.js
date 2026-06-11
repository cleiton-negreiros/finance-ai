let catCharts = {};

function destroy(key) {
  if (catCharts[key]) { catCharts[key].destroy(); delete catCharts[key]; }
}

const CAT_COLORS = ['#7c5cff','#22c55e','#ef4444','#eab308','#3b82f6','#ec4899','#14b8a6','#f97316','#a855f7','#6b7280'];

function renderCatBar(canvasId, data, colorFn) {
  if (!data || !data.length) return;
  const el = document.getElementById(canvasId);
  if (!el) return;
  destroy(canvasId);

  catCharts[canvasId] = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels: data.map(d => d.categoria.charAt(0).toUpperCase() + d.categoria.slice(1)),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: data.map((_, i) => colorFn(i)),
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#151d28',
          titleFont: { family: 'Inter, sans-serif', size: 12 },
          bodyFont: { family: 'Inter, sans-serif', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ` R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#4b5563',
            font: { family: 'Inter, sans-serif', size: 10 },
            callback: (v) => v >= 1000 ? (v/1000).toFixed(0) + 'k' : v,
          },
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        },
        y: {
          ticks: { color: '#6b7280', font: { family: 'Inter, sans-serif', size: 10 } },
          grid: { display: false },
        },
      },
    },
  });
}
