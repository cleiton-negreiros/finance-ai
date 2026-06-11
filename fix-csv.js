#!/bin/bash
# fix-csv.js - Converte vírgula decimal para ponto no CSV exportado do 99Pay
# Uso: node fix-csv.js arquivo.csv > arquivo-corrigido.csv

import { readFileSync, writeFileSync } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Uso: node fix-csv.js arquivo.csv > saida.csv');
  process.exit(1);
}

const csv = readFileSync(filePath, 'utf-8');
const lines = csv.split('\n');
const header = lines[0];

// Parse CSV corrigindo valores com vírgula decimal
const corrected = [header];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Encontra os campos corretamente considerando vírgula decimal
  const parts = line.split(',');
  
  // Formato esperado: data,,valor,tipo (4 colunas)
  // Mas se valor tem vírgula: data,,5,00,tipo → 5 colunas
  
  if (parts.length === 5) {
    // Caso com vírgula decimal: data,descricao,valor_int,valor_dec,tipo
    const data = parts[0];
    const descricao = parts[1];
    const valor = `${parts[2]}.${parts[3]}`;
    const tipo = parts[4];
    corrected.push(`${data},${descricao},${valor},${tipo}`);
  } else {
    // Já está correto
    corrected.push(line);
  }
}

writeFileSync(filePath.replace('.csv', '-corrigido.csv'), corrected.join('\n'), 'utf-8');
console.log(`Arquivo corrigido salvo: ${filePath.replace('.csv', '-corrigido.csv')}`);
console.log(`Total de linhas: ${corrected.length}`);
