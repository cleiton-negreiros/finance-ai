const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const uploadStatus = document.getElementById('uploadStatus');
  const refreshBtn = document.getElementById('refreshBtn');

  if (API_BASE) {
    document.getElementById('apiWarning').style.display = 'block';
  }

  uploadForm.addEventListener('submit', handleUpload);
  refreshBtn.addEventListener('click', loadTransacoes);

  loadTransacoes();
  loadResumo();
});

async function handleUpload(e) {
  e.preventDefault();

  const form = e.target;
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
  tbody.innerHTML = '<tr><td colspan="7" class="loading">Carregando...</td></tr>';

  try {
    const response = await fetch(API_BASE + '/transacoes?limit=100');
    const transacoes = await response.json();

    if (!transacoes.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading">Nenhuma transacao encontrada</td></tr>';
      return;
    }

    tbody.innerHTML = transacoes.map(t => {
      const valorClass = t.tipo === 'gasto' ? 'valor-gasto' : t.tipo === 'entrada' ? 'valor-entrada' : 'valor-investimento';
      const signal = t.tipo === 'gasto' ? '-' : '+';

      return `<tr>
        <td data-label="Data">${formatDate(t.data)}</td>
        <td data-label="Fonte">${capitalize(t.fonte)}</td>
        <td data-label="Tipo">${capitalize(t.tipo)}</td>
        <td data-label="Valor" class="${valorClass}">${signal} ${formatCurrency(t.valor, t.moeda)}</td>
        <td data-label="Moeda">${t.moeda}</td>
        <td data-label="Descricao">${escapeHtml(t.descricao || '-')}</td>
        <td data-label="Categoria">${capitalize(t.categoria || 'outros')}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading error-text">Erro ao carregar: ${err.message}</td></tr>`;
  }
}

async function loadResumo() {
  try {
    const response = await fetch(API_BASE + '/resumo');
    const resumo = await response.json();

    document.getElementById('totalEntradas').textContent = formatCurrency(resumo.total_entradas);
    document.getElementById('totalGastos').textContent = formatCurrency(resumo.total_gastos);
    document.getElementById('saldoTotal').textContent = formatCurrency(resumo.saldo);
    document.getElementById('totalInvestimentos').textContent = formatCurrency(resumo.total_investimentos);

    const saldoEl = document.getElementById('saldoTotal');
    saldoEl.style.color = resumo.saldo >= 0 ? '#4caf50' : '#f44336';
  } catch (err) {
    console.error('Erro ao carregar resumo:', err);
  }
}

function showStatus(msg, type) {
  const status = document.getElementById('uploadStatus');
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
  const symbol = moeda === 'USD' ? 'US$' : moeda === 'BTC' ? '₿' : 'R$';
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
