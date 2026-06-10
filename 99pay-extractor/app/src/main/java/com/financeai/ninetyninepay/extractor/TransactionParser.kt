package com.financeai.ninetyninepay.extractor

import com.financeai.ninetyninepay.model.Transaction

class TransactionParser {

    private val pattern = Regex(
        """(\d{2}[/-]\d{2}(?:[/-]\d{2,4})?)\s+(.*?)\s*([-+]?\s*R?\$?\s*[\d\.,]+)""",
        setOf(RegexOption.MULTILINE)
    )

    data class ParseResult(
        val transactions: List<Transaction>,
        val rawLines: List<String>,
        val errors: List<String>
    )

    fun parse(rawText: String): ParseResult {
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
                    val data = normalizeDate(match.groupValues[1])
                    val descricao = match.groupValues[2].trim()
                    val raw = match.groupValues[3].trim()
                    val hasMinus = raw.startsWith("-")
                    val clean = raw.replace("-", "").replace("+", "").replace("R", "").replace("$", "").trim()
                    val valorStr = clean.replace(".", "").replace(",", ".")
                    val valor = (if (hasMinus) -1 else 1) * (valorStr.toDoubleOrNull() ?: continue)

                    val tipo = if (valor < 0) Transaction.Tipo.SAIDA else Transaction.Tipo.ENTRADA

                    val dedupKey = "${data}_${descricao}_${kotlin.math.abs(valor)}"
                    if (dedupKey !in seen) {
                        seen.add(dedupKey)
                        transactions.add(Transaction(data, descricao, valor, tipo))
                    }
                }
            } catch (e: Exception) {
                errors.add("Erro na linha: ${line.take(60)} -> ${e.message}")
            }
        }

        transactions.sortBy { it.data }

        return ParseResult(
            transactions = transactions.distinctBy { "${it.data}_${it.descricao}_${it.valor}" },
            rawLines = lines,
            errors = errors
        )
    }

    private fun normalizeDate(dateStr: String): String {
        val clean = dateStr.replace("-", "/")
        val parts = clean.split("/")
        return when (parts.size) {
            2 -> {
                val dia = parts[0].padStart(2, '0')
                val mes = parts[1].padStart(2, '0')
                val ano = guessYear(mes)
                "${ano}-${mes}-${dia}"
            }
            3 -> {
                val dia = parts[0].padStart(2, '0')
                val mes = parts[1].padStart(2, '0')
                val ano = if (parts[2].length == 2) "20${parts[2]}" else parts[2]
                "${ano}-${mes}-${dia}"
            }
            else -> dateStr
        }
    }

    private fun guessYear(mes: String): String {
        val cal = java.util.Calendar.getInstance()
        val currentYear = cal.get(java.util.Calendar.YEAR)
        val currentMonth = cal.get(java.util.Calendar.MONTH) + 1
        val m = mes.toIntOrNull() ?: return currentYear.toString()
        return if (m > currentMonth + 1) (currentYear - 1).toString() else currentYear.toString()
    }
}
