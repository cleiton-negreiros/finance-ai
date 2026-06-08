CREATE TABLE IF NOT EXISTS transacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_transacoes_fonte ON transacoes(fonte);
CREATE INDEX IF NOT EXISTS idx_transacoes_hash ON transacoes(hash);
