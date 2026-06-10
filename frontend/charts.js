let charts = {};

const COLORS = ['#7c5cff','#22c55e','#ef4444','#eab308','#3b82f6','#ec4899','#14b8a6','#f97316','#a855f7','#6b7280'];

function renderCharts(data) {
  renderDonut(data.percentual_por_categoria);
  renderFlow(data.fluxo_mensal, data);
  renderGoals(data);
}

window.renderCharts = renderCharts;

function destroy(key) {
  if (charts[key]) { charts[key].destroy(); delete charts[key]; }
}

const donutOpts = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#6b7280',
        padding: 14,
        font: { family: 'Inter, sans-serif', size: 11, weight: '500' },
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: '#151d28',
      titleFont: { family: 'Inter, sans-serif', size: 12 },
      bodyFont: { family: 'Inter, sans-serif', size: 12 },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: (ctx) => {
          const v = ctx.raw;
          return ` R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        },
      },
    },
  },
};

function renderDonut(categorias) {
  destroy('donut');
  const el = document.getElementById('chartCategorias');
  if (!el || !categorias || !categorias.length) return;

  charts.donut = new Chart(el.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: categorias.map(c => c.categoria.charAt(0).toUpperCase() + c.categoria.slice(1)),
      datasets: [{
        data: categorias.map(c => c.valor),
        backgroundColor: categorias.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: donutOpts,
  });
}

const flowOpts = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        color: '#6b7280',
        font: { family: 'Inter, sans-serif', size: 11 },
        usePointStyle: true,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#151d28',
      titleFont: { family: 'Inter, sans-serif', size: 12 },
      bodyFont: { family: 'Inter, sans-serif', size: 12 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#4b5563', font: { family: 'Inter, sans-serif', size: 10 } },
      grid: { display: false },
    },
    y: {
      ticks: {
        color: '#4b5563',
        font: { family: 'Inter, sans-serif', size: 10 },
        callback: (v) => v >= 1000 ? (v/1000).toFixed(0) + 'k' : v,
      },
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
    },
  },
};

function renderFlow(fluxo) {
  destroy('flow');
  const el = document.getElementById('chartFluxo');
  if (!el || !fluxo || !fluxo.length) return;

  const meses = fluxo.map(f => f.mes).reverse();
  const entradas = fluxo.map(f => f.entradas).reverse();
  const gastos = fluxo.map(f => f.gastos).reverse();

  charts.flow = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Gastos',
          data: gastos,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...flowOpts,
      barPercentage: 0.6,
      categoryPercentage: 0.7,
    },
  });
}

function renderGoals(data) {
  const totalGastos = data.total_saida || 0;
  const totalEntrada = data.total_entrada || 0;

  const cvPct = totalGastos > 0 ? Math.round((data.custo_vida / totalGastos) * 100) : 0;
  const exPct = totalGastos > 0 ? Math.round((data.despesas_extras / totalGastos) * 100) : 0;
  const invPct = totalEntrada > 0 ? Math.round((data.investido / totalEntrada) * 100) : 0;

  setGoal('goalCustoVida', cvPct, 50, false, '% (ideal ≤ 50%)');
  setGoal('goalExtras', exPct, 20, false, '% (ideal ≤ 20%)');
  setGoal('goalInvestido', invPct, 20, true, '% (meta ≥ 20%)');
}

function setGoal(containerId, atual, limite, isInvert, suffix) {
  const card = document.getElementById(containerId);
  if (!card) return;
  const pctDisplay = card.querySelector('.goal-pct');
  const fill = card.querySelector('.goal-bar-fill');

  let cls = 'goal-ok';
  if (isInvert) {
    if (atual < limite) cls = 'goal-alert';
    else if (atual >= limite) cls = 'goal-ok';
  } else {
    if (atual > limite * 1.2) cls = 'goal-alert';
    else if (atual > limite) cls = 'goal-warn';
    else cls = 'goal-ok';
  }

  pctDisplay.textContent = atual + suffix;
  fill.className = 'goal-bar-fill ' + cls;
  fill.style.width = Math.min(atual, 100) + '%';
}
