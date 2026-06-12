package com.financeai.ninetyninepay.model

import java.util.Locale

data class Transaction(
    val data: String,
    val descricao: String,
    val valor: Double,
    val tipo: Tipo,
    val fonte: Bank = Bank.NOVENTA_NOVE_PAY
) {
    enum class Tipo { ENTRADA, SAIDA }

    fun toCSV(): String {
        val valorFormat = "%.2f".format(Locale.US, valor)
        return "${data},${escapeCsv(descricao)},${valorFormat},${tipo.name.lowercase()},${fonte.slug}"
    }

    private fun escapeCsv(s: String): String {
        return if (s.contains(',') || s.contains('"')) {
            "\"${s.replace("\"", "\"\"")}\""
        } else s
    }

    fun toJson(): String {
        return """{"data":"$data","descricao":"${descricao.replace("\"","\\\"")}","valor":$valor,"tipo":"${tipo.name.lowercase()}","fonte":"${fonte.slug}"}"""
    }
}
