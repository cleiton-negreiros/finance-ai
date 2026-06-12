package com.financeai.ninetyninepay.model

enum class Bank(val displayName: String, val slug: String) {
    NOVENTA_NOVE_PAY("99Pay", "99pay"),
    MERCADO_PAGO("Mercado Pago", "mercadopago"),
    RICO("Rico", "rico"),
    B3("B3", "b3");

    companion object {
        fun fromSlug(slug: String): Bank =
            entries.firstOrNull { it.slug == slug } ?: NOVENTA_NOVE_PAY
    }
}
