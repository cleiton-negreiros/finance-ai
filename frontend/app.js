const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  populatePeriods();

  if (path.includes('categorias')) {
    initCategorias();
  } else if (path.includes('investimentos')) {
    initInvest();
  } else if (path.includes('dashboard')) {
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
  sel.value = now.toISOString().slice(0, 7);
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
  const path = window.location.pathname;
  if (path.includes('categorias')) loadCategorias();
  else if (path.includes('investimentos')) loadInvest();
  else if (path.includes('dashboard')) loadDashboard();
  else { loadTransacoes(); loadResumo(); }
}

function initUpload() {
  const uploadForm = document.getElementById('uploadForm');
  const refreshBtn = document.getElementById('refreshBtn');
  const addBtn = document.getElementById('addTransacaoBtn');

  if (API_BASE) {
    document.getElementById('apiWarning').style.display = 'block';
  }

  uploadForm.addEventListener('submit', handleUpload);
  refreshBtn.addEventListener('click', loadTransacoes);
  if (addBtn) addBtn.addEventListener('click', openAdd);

  loadTransacoes();
  loadResumo();
  loadSelectOptions();
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
  tbody.innerHTML = '<tr><td colspan="9" class="loading">Carregando...</td></tr>';

  try {
    const period = getPeriod();
    const params = new URLSearchParams({ limit: 100, ...period });
    const response = await fetch(API_BASE + '/transacoes?' + params);
    const transacoes = await response.json();

    if (!transacoes.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="loading">Nenhuma transacao encontrada</td></tr>';
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
        <td data-label="Acoes">
          <button class="btn-icon-sm edit" onclick="openEdit(${t.id})" title="Editar">&#9998;</button>
          <button class="btn-icon-sm delete" onclick="deleteTransacao(${t.id})" title="Excluir">&times;</button>
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="loading error-text">Erro ao carregar: ${err.message}</td></tr>`;
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

    loadReceitasDashboard();
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

async function loadReceitasDashboard() {
  try {
    const period = getPeriod();
    const params = new URLSearchParams(period);
    const response = await fetch(API_BASE + '/categorias?' + params);
    const data = await response.json();
    renderCategoriaTable('receitasBody', data.receitas, formatCurrency);
  } catch (err) {
    console.error('Erro ao carregar receitas do dashboard:', err);
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

  const poupanca = data.taxa_poupanca;
  const el = document.getElementById('kpiPoupanca');
  if (el) {
    if (poupanca != null && !isNaN(poupanca)) {
      el.textContent = (poupanca >= 0 ? '+' : '') + poupanca.toFixed(1) + '%';
      el.style.color = poupanca >= 20 ? 'var(--green)' : poupanca >= 10 ? 'var(--accent)' : 'var(--red)';
    } else {
      el.textContent = 'N/A';
    }
  }

  setText('subRendaReal', formatCurrency(data.renda_real));
  setText('subMovimentacoes', formatCurrency(data.movimentacoes));
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

/* ===== INVESTIMENTOS ===== */

async function initInvest() {
  const refreshBtn = document.getElementById('refreshInvest');
  if (refreshBtn) refreshBtn.addEventListener('click', loadInvest);
  await loadInvest();
}

async function loadInvest() {
  try {
    const period = getPeriod();
    const params = new URLSearchParams({ ...period, moeda: 'BRL' });
    const response = await fetch(API_BASE + '/investimentos?' + params);
    const data = await response.json();

    const total = data.total || 0;
    setText('heroInvestido', formatCurrency(total));

    const evol = data.evolucao || [];
    const ultimo = evol.length > 0 ? evol[evol.length - 1] : null;
    if (ultimo) {
      setText('kpiPatrimonio', formatCurrency(ultimo.patrimonio));
      setText('kpiSaldo', formatCurrency(ultimo.saldo));
    } else {
      setText('kpiPatrimonio', formatCurrency(0));
      setText('kpiSaldo', formatCurrency(0));
    }

    if (evol.length >= 2) {
      const prev = evol[evol.length - 2];
      const variacao = prev.patrimonio > 0 ? ((ultimo.patrimonio - prev.patrimonio) / prev.patrimonio * 100) : 0;
      const elEvol = document.getElementById('kpiEvolucao');
      if (elEvol) {
        elEvol.textContent = `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%`;
        elEvol.style.color = variacao >= 0 ? 'var(--green)' : 'var(--red)';
      }
    } else {
      const elEvol = document.getElementById('kpiEvolucao');
      if (elEvol) { elEvol.textContent = '--'; elEvol.style.color = ''; }
    }

    renderInvestTipo(data.por_tipo);
    renderInvestConta(data.por_conta);
    renderEvolucaoTable(evol);

    if (typeof renderEvolucao === 'function') {
      renderEvolucao(evol);
    }
  } catch (err) {
    console.error('Erro ao carregar investimentos:', err);
  }
}

function renderInvestTipo(porTipo) {
  const tbody = document.getElementById('investTipoBody');
  if (!tbody) return;

  if (!porTipo || !porTipo.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhum investimento encontrado</td></tr>';
    return;
  }

  const total = porTipo.reduce((acc, r) => acc + (r.total || 0), 0);

  tbody.innerHTML = porTipo.map(r => {
    const pct = total > 0 ? ((r.total / total) * 100) : 0;
    return `<tr>
      <td>${capitalize(r.tipo)}</td>
      <td class="cat-value">${formatCurrency(r.total)}</td>
      <td class="cat-pct">${pct.toFixed(1)}%</td>
    </tr>`;
  }).join('');
}

function renderInvestConta(porConta) {
  const tbody = document.getElementById('investContaBody');
  if (!tbody) return;

  if (!porConta || !porConta.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhum investimento encontrado</td></tr>';
    return;
  }

  const total = porConta.reduce((acc, r) => acc + (r.total || 0), 0);

  tbody.innerHTML = porConta.map(r => {
    const pct = total > 0 ? ((r.total / total) * 100) : 0;
    return `<tr>
      <td>${escapeHtml(r.conta)}</td>
      <td class="cat-value">${formatCurrency(r.total)}</td>
      <td class="cat-pct">${pct.toFixed(1)}%</td>
    </tr>`;
  }).join('');
}

function renderEvolucaoTable(evolucao) {
  const tbody = document.getElementById('evolucaoBody');
  if (!tbody) return;

  if (!evolucao || !evolucao.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Sem dados de evolução</td></tr>';
    return;
  }

  const reversed = [...evolucao].reverse();

  tbody.innerHTML = reversed.map((e, i) => {
    const variacao = i > 0 ? ((e.patrimonio - reversed[i - 1].patrimonio) / reversed[i - 1].patrimonio * 100) : 0;
    const varClass = variacao >= 0 ? 'valor-entrada' : 'valor-gasto';
    const varSignal = variacao >= 0 ? '+' : '';
    return `<tr>
      <td>${e.mes}</td>
      <td class="cat-value valor-entrada">${formatCurrency(e.saldo)}</td>
      <td class="cat-value valor-investimento">${formatCurrency(e.investido)}</td>
      <td class="cat-value" style="color:var(--yellow)">${formatCurrency(e.patrimonio)}</td>
      <td class="cat-value ${varClass}">${varSignal}${variacao.toFixed(1)}%</td>
    </tr>`;
  }).join('');
}

/* ===== CATEGORIAS ===== */

async function initCategorias() {
  const refreshBtn = document.getElementById('refreshCategorias');
  if (refreshBtn) refreshBtn.addEventListener('click', loadCategorias);
  await loadCategorias();
}

async function loadCategorias() {
  try {
    const period = getPeriod();
    const params = new URLSearchParams(period);
    const response = await fetch(API_BASE + '/categorias?' + params);
    const data = await response.json();

    setText('kpiTotalGastos', formatCurrency(data.total_gastos));
    setText('kpiTotalReceitas', formatCurrency(data.total_receitas));

    renderCategoriaTable('catGastosBody', data.gastos, formatCurrency);
    renderCategoriaTable('catReceitasBody', data.receitas, formatCurrency);

    if (typeof renderCatBar === 'function') {
      renderCatBar('chartCatGastos', data.gastos, () => '#ef4444');
      renderCatBar('chartCatReceitas', data.receitas, () => '#22c55e');
    }
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

function renderCategoriaTable(tbodyId, categorias, fmtFn) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!categorias || !categorias.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="loading">Nenhum dado no período</td></tr>';
    return;
  }

  tbody.innerHTML = categorias.map(c => {
    const pct = c.percentual || 0;
    return `<tr>
      <td>${capitalize(c.categoria)}</td>
      <td class="cat-value">${fmtFn(c.total)}</td>
      <td class="cat-pct">
        ${pct}%
        <div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${Math.min(pct, 100)}%"></div></div>
      </td>
    </tr>`;
  }).join('');
}

/* ===== MODAL CRUD ===== */

async function loadSelectOptions() {
  try {
    const [contasRes, catsRes] = await Promise.all([
      fetch(API_BASE + '/contas'),
      fetch(API_BASE + '/categorias-list'),
    ]);
    const contas = await contasRes.json();
    const cats = await catsRes.json();

    const contasList = document.getElementById('contasList');
    if (contasList) contasList.innerHTML = contas.map(c => `<option value="${escapeHtml(c.nome)}">`).join('');

    const catsList = document.getElementById('catsList');
    if (catsList) catsList.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join('');
  } catch (err) {
    console.error('Erro ao carregar opcoes:', err);
  }
}

function openAdd() {
  document.getElementById('editId').value = '';
  document.getElementById('modalTitle').textContent = 'Nova Transacao';
  document.getElementById('transacaoForm').reset();
  document.getElementById('modalData').value = new Date().toISOString().slice(0, 10);
  document.getElementById('modalValor').value = '';
  document.getElementById('modalDescricao').value = '';
  document.getElementById('transacaoModal').style.display = 'flex';
}

async function openEdit(id) {
  try {
    const response = await fetch(API_BASE + '/transacoes?limit=1000');
    const transacoes = await response.json();
    const t = transacoes.find(x => x.id === id);
    if (!t) return;

    document.getElementById('editId').value = t.id;
    document.getElementById('modalTitle').textContent = 'Editar Transacao';
    document.getElementById('modalData').value = t.data.split(' ')[0];
    document.getElementById('modalTipo').value = t.tipo;
    document.getElementById('modalValor').value = t.valor;
    document.getElementById('modalMoeda').value = t.moeda;
    document.getElementById('modalConta').value = t.conta;
    document.getElementById('modalCategoria').value = t.categoria || '';
    document.getElementById('modalDescricao').value = t.descricao || '';
    document.getElementById('transacaoModal').style.display = 'flex';
  } catch (err) {
    console.error('Erro ao abrir edicao:', err);
  }
}

function closeModal() {
  document.getElementById('transacaoModal').style.display = 'none';
}

async function saveTransaction(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const data = document.getElementById('modalData').value;
  const tipo = document.getElementById('modalTipo').value;
  const valor = document.getElementById('modalValor').value;
  const moeda = document.getElementById('modalMoeda').value;
  const conta = document.getElementById('modalConta').value.trim();
  const categoria = document.getElementById('modalCategoria').value.trim() || 'outros';
  const descricao = document.getElementById('modalDescricao').value.trim();

  const body = { data, tipo, valor, moeda, conta, categoria, descricao, fonte: 'manual' };

  try {
    const url = id ? API_BASE + '/transacoes/' + id : API_BASE + '/transacoes';
    const method = id ? 'PUT' : 'POST';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    if (!response.ok) {
      const err = await response.json();
      alert('Erro: ' + (err.error || 'Falha ao salvar'));
      return;
    }

    closeModal();
    loadTransacoes();
    loadResumo();
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
}

async function deleteTransacao(id) {
  if (!confirm('Tem certeza que deseja excluir esta transacao?')) return;

  try {
    const response = await fetch(API_BASE + '/transacoes/' + id, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json();
      alert('Erro: ' + (err.error || 'Falha ao excluir'));
      return;
    }
    loadTransacoes();
    loadResumo();
  } catch (err) {
    alert('Erro ao excluir: ' + err.message);
  }
}
