package com.financeai.ninetyninepay.extractor

import com.financeai.ninetyninepay.model.Transaction

class TransactionParser {

    private val pattern = Regex(
        """(\d{2}/\d{2})\s+(.*?)\s*R?\$?\s?([-+]?\d[\d\.,]*\d{2})""",
        setOf(RegexOption.MULTILINE, RegexOption.DOT_MATCHES_ALL)
    )

    private val limpoPattern = Regex(
        """(\d{2}/\d{2})""",
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
                    val valorStr = match.groupValues[3]
                        .replace(".", "")
                        .replace(",", ".")
                    val valor = valorStr.toDoubleOrNull() ?: continue

                    val tipo = if (valor < 0) Transaction.Tipo.SAIDA else Transaction.Tipo.ENTRADA
                    val absValor = kotlin.math.abs(valor)

                    val dedupKey = "${data}_${descricao}_${absValor}"
                    if (dedupKey !in seen) {
                        seen.add(dedupKey)
                        transactions.add(Transaction(data, descricao, absValor, tipo))
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
        val parts = dateStr.split("/")
        if (parts.size == 2) {
            val dia = parts[0].padStart(2, '0')
            val mes = parts[1].padStart(2, '0')
            val ano = guessYear(mes)
            return "${ano}-${mes}-${dia}"
        }
        return dateStr
    }

    private fun guessYear(mes: String): String {
        val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
        val currentMonth = java.util.Calendar.getInstance().get(java.util.Calendar.MONTH) + 1
        val m = mes.toIntOrNull() ?: return currentYear.toString()
        return if (m > currentMonth + 1) (currentYear - 1).toString() else currentYear.toString()
    }
}
