let investChart = null;

const COLORS_INVEST = { saldo: '#22c55e', investido: '#7c5cff', patrimonio: '#eab308' };

function renderEvolucao(evolucao) {
  if (investChart) { investChart.destroy(); investChart = null; }
  const el = document.getElementById('chartPatrimonio');
  if (!el || !evolucao || !evolucao.length) return;

  investChart = new Chart(el.getContext('2d'), {
    type: 'line',
    data: {
      labels: evolucao.map(e => e.mes),
      datasets: [
        {
          label: 'Saldo',
          data: evolucao.map(e => e.saldo),
          borderColor: COLORS_INVEST.saldo,
          backgroundColor: 'rgba(34, 197, 94, 0.06)',
          fill: false,
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Investido',
          data: evolucao.map(e => e.investido),
          borderColor: COLORS_INVEST.investido,
          backgroundColor: 'rgba(124, 92, 255, 0.06)',
          fill: false,
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Patrimônio',
          data: evolucao.map(e => e.patrimonio),
          borderColor: COLORS_INVEST.patrimonio,
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          fill: true,
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
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
    },
  });
}

function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
