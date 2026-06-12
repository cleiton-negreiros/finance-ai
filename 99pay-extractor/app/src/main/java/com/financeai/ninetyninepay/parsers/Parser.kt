package com.financeai.ninetyninepay.parsers

import com.financeai.ninetyninepay.model.Transaction

interface Parser {
    fun parse(rawText: String): ParseResult

    data class ParseResult(
        val transactions: List<Transaction>,
        val rawLines: List<String>,
        val errors: List<String>
    )
}
