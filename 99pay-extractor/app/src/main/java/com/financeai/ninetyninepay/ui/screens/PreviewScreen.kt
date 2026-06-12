package com.financeai.ninetyninepay.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.financeai.ninetyninepay.model.Transaction
import com.financeai.ninetyninepay.ui.components.TransactionRow
import com.financeai.ninetyninepay.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreviewScreen(
    transactions: List<Transaction>,
    onBack: () -> Unit
) {
    val entradaSum = transactions.filter { it.tipo == Transaction.Tipo.ENTRADA }.sumOf { it.valor }
    val saidaSum = transactions.filter { it.tipo == Transaction.Tipo.SAIDA }.sumOf { it.valor }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Resumo", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Voltar", tint = Gray50)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Gray900)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Gray700)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(20.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Entradas", style = MaterialTheme.typography.labelSmall, color = Green)
                        Text("R$ ${"%.2f".format(entradaSum)}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Green)
                        Text("${transactions.filter { it.tipo == Transaction.Tipo.ENTRADA }.size} transacoes",
                            style = MaterialTheme.typography.labelSmall, color = Gray200)
                    }
                    HorizontalDivider(
                        modifier = Modifier.height(60.dp).width(1.dp),
                        color = Gray600
                    )
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Saidas", style = MaterialTheme.typography.labelSmall, color = Red)
                        Text("R$ ${"%.2f".format(saidaSum)}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Red)
                        Text("${transactions.filter { it.tipo == Transaction.Tipo.SAIDA }.size} transacoes",
                            style = MaterialTheme.typography.labelSmall, color = Gray200)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            Text(
                "${transactions.size} transacoes encontradas",
                style = MaterialTheme.typography.titleMedium,
                color = Gray50
            )

            Spacer(Modifier.height(8.dp))

            HorizontalDivider(color = Gray600)

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(transactions) { tx -> TransactionRow(tx) }
            }
        }
    }
}
