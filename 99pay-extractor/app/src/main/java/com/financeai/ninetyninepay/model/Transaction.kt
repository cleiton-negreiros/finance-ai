package com.financeai.ninetyninepay.model

data class Transaction(
    val data: String,
    val descricao: String,
    val valor: Double,
    val tipo: Tipo
) {
    enum class Tipo { ENTRADA, SAIDA }

    fun toCSV(): String {
        val signal = if (tipo == Tipo.SAIDA) "-" else ""
        return "${data},${escapeCsv(descricao)},${signal}${"%.2f".format(valor)}"
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
