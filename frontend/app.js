const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const isDashboard = window.location.pathname.includes('dashboard');

  populatePeriods();

  if (isDashboard) {
    initDashboard();
  } else {
    initUpload();
  }
});

function populatePeriods() {
  const sel = document.getElementById('periodSelect');
  if (!sel) return;
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    sel.appendChild(opt);
  }
}

function getPeriod() {
  const sel = document.getElementById('periodSelect');
  if (!sel || !sel.value) return {};
  const [ano, mes] = sel.value.split('-');
  const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
  return {
    inicio: `${sel.value}-01`,
    fim: `${sel.value}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

function applyPeriod() {
  const isDashboard = window.location.pathname.includes('dashboard');
  if (isDashboard) loadDashboard();
  else { loadTransacoes(); loadResumo(); }
}

function initUpload() {
  const uploadForm = document.getElementById('uploadForm');
  const refreshBtn = document.getElementById('refreshBtn');

  if (API_BASE) {
    document.getElementById('apiWarning').style.display = 'block';
  }

  uploadForm.addEventListener('submit', handleUpload);
  refreshBtn.addEventListener('click', loadTransacoes);

  loadTransacoes();
  loadResumo();
}

async function handleUpload(e) {
  e.preventDefault();

  const fileInput = document.getElementById('fileInput');
  const fonteSelect = document.getElementById('fonteSelect');
  const status = document.getElementById('uploadStatus');
  const form = document.getElementById('uploadForm');

  if (!fileInput.files.length) {
    showStatus('Selecione um arquivo CSV', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('fonte', fonteSelect.value);

  showStatus('Enviando...', 'info');

  try {
    const response = await fetch(API_BASE + '/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro no upload');
    }

    showStatus(
      `Sucesso! ${result.inseridas} transacoes importadas (${result.total} linhas, ${result.duplicatas} duplicatas ignoradas)`,
      'success'
    );

    form.reset();
    loadTransacoes();
    loadResumo();
  } catch (err) {
    showStatus('Erro: ' + err.message, 'error');
  }
}

async function loadTransacoes() {
  const tbody = document.getElementById('transacoesBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">Carregando...</td></tr>';

  try {
    const period = getPeriod();
    const params = new URLSearchParams({ limit: 100, ...period });
    const response = await fetch(API_BASE + '/transacoes?' + params);
    const transacoes = await response.json();

    if (!transacoes.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading">Nenhuma transacao encontrada</td></tr>';
      return;
    }

    tbody.innerHTML = transacoes.map(t => {
      const valorClass = t.tipo === 'gasto' ? 'valor-gasto' : t.tipo === 'entrada' ? 'valor-entrada' : 'valor-investimento';
      const signal = t.tipo === 'gasto' ? '-' : '+';

      return `<tr>
        <td data-label="Data">${formatDate(t.data)}</td>
        <td data-label="Conta">${escapeHtml(t.conta || t.fonte)}</td>
        <td data-label="Fonte">${capitalize(t.fonte)}</td>
        <td data-label="Tipo">${capitalize(t.tipo)}</td>
        <td data-label="Valor" class="${valorClass}">${signal} ${formatCurrency(t.valor, t.moeda)}</td>
        <td data-label="Moeda">${t.moeda}</td>
        <td data-label="Descricao">${escapeHtml(t.descricao || '-')}</td>
        <td data-label="Categoria">${capitalize(t.categoria || 'outros')}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading error-text">Erro ao carregar: ${err.message}</td></tr>`;
  }
}

async function loadResumo() {
  try {
    const period = getPeriod();
    const params = new URLSearchParams(period);
    const response = await fetch(API_BASE + '/resumo?' + params);
    const resumo = await response.json();

    const elEntradas = document.getElementById('totalEntradas');
    const elGastos = document.getElementById('totalGastos');
    const elSaldo = document.getElementById('saldoTotal');
    const elInvest = document.getElementById('totalInvestimentos');

    if (elEntradas) elEntradas.textContent = formatCurrency(resumo.total_entradas);
    if (elGastos) elGastos.textContent = formatCurrency(resumo.total_gastos);
    if (elSaldo) {
      elSaldo.textContent = formatCurrency(resumo.saldo);
      elSaldo.style.color = resumo.saldo >= 0 ? '#4caf50' : '#f44336';
    }
    if (elInvest) elInvest.textContent = formatCurrency(resumo.total_investimentos);
  } catch (err) {
    console.error('Erro ao carregar resumo:', err);
  }
}

function showStatus(msg, type) {
  const status = document.getElementById('uploadStatus');
  if (!status) return;
  status.textContent = msg;
  status.className = 'status ' + type;
  setTimeout(() => {
    if (status.textContent === msg) {
      status.className = 'status';
    }
  }, 5000);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return dateStr.split(' ')[0];
}

function formatCurrency(value, moeda) {
  const num = parseFloat(value) || 0;
  const symbol = moeda === 'USD' ? 'US$' : moeda === 'BTC' ? '\u20bf' : 'R$';
  return `${symbol} ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== DASHBOARD ===== */

const ACCOUNT_COLORS = ['#7c5cff','#22c55e','#3b82f6','#eab308','#ec4899','#14b8a6','#f97316','#a855f7','#ef4444','#6b7280'];
const CAT_COLORS = ['#7c5cff','#22c55e','#ef4444','#eab308','#3b82f6','#ec4899','#14b8a6','#f97316','#a855f7','#6b7280'];

async function initDashboard() {
  const refreshBtn = document.getElementById('refreshDashboard');
  refreshBtn.addEventListener('click', loadDashboard);
  await loadDashboard();
}

async function loadDashboard() {
  try {
    const period = getPeriod();
    const params = new URLSearchParams({ ...period, moeda: 'BRL' });
    const response = await fetch(API_BASE + '/dashboard?' + params);
    const data = await response.json();

    renderHero(data);
    renderKPIs(data);
    renderContas(data.saldo_por_conta);
    renderCategorias(data.percentual_por_categoria);

    if (typeof renderCharts === 'function') {
      renderCharts(data);
    }
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

function renderHero(data) {
  const saldo = data.saldo_total || 0;
  const heroSaldo = document.getElementById('heroSaldo');
  const heroChange = document.getElementById('heroChange');

  if (heroSaldo) {
    heroSaldo.textContent = formatCurrency(saldo);
    heroSaldo.style.color = saldo >= 0 ? 'var(--green)' : 'var(--red)';
  }

  if (heroChange) {
    if (data.total_entrada > 0 && data.total_saida > 0) {
      const ratio = ((data.total_entrada - data.total_saida) / (data.total_entrada + data.total_saida) * 100).toFixed(1);
      const isPos = ratio >= 0;
      heroChange.textContent = `${isPos ? '+' : ''}${ratio}% de margem`;
      heroChange.className = 'hero-change ' + (isPos ? 'positive' : 'negative');
    } else {
      heroChange.textContent = 'Sem dados suficientes';
      heroChange.className = 'hero-change';
    }
  }
}

function renderKPIs(data) {
  setText('kpiEntradas', formatCurrency(data.total_entrada));
  setText('kpiSaidas', formatCurrency(data.total_saida));
  setText('kpiInvestido', formatCurrency(data.total_investido));
}

function renderContas(contas) {
  const grid = document.getElementById('accountsGrid');
  if (!grid) return;

  if (!contas || !contas.length) {
    grid.innerHTML = '<div class="account-card"><p class="loading">Nenhuma conta</p></div>';
    return;
  }

  grid.innerHTML = contas.map((c, i) => {
    const cor = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
    const saldoClass = c.saldo_calculado >= 0 ? '' : '';
    return `<div class="account-card">
      <div class="account-header">
        <span class="account-dot" style="background:${cor}"></span>
        <div>
          <div class="account-name">${escapeHtml(c.nome)}</div>
          <div class="account-type">${capitalize(c.tipo)}</div>
        </div>
      </div>
      <div class="account-balance" style="color:${c.saldo_calculado >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${formatCurrency(c.saldo_calculado)}
      </div>
      <div class="account-txcount">${c.qtd_transacoes} transacoes</div>
    </div>`;
  }).join('');
}

function renderCategorias(categorias) {
  const tbody = document.getElementById('categoriasBody');
  if (!tbody) return;

  if (!categorias || !categorias.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhuma categoria</td></tr>';
    return;
  }

  const total = categorias.reduce((acc, c) => acc + c.valor, 0);

  tbody.innerHTML = categorias.map(c => {
    const pct = total > 0 ? ((c.valor / total) * 100) : 0;
    const cor = CAT_COLORS[categorias.indexOf(c) % CAT_COLORS.length];
    return `<tr>
      <td class="cat-name">${capitalize(c.categoria)}</td>
      <td class="cat-value">${formatCurrency(c.valor)}</td>
      <td class="cat-pct">
        ${pct.toFixed(1)}%
        <div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${Math.min(pct, 100)}%;background:${cor}"></div></div>
      </td>
    </tr>`;
  }).join('');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
