package com.financeai.ninetyninepay.parsers

import com.financeai.ninetyninepay.model.Bank

object ParserEngine {
    private val parsers = mapOf(
        Bank.NOVENTA_NOVE_PAY to Parser99Pay(),
        Bank.MERCADO_PAGO to ParserMercadoPago(),
        Bank.RICO to ParserRico(),
        Bank.B3 to ParserB3(),
    )

    fun parserFor(bank: Bank): Parser =
        parsers[bank] ?: Parser99Pay()
}
