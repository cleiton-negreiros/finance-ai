import { initDB, getDB, closeDB } from './db.js';
import { importCSV } from './importer.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runTests() {
  console.log('=== Testando Finance AI ===\n');

  // Test 1: Init DB
  console.log('1. Inicializando banco...');
  initDB();
  console.log('   OK\n');

  // Test 2: Import C6 CSV
  console.log('2. Importando C6 CSV...');
  const c6Path = join(__dirname, '..', 'samples', 'c6.csv');
  const result1 = await importCSV(c6Path, 'c6');
  console.log(`   Total: ${result1.total}, Inseridas: ${result1.inseridas}, Duplicatas: ${result1.duplicatas}`);
  console.assert(result1.inseridas > 0, 'Deveria importar transacoes C6');
  console.log('   OK\n');

  // Test 3: Import Mercado Pago CSV
  console.log('3. Importando Mercado Pago CSV...');
  const mpPath = join(__dirname, '..', 'samples', 'mercadopago.csv');
  const result2 = await importCSV(mpPath, 'mercadopago');
  console.log(`   Total: ${result2.total}, Inseridas: ${result2.inseridas}, Duplicatas: ${result2.duplicatas}`);
  console.assert(result2.inseridas > 0, 'Deveria importar transacoes MP');
  console.log('   OK\n');

  // Test 4: Duplicate prevention
  console.log('4. Testando prevencao de duplicatas...');
  const result3 = await importCSV(c6Path, 'c6');
  console.log(`   Duplicatas ignoradas: ${result3.duplicatas}`);
  console.assert(result3.duplicatas > 0, 'Deveria detectar duplicatas');
  console.log('   OK\n');

  // Test 5: Query data
  console.log('5. Consultando transacoes...');
  const db = getDB();
  const total = db.prepare('SELECT COUNT(*) as count FROM transacoes').get();
  console.log(`   Total transacoes no banco: ${total.count}`);
  console.assert(total.count > 0, 'Deveria ter transacoes no banco');
  console.log('   OK\n');

  // Test 6: Categories
  console.log('6. Verificando categorias...');
  const cats = db.prepare('SELECT categoria, COUNT(*) as count FROM transacoes GROUP BY categoria ORDER BY count DESC').all();
  console.log(`   Categorias encontradas: ${cats.map(c => `${c.categoria}(${c.count})`).join(', ')}`);
  console.log('   OK\n');

  closeDB();
  console.log('=== Todos os testes passaram ===');
}

runTests().catch(err => {
  console.error('Teste falhou:', err);
  process.exit(1);
});
