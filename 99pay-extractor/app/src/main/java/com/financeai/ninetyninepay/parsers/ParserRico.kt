package com.financeai.ninetyninepay.parsers

import com.financeai.ninetyninepay.model.Bank
import com.financeai.ninetyninepay.model.Transaction
import java.util.Locale

class ParserRico : Parser {

    private val tradePattern = Regex(
        """(compra|venda)\s*:?\s*(\w+)\s*:?\s*(\d+)?\s*(?:x\s*)?r?\$?\s*([\d\.,]+)(?:\s*\((\d{2}/\d{2}/\d{4})\))?""",
        RegexOption.IGNORE_CASE
    )

    private val dividendPattern = Regex(
        """(?:dividendos?|juros\s*(?:sobre|s\/)?\s*(?:capital|cp)|jcp|rendimento)\s*:?\s*r?\$?\s*([\d\.,]+)""",
        RegexOption.IGNORE_CASE
    )

    private val entradaPattern = Regex(
        """(?:credito|entrada|deposito|transferencia recebida|proventos?|bonus|venda)\s*:?\s*r?\$?\s*([\d\.,]+)""",
        RegexOption.IGNORE_CASE
    )

    private val saidaPattern = Regex(
        """(?:debito|saida|taxa|corretagem|emolumentos?|irrf|imposto|transferencia enviada|compra)\s*:?\s*r?\$?\s*([\d\.,]+)""",
        RegexOption.IGNORE_CASE
    )

    private val genericValue = Regex("""r?\$?\s*([\d\.,]+)""", RegexOption.IGNORE_CASE)

    override fun parse(rawText: String): Parser.ParseResult {
        val lines = rawText.lines()
            .map { it.trim() }
            .filter { it.isNotBlank() }

        val transactions = mutableListOf<Transaction>()
        val errors = mutableListOf<String>()
        val seen = mutableSetOf<String>()

        var currentDate = ""

        for (line in lines) {
            try {
                val dateMatch = Regex("""(\d{2}/\d{2}/\d{4})""").find(line)
                if (dateMatch != null) {
                    val parts = dateMatch.groupValues[1].split("/")
                    currentDate = "${parts[2]}-${parts[1]}-${parts[0]}"
                }

                if (currentDate.isEmpty()) continue

                val tradeMatch = tradePattern.find(line)
                if (tradeMatch != null) {
                    val operacao = tradeMatch.groupValues[1].lowercase(Locale.ROOT)
                    val ticker = tradeMatch.groupValues[2].uppercase(Locale.ROOT)
                    val qtd = tradeMatch.groupValues[3]
                    val valor = parseValue(tradeMatch.groupValues[4])
                    if (valor != null) {
                        val desc = "${operacao.uppercase().first()}${operacao.drop(1)} ${ticker}${if (qtd.isNotEmpty()) " $qtd" else ""}"
                        val tipo = if (operacao == "compra") Transaction.Tipo.SAIDA else Transaction.Tipo.ENTRADA
                        val total = valor * (qtd.toDoubleOrNull() ?: 1.0)
                        val key = "${currentDate}_${desc}_$total"
                        if (key !in seen) {
                            seen.add(key)
                            transactions.add(Transaction(currentDate, desc, total, tipo, Bank.RICO))
                        }
                        continue
                    }
                }

                val divMatch = dividendPattern.find(line)
                if (divMatch != null) {
                    val v = parseValue(divMatch.groupValues[1])
                    if (v != null) {
                        val key = "${currentDate}_${divMatch.value}_$v"
                        if (key !in seen) {
                            seen.add(key)
                            transactions.add(Transaction(currentDate, divMatch.value.take(50), v, Transaction.Tipo.ENTRADA, Bank.RICO))
                        }
                        continue
                    }
                }

                val entMatch = entradaPattern.find(line)
                if (entMatch != null) {
                    val v = parseValue(entMatch.groupValues[1])
                    if (v != null) {
                        val key = "${currentDate}_${entMatch.value}_$v"
                        if (key !in seen) {
                            seen.add(key)
                            transactions.add(Transaction(currentDate, entMatch.value.take(50), v, Transaction.Tipo.ENTRADA, Bank.RICO))
                        }
                        continue
                    }
                }

                val saiMatch = saidaPattern.find(line)
                if (saiMatch != null) {
                    val v = parseValue(saiMatch.groupValues[1])
                    if (v != null) {
                        val key = "${currentDate}_${saiMatch.value}_$v"
                        if (key !in seen) {
                            seen.add(key)
                            transactions.add(Transaction(currentDate, saiMatch.value.take(50), v, Transaction.Tipo.SAIDA, Bank.RICO))
                        }
                        continue
                    }
                }
            } catch (e: Exception) {
                errors.add("Erro: ${line.take(60)} -> ${e.message}")
            }
        }

        transactions.sortBy { it.data }

        return Parser.ParseResult(
            transactions = transactions.distinctBy { "${it.data}_${it.descricao}_${it.valor}" },
            rawLines = lines,
            errors = errors
        )
    }

    private fun parseValue(raw: String): Double? {
        val clean = raw.replace("R", "").replace("$", "").replace(" ", "").trim()
        val normalized = clean.replace(".", "").replace(",", ".")
        return normalized.toDoubleOrNull()
    }
}
