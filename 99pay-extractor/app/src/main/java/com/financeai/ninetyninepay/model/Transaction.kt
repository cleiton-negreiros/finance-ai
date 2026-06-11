package com.financeai.ninetyninepay.model

import java.util.Locale

data class Transaction(
    val data: String,
    val descricao: String,
    val valor: Double,
    val tipo: Tipo
) {
    enum class Tipo { ENTRADA, SAIDA }

    fun toCSV(): String {
        return "${data},${escapeCsv(descricao)},${"%.2f".format(Locale.US, valor)},${tipo.name.lowercase()}"
    }

    private fun escapeCsv(s: String): String {
        return if (s.contains(',') || s.contains('"')) {
            "\"${s.replace("\"", "\"\"")}\""
        } else s
    }

    fun toJson(): String {
        return """{"data":"$data","descricao":"${descricao.replace("\"","\\\"")}","valor":$valor,"tipo":"${tipo.name.lowercase()}"}"""
    }
}
