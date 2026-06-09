package com.financeai.ninetyninepay.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.financeai.ninetyninepay.model.Transaction
import com.financeai.ninetyninepay.ui.theme.*

@Composable
fun TransactionRow(tx: Transaction) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = formatDate(tx.data),
            style = MaterialTheme.typography.bodyMedium,
            color = Gray200,
            modifier = Modifier.width(80.dp)
        )
        Text(
            text = tx.descricao,
            style = MaterialTheme.typography.bodyMedium,
            color = Gray50,
            modifier = Modifier.weight(1f).padding(end = 12.dp),
            maxLines = 1
        )
        Text(
            text = "${if (tx.tipo == Transaction.Tipo.SAIDA) "-" else "+"} R$ ${"%.2f".format(tx.valor)}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = if (tx.tipo == Transaction.Tipo.SAIDA) Red else Green
        )
    }
}

private fun formatDate(iso: String): String {
    val parts = iso.split("-")
    return if (parts.size == 3) "${parts[2]}/${parts[1]}" else iso.take(5)
}
