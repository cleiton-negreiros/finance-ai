CREATE TABLE IF NOT EXISTS contas (
  nome TEXT PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'banco',
  saldo_atual REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte TEXT NOT NULL,
  conta TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor REAL NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  descricao TEXT,
  categoria TEXT,
  data DATE NOT NULL,
  hash TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_conta ON transacoes(conta);
CREATE INDEX IF NOT EXISTS idx_transacoes_hash ON transacoes(hash);
