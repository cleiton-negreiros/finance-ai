package com.financeai.ninetyninepay.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import com.financeai.ninetyninepay.ui.theme.*

@Composable
fun CaptureProgressCard(
    progress: Float,
    framesCaptured: Int,
    transactionsFound: Int,
    isActive: Boolean
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        label = "progress"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Gray700),
        border = CardDefaults.outlinedCardBorder().copy(
            width = 1.dp,
            brush = androidx.compose.ui.graphics.SolidColor(Gray600)
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (isActive) {
                LinearProgressIndicator(
                    progress = animatedProgress,
                    modifier = Modifier.fillMaxWidth().height(6.dp),
                    color = Purple,
                    trackColor = Gray600,
                    strokeCap = StrokeCap.Round,
                )
                Spacer(Modifier.height(12.dp))
            }

            Text(
                text = if (isActive) "Capturando..." else "Pronto",
                style = MaterialTheme.typography.titleMedium,
                color = if (isActive) Purple else Green
            )

            Spacer(Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$framesCaptured", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Gray50)
                    Text("Frames", style = MaterialTheme.typography.labelSmall, color = Gray200)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$transactionsFound", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Green)
                    Text("Transacoes", style = MaterialTheme.typography.labelSmall, color = Gray200)
                }
            }
        }
    }
}
