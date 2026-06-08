const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const isDashboard = window.location.pathname.includes('dashboard');

  if (isDashboard) {
    initDashboard();
  } else {
    initUpload();
  }
});

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
    const response = await fetch(API_BASE + '/transacoes?limit=100');
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
    const response = await fetch(API_BASE + '/resumo');
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
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
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

async function initDashboard() {
  const refreshBtn = document.getElementById('refreshDashboard');
  refreshBtn.addEventListener('click', loadDashboard);
  await loadDashboard();
}

async function loadDashboard() {
  try {
    const response = await fetch(API_BASE + '/dashboard');
    const data = await response.json();

    renderResumo(data);
    renderContas(data.saldo_por_conta);
    renderCategorias(data.percentual_por_categoria);

    if (typeof renderCharts === 'function') {
      renderCharts(data);
    }
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

function renderResumo(data) {
  const saldoEl = document.getElementById('dashSaldo');
  if (saldoEl) {
    saldoEl.textContent = formatCurrency(data.saldo_total);
    saldoEl.style.color = data.saldo_total >= 0 ? '#4caf50' : '#f44336';
  }
  setText('dashEntradas', formatCurrency(data.total_entrada));
  setText('dashSaidas', formatCurrency(data.total_saida));
  setText('dashInvestido', formatCurrency(data.total_investido));
}

function renderContas(contas) {
  const tbody = document.getElementById('contasBody');
  if (!tbody) return;

  if (!contas || !contas.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Nenhuma conta</td></tr>';
    return;
  }

  tbody.innerHTML = contas.map(c => {
    const saldoClass = c.saldo_calculado >= 0 ? 'valor-entrada' : 'valor-gasto';
    return `<tr>
      <td data-label="Conta">${escapeHtml(c.nome)}</td>
      <td data-label="Tipo">${capitalize(c.tipo)}</td>
      <td data-label="Saldo" class="${saldoClass}">${formatCurrency(c.saldo_calculado)}</td>
      <td data-label="Transacoes">${c.qtd_transacoes}</td>
    </tr>`;
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
    const pct = total > 0 ? ((c.valor / total) * 100).toFixed(1) : 0;
    return `<tr>
      <td data-label="Categoria">${capitalize(c.categoria)}</td>
      <td data-label="Valor">${formatCurrency(c.valor)}</td>
      <td data-label="%">${pct}%</td>
    </tr>`;
  }).join('');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
