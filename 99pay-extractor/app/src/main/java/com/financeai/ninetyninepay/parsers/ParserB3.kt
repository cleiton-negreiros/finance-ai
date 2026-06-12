package com.financeai.ninetyninepay.parsers

import com.financeai.ninetyninepay.model.Bank
import com.financeai.ninetyninepay.model.Transaction
import java.util.Locale

class ParserB3 : Parser {

    private val tradePattern = Regex(
        """(\d{2}/\d{2}/\d{4})\s*(?:.*?)?\s*(compra|venda|call|put)\s*(?:de\s*)?(\w{4}\d{1,2})\s*(\d+)?(?:\s*x\s*)?r?\$?\s*([\d\.,]+)""",
        RegexOption.IGNORE_CASE
    )

    private val liquidPattern = Regex(
        """(?:liquido|liquidacao|net|total|valor liquido)\s*:?\s*r?\$?\s*([\d\.,]+)""",
        RegexOption.IGNORE_CASE
    )

    private val proventoPattern = Regex(
        """(?:proventos?|dividendos?|juros\s*s\/c|jcp|rendimento|aluguel)\s*:?\s*r?\$?\s*([\d\.,]+)""",
        RegexOption.IGNORE_CASE
    )

    private val taxaPattern = Regex(
        """(?:taxa|corretagem|emolumentos?|irrf|iss|imposto|custodia|registro)\s*:?\s*r?\$?\s*([\d\.,]+)""",
        RegexOption.IGNORE_CASE
    )

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
                    val data = tradeMatch.groupValues[1]
                    val parts = data.split("/")
                    val isoDate = "${parts[2]}-${parts[1]}-${parts[0]}"
                    val oper = tradeMatch.groupValues[2].lowercase(Locale.ROOT)
                    val ticker = tradeMatch.groupValues[3].uppercase(Locale.ROOT)
                    val qtd = tradeMatch.groupValues[4]
                    val preco = parseValue(tradeMatch.groupValues[5])
                    if (preco != null) {
                        val total = preco * (qtd.toDoubleOrNull() ?: 1.0)
                        val desc = "${oper.uppercase().first()}${oper.drop(1)} $ticker${if (qtd.isNotEmpty()) " $qtd" else ""}"
                        val tipo = if (oper == "compra" || oper == "call") Transaction.Tipo.SAIDA else Transaction.Tipo.ENTRADA
                        val key = "${isoDate}_${desc}_$total"
                        if (key !in seen) {
                            seen.add(key)
                            transactions.add(Transaction(isoDate, desc, total, tipo, Bank.B3))
                        }
                        continue
                    }
                }

                val liqMatch = liquidPattern.find(line)
                if (liqMatch != null) {
                    val v = parseValue(liqMatch.groupValues[1])
                    if (v != null) {
                        val key = "${currentDate}_${liqMatch.value}_$v"
                        if (key !in seen) {
                            seen.add(key)
                            val tipo = if (v >= 0) Transaction.Tipo.ENTRADA else Transaction.Tipo.SAIDA
                            transactions.add(Transaction(currentDate, liqMatch.value.take(50), kotlin.math.abs(v), tipo, Bank.B3))
                        }
                        continue
                    }
                }

                val provMatch = proventoPattern.find(line)
                if (provMatch != null) {
                    val v = parseValue(provMatch.groupValues[1])
                    if (v != null) {
                        val key = "${currentDate}_${provMatch.value}_$v"
                        if (key !in seen) {
                            seen.add(key)
                            transactions.add(Transaction(currentDate, provMatch.value.take(50), v, Transaction.Tipo.ENTRADA, Bank.B3))
                        }
                        continue
                    }
                }

                val taxaMatch = taxaPattern.find(line)
                if (taxaMatch != null) {
                    val v = parseValue(taxaMatch.groupValues[1])
                    if (v != null) {
                        val key = "${currentDate}_${taxaMatch.value}_$v"
                        if (key !in seen) {
                            seen.add(key)
                            transactions.add(Transaction(currentDate, taxaMatch.value.take(50), v, Transaction.Tipo.SAIDA, Bank.B3))
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
        val hasCentavos = clean.contains(",")
        val normalized = if (hasCentavos) {
            val lastComma = clean.lastIndexOf(",")
            clean.substring(0, lastComma).replace(".", "") + "." + clean.substring(lastComma + 1)
        } else {
            clean.replace(".", "")
        }
        return normalized.toDoubleOrNull()
    }
}
