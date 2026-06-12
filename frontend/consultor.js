const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'http://localhost:3000';

let conhecimento = null;
let tabAtiva = 'renda_fixa';

document.addEventListener('DOMContentLoaded', () => {
  carregarConhecimento();
  carregarAnalise();
});

async function carregarConhecimento() {
  try {
    const r = await fetch(`${API_BASE}/consultor`);
    conhecimento = await r.json();
    renderizarPerfis(conhecimento.perfis);
    renderizarTab(tabAtiva);
  } catch (e) {
    document.getElementById('conteudoContainer').innerHTML = `<p class="loading" style="color:var(--red)">Erro ao carregar conhecimento: ${e.message}</p>`;
  }
}

async function carregarAnalise() {
  try {
    const r = await fetch(`${API_BASE}/analise-carteira`);
    const data = await r.json();
    renderizarAnalise(data);
  } catch (e) {
    document.getElementById('analiseContainer').innerHTML = `<p class="loading" style="color:var(--red)">Erro ao analisar carteira: ${e.message}</p>`;
  }
}

function renderizarAnalise(data) {
  const container = document.getElementById('analiseContainer');

  const moeda = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  container.innerHTML = `
    <div class="kpi-grid" style="margin-bottom:16px">
      <div class="kpi-card">
        <div class="kpi-label">Total Investido</div>
        <div class="kpi-value accent">${moeda(data.total_investido)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">% da Receita Investido</div>
        <div class="kpi-value ${data.percentual_investido >= 15 ? 'green' : 'red'}">${data.percentual_investido}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">% da Receita em Gastos</div>
        <div class="kpi-value ${data.percentual_gastos <= 70 ? 'green' : 'red'}">${data.percentual_gastos}%</div>
      </div>
    </div>
    <div class="accounts-grid" id="recomendacoesGrid"></div>
  `;

  const grid = document.getElementById('recomendacoesGrid');

  for (const rec of data.recomendacoes) {
    const cores = { alerta: 'var(--red)', melhoria: 'var(--yellow)', positivo: 'var(--green)', dica: 'var(--accent)' };
    const icones = { alerta: '!', melhoria: '~', positivo: 'ok', dica: 'i' };

    const card = document.createElement('div');
    card.className = 'account-card';
    card.innerHTML = `
      <div class="account-header">
        <div class="account-dot" style="background:${cores[rec.tipo] || 'var(--text-secondary)'}"></div>
        <div class="account-name">${icones[rec.tipo] || '?'}</div>
      </div>
      <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5">${rec.mensagem}</div>
    `;
    grid.appendChild(card);
  }
}

function renderizarPerfis(perfis) {
  const grid = document.getElementById('perfisGrid');

  for (const perfil of perfis) {
    const card = document.createElement('div');
    card.className = 'account-card';
    card.style.cursor = 'pointer';
    card.onclick = () => mostrarDetalhePerfil(perfil);

    const alocacao = Object.entries(perfil.alocacao_sugerida)
      .map(([k, v]) => `${k.replace('_', ' ')}: ${v}%`)
      .join(' | ');

    card.innerHTML = `
      <div class="account-header">
        <div class="account-dot" style="background:${perfil.cor}"></div>
        <div class="account-name">${perfil.nome}</div>
      </div>
      <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;margin-top:4px">
        ${perfil.descricao}
        <div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted)">${alocacao}</div>
      </div>
    `;
    grid.appendChild(card);
  }
}

function mostrarDetalhePerfil(perfil) {
  const container = document.getElementById('conteudoContainer');
  container.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div class="account-dot" style="background:${perfil.cor};width:16px;height:16px"></div>
        <h3 style="margin:0">${perfil.nome}</h3>
      </div>
      <p style="color:var(--text-secondary);margin-bottom:12px;line-height:1.6">${perfil.descricao}</p>
      <p style="color:var(--text-secondary);margin-bottom:16px;line-height:1.6"><strong>Indicado para:</strong> ${perfil.indicado_para}</p>
      <h4 style="margin-bottom:8px">Alocacao Sugerida</h4>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        ${Object.entries(perfil.alocacao_sugerida).map(([k, v]) => `
          <div class="kpi-card" style="flex:1;text-align:center">
            <div class="kpi-label">${k.replace('_', ' ')}</div>
            <div class="kpi-value" style="font-size:1.5rem">${v}%</div>
          </div>
        `).join('')}
      </div>
      <h4 style="margin-bottom:8px">Produtos Recomendados</h4>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${perfil.produtos.map(p => `<span style="background:var(--accent-dim);color:var(--accent);padding:6px 12px;border-radius:20px;font-size:0.8rem">${p}</span>`).join('')}
      </div>
    </div>
  `;
  tabAtiva = null;
}

function switchTab(tab) {
  tabAtiva = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderizarTab(tab);
}

function renderizarTab(tab) {
  if (!conhecimento) return;
  const container = document.getElementById('conteudoContainer');

  if (tab === 'renda_fixa') {
    container.innerHTML = conhecimento.renda_fixa.map(item => criarCardProduto(item, 'rf')).join('');
  } else if (tab === 'renda_variavel') {
    container.innerHTML = conhecimento.renda_variavel.map(item => criarCardProduto(item, 'rv')).join('');
  } else if (tab === 'comparativos') {
    container.innerHTML = renderizarComparativos();
  } else if (tab === 'educacao') {
    container.innerHTML = conhecimento.educacao.map(item => `
      <div class="card" style="margin-bottom:12px;padding:18px 20px">
        <h4 style="color:var(--accent);margin-bottom:8px">${item.titulo}</h4>
        <p style="color:var(--text-secondary);line-height:1.7;font-size:0.88rem">${item.conteudo}</p>
      </div>
    `).join('');
  } else if (tab === 'glossario') {
    container.innerHTML = Object.entries(conhecimento.glosario).map(([termo, def]) => `
      <div class="card" style="margin-bottom:8px;padding:14px 18px">
        <strong style="color:var(--accent)">${termo}</strong>
        <span style="color:var(--text-secondary);margin-left:8px;font-size:0.88rem">${def}</span>
      </div>
    `).join('');
  }
}

function criarCardProduto(item, tipo) {
  const badgeColor = tipo === 'rf'
    ? 'background:var(--green-dim);color:var(--green)'
    : 'background:var(--yellow-dim);color:var(--yellow)';

  const ir = item.ir ? `<div style="margin-top:8px;font-size:0.8rem"><span style="color:var(--text-muted)">IR: </span><span style="color:var(--text-secondary)">${item.ir}</span></div>` : '';

  return `
    <div class="card" style="margin-bottom:12px;padding:18px 20px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px">
        <div>
          <h4 style="margin-bottom:4px">${item.nome}</h4>
          <span style="font-size:0.78rem;${badgeColor};padding:3px 10px;border-radius:12px;font-weight:500">${item.tipo}</span>
        </div>
      </div>
      <p style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6;margin-bottom:10px">${item.descricao}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px;margin-bottom:10px;font-size:0.8rem">
        ${[
          { label: 'Risco', value: item.risco },
          { label: 'Liquidez', value: item.liquidez },
          { label: 'Rentabilidade', value: item.rentabilidade },
          { label: 'Prazo', value: item.prazo },
        ].filter(x => x.value).map(x => `
          <div><span style="color:var(--text-muted)">${x.label}:</span> <span style="color:var(--text)">${x.value}</span></div>
        `).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        ${(item.vantagens || []).map(v => `<span style="background:var(--green-dim);color:var(--green);padding:3px 10px;border-radius:12px;font-size:0.75rem">+ ${v}</span>`).join('')}
        ${(item.desvantagens || []).map(d => `<span style="background:var(--red-dim);color:var(--red);padding:3px 10px;border-radius:12px;font-size:0.75rem">- ${d}</span>`).join('')}
      </div>
      ${ir}
      <details style="margin-top:10px">
        <summary style="color:var(--accent);font-size:0.8rem;cursor:pointer">Como investir & educacao</summary>
        <div style="margin-top:8px;padding:12px;background:var(--bg-elevated);border-radius:var(--radius-sm)">
          ${item.como_investir ? `<p style="color:var(--text-secondary);font-size:0.82rem;line-height:1.6;margin-bottom:8px"><strong>Como investir:</strong> ${item.como_investir}</p>` : ''}
          ${item.educacao ? `<p style="color:var(--text-secondary);font-size:0.82rem;line-height:1.6">💡 ${item.educacao}</p>` : ''}
        </div>
      </details>
    </div>
  `;
}

function renderizarComparativos() {
  let html = '';

  for (const [key, comp] of Object.entries(conhecimento.comparativos)) {
    html += `<div class="card" style="margin-bottom:16px;padding:18px 20px">`;
    html += `<h4 style="margin-bottom:12px;color:var(--accent)">${comp.titulo}</h4>`;

    if (comp.comparacao) {
      const cols = Object.keys(comp.comparacao[0]).filter(k => k !== 'aspecto');
      html += `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.82rem">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text-muted)">Aspecto</th>
            ${cols.map(c => `<th style="text-align:left;padding:8px 10px;border-bottom:1px solid var(--border);color:var(--accent)">${c.toUpperCase()}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${comp.comparacao.map(row => `
            <tr>
              <td style="padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text);font-weight:500">${row.aspecto}</td>
              ${cols.map(c => `<td style="padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text-secondary)">${row[c]}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table></div>`;
    }

    if (comp.resumo) {
      html += `<p style="margin-top:10px;color:var(--text-secondary);font-size:0.85rem;line-height:1.6;padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm)">${comp.resumo}</p>`;
    }

    html += `</div>`;
  }

  return html;
}

async function buscarConhecimento() {
  const termo = document.getElementById('searchTerm').value.trim();
  if (!termo) return;

  const container = document.getElementById('buscaContainer');
  const conteudo = document.getElementById('conteudoContainer');
  conteudo.style.display = 'none';
  container.style.display = 'block';

  try {
    const r = await fetch(`${API_BASE}/consultor?termo=${encodeURIComponent(termo)}`);
    const data = await r.json();

    if (!data.busca || data.busca.length === 0) {
      container.innerHTML = `<div class="card" style="text-align:center;padding:40px"><p style="color:var(--text-secondary)">Nenhum resultado para "${termo}"</p></div>`;
      return;
    }

    container.innerHTML = `<h3 style="margin-bottom:16px">Resultados para "${termo}" (${data.busca.length})</h3>
      ${data.busca.map(item => {
        if (item.fonte === 'glossario') {
          return `<div class="card" style="margin-bottom:8px;padding:14px 18px">
            <strong style="color:var(--accent)">${item.nome}</strong>
            <span style="color:var(--text-secondary);margin-left:8px;font-size:0.88rem">${item.descricao}</span>
          </div>`;
        }
        if (item.fonte === 'educacao') {
          return `<div class="card" style="margin-bottom:12px;padding:18px 20px">
            <h4 style="color:var(--accent);margin-bottom:8px">${item.titulo}</h4>
            <p style="color:var(--text-secondary);line-height:1.7;font-size:0.88rem">${item.conteudo}</p>
          </div>`;
        }
        return criarCardProduto(item, item.fonte === 'renda_fixa' ? 'rf' : 'rv');
      }).join('')}
    `;
  } catch (e) {
    container.innerHTML = `<p style="color:var(--red)">Erro na busca: ${e.message}</p>`;
  }
}
