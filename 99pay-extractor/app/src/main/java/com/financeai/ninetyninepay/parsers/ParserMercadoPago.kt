package com.financeai.ninetyninepay.parsers

import com.financeai.ninetyninepay.model.Bank
import com.financeai.ninetyninepay.model.Transaction
import java.util.Locale

class ParserMercadoPago : Parser {

    private val saidaPatterns = listOf(
        Regex("""(?:pagamento|voce pagou|transferencia enviada|recarga|boleto|debito|compra\s*no\s*credito|cobranca)\s*:?\s*r?\$?\s*([\d\.,]+)""", RegexOption.IGNORE_CASE),
        Regex("""r?\$?\s*([\d\.,]+)\s*(?:em\s+)?(?:pagamento|transferencia|recarga|boleto)""", RegexOption.IGNORE_CASE),
    )

    private val entradaPatterns = listOf(
        Regex("""(?:recebido|recebemos|transferencia recebida|cobranca recebida|pagamento recebido|estorno|reembolso)\s*(?:de)?\s*:?\s*r?\$?\s*([\d\.,]+)""", RegexOption.IGNORE_CASE),
        Regex("""r?\$?\s*([\d\.,]+)\s*(?:recebido|recebemos|transferencia)""", RegexOption.IGNORE_CASE),
    )

    private val datePattern = Regex("""(\d{2})\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*(\d{4}|\d{2})""", RegexOption.IGNORE_CASE)

    private val genericValue = Regex("""r?\$?\s*([\d\.,]+)""", RegexOption.IGNORE_CASE)

    private val monthMap = mapOf(
        "jan" to 1, "fev" to 2, "mar" to 3, "abr" to 4, "mai" to 5, "jun" to 6,
        "jul" to 7, "ago" to 8, "set" to 9, "out" to 10, "nov" to 11, "dez" to 12
    )

    override fun parse(rawText: String): Parser.ParseResult {
        val lines = rawText.lines()
            .map { it.trim() }
            .filter { it.isNotBlank() }

        val transactions = mutableListOf<Transaction>()
        val errors = mutableListOf<String>()
        val seen = mutableSetOf<String>()

        val currentDate = extractDate(rawText)

        for (line in lines) {
            try {
                val lineDate = extractDate(line) ?: currentDate

                var found = false

                for (pat in entradaPatterns) {
                    val m = pat.find(line)
                    if (m != null) {
                        val v = parseValue(m.groupValues[1])
                        if (v != null) {
                            val key = "${lineDate}_${m.value}_$v"
                            if (key !in seen) {
                                seen.add(key)
                                transactions.add(Transaction(lineDate, m.value.take(60), v, Transaction.Tipo.ENTRADA, Bank.MERCADO_PAGO))
                            }
                            found = true
                            break
                        }
                    }
                }

                if (!found) {
                    for (pat in saidaPatterns) {
                        val m = pat.find(line)
                        if (m != null) {
                            val v = parseValue(m.groupValues[1])
                            if (v != null) {
                                val key = "${lineDate}_${m.value}_$v"
                                if (key !in seen) {
                                    seen.add(key)
                                    transactions.add(Transaction(lineDate, m.value.take(60), v, Transaction.Tipo.SAIDA, Bank.MERCADO_PAGO))
                                }
                                found = true
                                break
                            }
                        }
                    }
                }

                if (!found) {
                    val gm = genericValue.findAll(line).toList()
                    if (gm.size == 1 && line.length < 80) {
                        val v = parseValue(gm[0].groupValues[1])
                        if (v != null) {
                            val desc = line.replace(Regex("""r?\$?\s*[\d\.,]+""", RegexOption.IGNORE_CASE), "").trim().take(40)
                            val key = "${lineDate}_${desc}_$v"
                            if (key !in seen && desc.length > 3) {
                                seen.add(key)
                                val tipo = if (line.contains("debito", true) || line.contains("pagamento", true) || line.contains("pix enviado", true)) Transaction.Tipo.SAIDA else Transaction.Tipo.ENTRADA
                                transactions.add(Transaction(lineDate, desc.ifEmpty { "Mercado Pago" }, v, tipo, Bank.MERCADO_PAGO))
                            }
                        }
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

    private fun extractDate(text: String): String? {
        val m = datePattern.find(text) ?: return null
        val day = m.groupValues[1].padStart(2, '0')
        val month = monthMap[m.groupValues[2].lowercase(Locale.ROOT)]?.toString()?.padStart(2, '0') ?: return null
        val yearRaw = m.groupValues[3]
        val year = if (yearRaw.length == 2) "20$yearRaw" else yearRaw
        return "$year-$month-$day"
    }

    private fun parseValue(raw: String): Double? {
        val clean = raw.replace("R", "").replace("$", "").replace(" ", "").trim()
        val normalized = clean.replace(".", "").replace(",", ".")
        return normalized.toDoubleOrNull()
    }
}
