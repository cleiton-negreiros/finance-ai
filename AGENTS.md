# Finance AI — Project Brain

## Meta
- **Goal**: Migrate personal finance spreadsheet to an app with financial education focus
- **Platform**: Local Node.js server + PWA frontend (works on Termux/Android)
- **Android Extractor**: Captures screenshots via MediaProjection, runs OCR, extracts transactions, exports CSV
- **Deploy**: Frontend on Vercel, backend runs locally/Termux

---

## Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| Backend | Node.js (ESM), Express, better-sqlite3 (desktop) / sql.js (Termux) |
| Frontend | Vanilla JS, Chart.js 4, CSS custom properties |
| Mobile | Termux: `node server-termux.js` |
| Android Extractor | Kotlin, Jetpack Compose, ML Kit OCR |
| CI | GitHub Actions (build APK) |
| Deploy | Vercel (frontend static), GitHub (source) |

### Directory Structure
```
finance-ai/
├── backend/
│   ├── server.js              # Express server - all endpoints
│   ├── server-termux.js       # sql.js variant for Termux
│   ├── db.js / db-termux.js   # Database init (better-sqlite3 / sql.js)
│   ├── importer.js / importer-termux.js  # CSV import
│   ├── categorizer.js         # Keyword → category rules
│   ├── normalizers/           # CSV normalizers per bank
│   │   ├── 99pay.js / c6.js / mercadopago.js / binance.js / rico.js / nomad.js
│   └── engine/
│       ├── consolidator.js / consolidator-termux.js   # Account balances, totals, por_moeda[]
│       ├── metrics.js / metrics-termux.js             # Goals, fluxo, categories, investimentos, patrimonio, evolucao
│       └── conhecimento.js                            # Investment knowledge base (consultor)
├── frontend/
│   ├── index.html             # Upload page (CSV import + CRUD modal)
│   ├── dashboard.html         # Dashboard (KPIs, categories, goals, fluxo)
│   ├── investimentos.html     # Investments & patrimony evolution
│   ├── categorias.html        # Gastos & receitas by category
│   ├── style.css              # All styles (dark theme)
│   ├── app.js                 # All frontend logic + modals
│   ├── charts.js              # Dashboard charts
│   ├── invest-charts.js       # Patrimony evolution line chart
│   ├── cat-charts.js          # Category bar charts
│   ├── consultor.html         # Investment consultant page
│   ├── consultor.js           # Consultant UI logic
│   └── sw.js                  # Service Worker (PWA)
├── docs/
│   ├── guia-completo.md       # Complete user guide
│   └── API.md                 # API reference
├── 99pay-extractor/           # Android app (Kotlin)
│   ├── app/src/main/java/com/financeai/ninetyninepay/
│   │   ├── model/
│   │   │   ├── Transaction.kt  # data class with toCSV()
│   │   │   └── Bank.kt         # Bank enum (99Pay, MP, Rico, B3)
│   │   ├── parsers/
│   │   │   ├── Parser.kt       # Parser interface
│   │   │   ├── ParserEngine.kt # Factory: selects parser by Bank
│   │   │   ├── Parser99Pay.kt  # *Desc*: ±R$1,23 (timestamp)
│   │   │   ├── ParserMercadoPago.kt  # Pagamento/recebido patterns
│   │   │   ├── ParserRico.kt   # Compra/venda ticker patterns
│   │   │   └── ParserB3.kt     # Trade/liquidação/proventos patterns
│   │   ├── extractor/
│   │   │   ├── OCREngine.kt          # ML Kit OCR wrapper
│   │   │   └── ScreenCaptureService.kt  # MediaProjection capture
│   │   ├── data/
│   │   │   └── TransactionRepository.kt  # Dedup + store
│   │   ├── export/
│   │   │   └── CSVExporter.kt      # CSV/JSON with fonte column
│   │   ├── ui/screens/
│   │   │   ├── HomeScreen.kt       # Bank selector + capture + export
│   │   │   └── PreviewScreen.kt    # Transaction list with summary
│   │   ├── ui/components/
│   │   │   ├── ProgressCard.kt     # Capture progress UI
│   │   │   └── TransactionItem.kt  # Row with fonte, date, desc, value
│   │   ├── ui/theme/
│   │   │   ├── Color.kt / Type.kt / Theme.kt
│   │   └── MainActivity.kt
├── database/
│   └── finance.db              # SQLite database
├── .github/workflows/
│   └── build-99pay-extractor.yml  # Build APK on push to 99pay-extractor/**
├── vercel.json                 # Frontend static deploy
└── AGENTS.md                   # This file
```

---

## Database Schema

```sql
CREATE TABLE contas (
  nome TEXT PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'banco',
  saldo_atual REAL NOT NULL DEFAULT 0
);

CREATE TABLE transacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte TEXT NOT NULL,
  conta TEXT NOT NULL,
  tipo TEXT NOT NULL,         -- 'entrada' | 'gasto' | 'investimento'
  valor REAL NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  descricao TEXT,
  categoria TEXT,
  data DATE NOT NULL,
  hash TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Reference

### CRUD Transações
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transacoes?limit=N&inicio=YYYY-MM-DD&fim=YYYY-MM-DD` | List |
| POST | `/transacoes` | Create (body: data, tipo, valor, moeda, conta, categoria, descricao) |
| PUT | `/transacoes/:id` | Update (same body, partial) |
| DELETE | `/transacoes/:id` | Delete |

### Dashboard & Reports
| Method | Endpoint | Query Params |
|--------|----------|-------------|
| GET | `/resumo` | `?inicio&fim` |
| GET | `/dashboard` | `?inicio&fim&moeda` |
| GET | `/categorias` | `?inicio&fim&moeda` |
| GET | `/categorias-list` | (no params) |
| GET | `/investimentos` | `?inicio&fim&moeda` |
| GET | `/contas` | (no params) |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | multipart: file + fonte |

---

## Key Decisions

### Data Flow
1. Android app captures screen → OCR → Parser (per bank) → CSV with `fonte` column
2. CSV imported via `/upload` → normalizer → categorizer → DB
3. Frontend renders via `/dashboard`, `/categorias`, `/investimentos`
4. CRUD via modal (POST/PUT/DELETE /transacoes)

### Brazilian Currency
- **Display**: `R$ 1.234,56` (pt-BR locale)
- **CSV export**: `1234.56` with `.` decimal (Locale.US) — critical for backend parsing
- **DB stores**: REAL with `.` decimal separator

### Termux Compatibility
- `better-sqlite3` does NOT compile on Termux/ARM64
- Use `sql.js` instead (WASM-based SQLite)
- Separate files: `*-termux.js` variants

### Period Filter
- Frontend: `<select>` with last 12 months
- Backend: query params `?inicio=YYYY-MM-DD&fim=YYYY-MM-DD`
- Applied to all report endpoints

### Hash Dedup
- `gerarHash()` in importer.js uses MD5 of: `data-valor-descricao-fonte-tipo-conta`
- Prevents duplicate transactions on re-import
- When editing via CRUD, hash is re-generated

### Categories
- Categorizer uses keyword → category rules in `categorizer.js`
- Base categories: alimentacao, moradia, transporte, saude, compras, streaming, lazer, salario, transferencia, investimento, financeiro, educacao, delivery
- Essential: alimentacao, moradia, transporte, saude
- Extras: lazer, compras, streaming, delivery
- Dash shows `percentual_por_categoria` for gastos + receitas

### Currency Separation
- `consolidator.js` returns `por_moeda[]` with per-currency totals
- Dashboard defaults to `moeda=BRL`
- Investimentos page also defaults to BRL

---

## Android Extractor (99pay-extractor/)

### Screen Capture
- Foreground Service + MediaProjection
- ImageReader captures full screen at 3s intervals
- Frames emitted via SharedFlow → collected by UI

### OCR
- Google ML Kit Text Recognition (Latin)
- Returns raw text from captured bitmap

### Parsers (per bank)
| Parser | Format | Example |
|--------|--------|---------|
| Parser99Pay | `*Desc*: ±R$1,23 (timestamp)` | `*Lucro*: +R$1,20 (2026-06-06 04:52:18)` |
| ParserMercadoPago | Payment/receipt descriptions with R$ values + BR dates | `Você pagou R$ 123,45` / `Recebido R$ 100,00` |
| ParserRico | Trade confirmations (compra/venda ticker qtd preço) | `Compra PETR4 100 R$ 28,50` + dividendos/taxas |
| ParserB3 | Settlement + proventos | `Liquido R$ 1.500,00` / `Dividendos R$ 200,00` |

### CSV Export Format
```
data,descricao,valor,tipo,fonte
2026-06-06,Lucro,1.20,entrada,99pay
2026-06-05,Pagamento com Pix enviado,1.50,saida,99pay
```

### Build
- GitHub Actions: triggered on push to `99pay-extractor/**` on `main`
- APK artifact: `99pay-extractor-debug` → download from Actions page
- Requires: JDK 17, Android SDK (setup-android action)

---

## Frontend Patterns

### Page Detection (app.js)
```javascript
const path = window.location.pathname;
if (path.includes('categorias')) initCategorias();
else if (path.includes('investimentos')) initInvest();
else if (path.includes('dashboard')) initDashboard();
else initUpload();
```

### API Base
```javascript
const API_BASE = location.hostname === 'localhost' ? '' : 'http://localhost:3000';
// When on Vercel: API calls go to localhost:3000 (backend must be running)
// When on localhost: empty string = same origin
```

### Period Filter
```javascript
function getPeriod() {
  const [ano, mes] = sel.value.split('-');
  const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
  return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${ultimoDia}` };
}
```

### Modal CRUD
- `openAdd()` / `openEdit(id)` / `closeModal()`
- `saveTransaction(e)` → POST or PUT based on `editId`
- `deleteTransacao(id)` → DELETE with confirm
- `loadSelectOptions()` → populates datalists for conta + categoria

---

## Deployment

### Vercel (Frontend)
- URL: https://cash-pied-ten.vercel.app
- Auto-deploy: push to `main` → Vercel rebuilds
- Static only: CSS, JS, HTML files
- Backend must run separately

### Local (Full Stack)
```bash
cd backend && node server.js
# Access http://localhost:3000
```

### Termux (Android)
```bash
cd backend && node server-termux.js
```

### Git Workflow
- `main` branch: production
- Push triggers: Vercel deploy (frontend) + GitHub Actions (APK)
- APK build only for `99pay-extractor/**` changes

---

## Testing

```bash
# Backend syntax check
node --check backend/server.js
node --check backend/engine/metrics.js
node --check backend/engine/conhecimento.js

# Start server
node backend/server.js
# Test endpoints:
#   curl http://localhost:3000/categorias
#   curl http://localhost:3000/investimentos
#   curl http://localhost:3000/consultor
#   curl http://localhost:3000/analise-carteira
```

---

## Session Log (2026-06-11)

### Done this session
- **Consultor de investimentos**: Base de conhecimento (renda fixa, variável, perfis, comparativos, educação, glossário), endpoint `/consultor` com busca textual, endpoint `/analise-carteira` com recomendações personalizadas baseadas em dados reais
- **Documentação**: `docs/guia-completo.md` (guia completo do sistema), `docs/API.md` (referência de todos os endpoints)
- **Termux sincronizado**: `server-termux.js`, `metrics-termux.js`, `consolidator-termux.js`, `importer-termux.js` — todos atualizados com os mesmos recursos do desktop (CRUD, investimentos, categorias, consultor, filtro período/moeda)
- **Navegação**: Consultor adicionado ao nav de todas as páginas
- **Limpeza**: `backend/filters.js` removido (arquivo obsoleto que categorizava errado)
- **Testado**: `/consultor`, `/analise-carteira`, `/categorias`, CRUD POST — todos OK
- **Commit**: `docs: documentacao completa + sync termux + navegacao consultor`
- **PWA**: manifest.json completo (ícones any+maskable, window-controls-overlay, categories), sw.js com cache-first assets + network-first API + fallback offline, registro sw adicionado ao consultor.html, ícones SVG com gradiente
- **Responsivo**: Nav horizontal com scroll, 6 breakpoints (900/768/480/360px), safe-area-inset para notch, touch targets 44px, tables viram cards em <480px, modal com 100dvh
- **Cores**: Background mais escuro (`#070b11`), acorde gradiente vibrante (`#8b6cff`), focus glow, scrollbar custom, `prefers-reduced-motion`
- **Commit**: `feat: PWA+responsivo+cores — manifest completo, sw com cache offlines, css mobile-first, scroll suave, acentos vibrantes, touch targets`

### Next Steps (proxima sessão)
1. Subir no Vercel (frontend já vai pegar automaticamente — verificar se consultor.html aparece)
2. Testar no celular: `git pull`, `./setup-termux.sh`, `node backend/server-termux.js`
3. Verificar status do APK build no GitHub Actions
4. Validar parsers MP/Rico/B3 com screenshots reais
5. Feature: orçamentos mensais por categoria com alertas visuais
6. Feature: busca/filtro avançado nas transações (texto, tipo, categoria)
7. Feature: exportar CSV do frontend (download filtrado)

## Known Limitations & TODOs

- [ ] **PWA**: Add push notifications, offline support for cached queries
- [ ] **Orçamentos**: Monthly budget per category with alerts
- [ ] **Busca**: Search/filter transactions by text, category, type
- [ ] **Export CSV**: Download filtered transactions from frontend
- [ ] **Multi-user**: Not needed (personal finance)
- [ ] **APK build**: Requires JDK locally for testing; rely on GitHub Actions
- [ ] **Parser validation**: Mercado Pago, Rico, B3 parsers need real screen testing
- [ ] **Termux mobile test**: Verify all endpoints on Android browser
