let charts = {};

export function renderCharts(data) {
  renderCategoriaPizza(data.percentual_por_categoria);
  renderFluxoMensal(data.fluxo_mensal);
  renderMetas(data);
}

function destroyChart(key) {
  if (charts[key]) {
    charts[key].destroy();
    delete charts[key];
  }
}

function renderCategoriaPizza(categorias) {
  destroyChart('categoriaPizza');

  const ctx = document.getElementById('chartCategorias').getContext('2d');
  const cores = [
    '#7c5cfc', '#f44336', '#4caf50', '#ff9800', '#2196f3',
    '#9c27b0', '#00bcd4', '#ffeb3b', '#e91e63', '#607d8b',
  ];

  charts.categoriaPizza = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categorias.map(c => c.categoria),
      datasets: [{
        data: categorias.map(c => c.valor),
        backgroundColor: categorias.map((_, i) => cores[i % cores.length]),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#a0a0b0',
            padding: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw;
              return ` R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            },
          },
        },
      },
    },
  });
}

function renderFluxoMensal(fluxo) {
  destroyChart('fluxoMensal');

  const ctx = document.getElementById('chartFluxo').getContext('2d');
  const meses = fluxo.map(f => f.mes).reverse();
  const entradas = fluxo.map(f => f.entradas).reverse();
  const gastos = fluxo.map(f => f.gastos).reverse();

  charts.fluxoMensal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderRadius: 4,
        },
        {
          label: 'Gastos',
          data: gastos,
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#a0a0b0',
            padding: 12,
            font: { size: 11 },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#a0a0b0', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          ticks: {
            color: '#a0a0b0',
            font: { size: 10 },
            callback: (v) => 'R$ ' + v.toLocaleString('pt-BR'),
          },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
      },
    },
  });
}

function renderMetas(data) {
  const totalGastos = data.total_saida || 0;
  const custoVidaPct = totalGastos > 0 ? Math.round((data.custo_vida / totalGastos) * 100) : 0;
  const extrasPct = totalGastos > 0 ? Math.round((data.despesas_extras / totalGastos) * 100) : 0;
  const investidoPct = data.total_entrada > 0 ? Math.round((data.investido / data.total_entrada) * 100) : 0;

  const metaCustoVida = 50;
  const metaExtras = 20;
  const metaInvestido = 20;

  renderBarraMeta('metaCustoVida', custoVidaPct, metaCustoVida, 'Custo de Vida');
  renderBarraMeta('metaExtras', extrasPct, metaExtras, 'Despesas Extras');
  renderBarraMeta('metaInvestido', investidoPct, metaInvestido, 'Investido');
}

function renderBarraMeta(elementId, atual, ideal, label) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const pct = Math.min(atual, 100);
  const isOk = atual <= ideal;

  el.innerHTML = `
    <div class="meta-header">
      <span class="meta-label">${label}</span>
      <span class="meta-valor">${atual}% (meta ${ideal}%)</span>
    </div>
    <div class="meta-bar-bg">
      <div class="meta-bar-fill ${isOk ? 'meta-ok' : 'meta-alerta'}" style="width:${pct}%"></div>
    </div>
  `;
}
