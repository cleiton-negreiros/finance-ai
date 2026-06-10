package com.financeai.ninetyninepay.extractor

import com.financeai.ninetyninepay.model.Transaction

class TransactionParser {

    private val pattern = Regex(
        """([\s\S]*?)\s*\((\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\)\s*\*\s*\*(.*?)\*:\s*([-+]?\s*R?\$?\s*[\d\.,]+)""",
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
        return dateStr
    }

    fun testParse(): ParseResult {
        val testText = """*Lucro*: +R$1,20 (2026-06-06 04:52:18)
*Pagamento com Pix enviado*: -R$1,50 (2026-06-05 16:02:26)
*Lucro*: +R$1,20 (2026-06-05 05:15:38)
*Pagamento com Pix enviado*: -R$7,00 (2026-06-04 22:02:27)
*Lucro*: +R$1,21 (2026-06-04 04:43:50)
*Pagamento com Pix enviado*: -R$15,00 (2026-06-03 19:59:45)
*Lucro*: +R$1,21 (2026-06-03 06:05:10)"""
        
        return parse(testText)
    }


}
