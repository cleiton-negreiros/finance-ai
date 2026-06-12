package com.financeai.ninetyninepay.parsers

import com.financeai.ninetyninepay.model.Bank
import com.financeai.ninetyninepay.model.Transaction

class Parser99Pay : Parser {

    private val pattern = Regex(
        """([\s\S]*?)\s*\((\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\)\s*\*\s*\*(.*?)\*:\s*([-+]?\s*R?\$?\s*[\d\.,]+)""",
        setOf(RegexOption.MULTILINE)
    )

    override fun parse(rawText: String): Parser.ParseResult {
        val lines = rawText.lines()
            .map { it.trim() }
            .filter { it.isNotBlank() }

        val transactions = mutableListOf<Transaction>()
        val errors = mutableListOf<String>()
        val seen = mutableSetOf<String>()

        for (line in lines) {
            try {
                val match = pattern.find(line)
                if (match != null) {
                    val data = match.groupValues[2].trim()
                    val descricao = match.groupValues[3].trim()
                    val raw = match.groupValues[4].trim()
                    val hasMinus = raw.startsWith("-")
                    val clean = raw.replace("-", "").replace("+", "").replace("R", "").replace("$", "").trim()
                    val valorStr = clean.replace(".", "").replace(",", ".")
                    val valor = (if (hasMinus) -1 else 1) * (valorStr.toDoubleOrNull() ?: continue)

                    val tipo = if (valor < 0) Transaction.Tipo.SAIDA else Transaction.Tipo.ENTRADA

                    val dedupKey = "${data}_${descricao}_${kotlin.math.abs(valor)}"
                    if (dedupKey !in seen) {
                        seen.add(dedupKey)
                        transactions.add(Transaction(data, descricao, kotlin.math.abs(valor), tipo, Bank.NOVENTA_NOVE_PAY))
                    }
                }
            } catch (e: Exception) {
                errors.add("Erro na linha: ${line.take(60)} -> ${e.message}")
            }
        }

        transactions.sortBy { it.data }

        val deduped = transactions.distinctBy { "${it.data}_${it.descricao}_${it.valor}" }

        return Parser.ParseResult(
            transactions = deduped,
            rawLines = lines,
            errors = errors
        )
    }
}
