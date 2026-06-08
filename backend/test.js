import { initDB, getDB, closeDB } from './db.js';
import { importCSV } from './importer.js';
import { consolidar } from './engine/consolidator.js';
import { calcularMetricas } from './engine/metrics.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runTests() {
  console.log('=== Testando Finance AI ===\n');

  console.log('1. Inicializando banco...');
  initDB();
  console.log('   OK\n');

  console.log('2. Importando C6 CSV...');
  const c6Path = join(__dirname, '..', 'samples', 'c6.csv');
  const result1 = await importCSV(c6Path, 'c6');
  console.log(`   Total: ${result1.total}, Inseridas: ${result1.inseridas}, Duplicatas: ${result1.duplicatas}`);
  console.assert(result1.inseridas > 0, 'Deveria importar transacoes C6');
  console.log('   OK\n');

  console.log('3. Importando Mercado Pago CSV...');
  const mpPath = join(__dirname, '..', 'samples', 'mercadopago.csv');
  const result2 = await importCSV(mpPath, 'mercadopago');
  console.log(`   Total: ${result2.total}, Inseridas: ${result2.inseridas}, Duplicatas: ${result2.duplicatas}`);
  console.assert(result2.inseridas > 0, 'Deveria importar transacoes MP');
  console.log('   OK\n');

  console.log('4. Testando prevencao de duplicatas...');
  const result3 = await importCSV(c6Path, 'c6');
  console.log(`   Duplicatas ignoradas: ${result3.duplicatas}`);
  console.assert(result3.duplicatas > 0, 'Deveria detectar duplicatas');
  console.log('   OK\n');

  console.log('5. Verificando transacoes...');
  const db = getDB();
  const total = db.prepare('SELECT COUNT(*) as count FROM transacoes').get();
  console.log(`   Total transacoes: ${total.count}`);
  console.assert(total.count > 0, 'Deveria ter transacoes');
  console.log('   OK\n');

  console.log('6. Verificando contas...');
  const contas = db.prepare('SELECT * FROM contas').all();
  console.log(`   Contas cadastradas: ${contas.length}`);
  console.assert(contas.length > 0, 'Deveria ter contas');
  contas.forEach(c => console.log(`     - ${c.nome} (${c.tipo})`));
  console.log('   OK\n');

  console.log('7. Testando consolidacao...');
  const cons = consolidar();
  console.log(`   Saldo total: ${cons.saldo_total}`);
  console.log(`   Total entrada: ${cons.total_entrada}`);
  console.log(`   Total saida: ${cons.total_saida}`);
  console.log(`   Contas: ${cons.saldo_por_conta.length}`);
  console.log('   OK\n');

  console.log('8. Testando metricas...');
  const met = calcularMetricas();
  console.log(`   Custo de vida: ${met.custo_vida}`);
  console.log(`   Despesas extras: ${met.despesas_extras}`);
  console.log(`   Investido: ${met.investido}`);
  console.log(`   Categorias: ${met.percentual_por_categoria.length}`);
  console.log(`   Fluxo mensal: ${met.fluxo_mensal.length} meses`);
  console.log('   OK\n');

  closeDB();
  console.log('=== Todos os testes passaram ===');
}

runTests().catch(err => {
  console.error('Teste falhou:', err);
  process.exit(1);
});
