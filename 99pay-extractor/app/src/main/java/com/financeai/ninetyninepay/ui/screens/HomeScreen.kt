package com.financeai.ninetyninepay.ui.screens

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.FileDownload
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.financeai.ninetyninepay.export.CSVExporter
import com.financeai.ninetyninepay.extractor.OCREngine
import com.financeai.ninetyninepay.extractor.ScreenCaptureService
import com.financeai.ninetyninepay.extractor.TransactionParser
import com.financeai.ninetyninepay.data.TransactionRepository
import com.financeai.ninetyninepay.model.Transaction
import com.financeai.ninetyninepay.ui.components.CaptureProgressCard
import com.financeai.ninetyninepay.ui.components.TransactionRow
import com.financeai.ninetyninepay.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(onNavigateToPreview: (List<Transaction>) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val ocr = remember { OCREngine() }
    val parser = remember { TransactionParser() }
    val repo = remember { TransactionRepository(ocr, parser) }
    val exporter = remember { CSVExporter() }

    var isCapturing by remember { mutableStateOf(false) }
    var frames by remember { mutableStateOf(0) }
    var found by remember { mutableStateOf(0) }
    var exported by remember { mutableStateOf(false) }
    var exportPath by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        ScreenCaptureService.errorMessage.collect { msg ->
            if (msg != null) errorMsg = msg
        }
    }

    val projectionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val intent = Intent(context, ScreenCaptureService::class.java).apply {
                action = "START_CAPTURE"
                putExtra("code", result.resultCode)
                putExtra("data", result.data)
            }
            context.startForegroundService(intent)
            isCapturing = true

            scope.launch {
                ScreenCaptureService.frameFlow.collect { bitmap ->
                    repo.processFrame(bitmap)
                    frames = ScreenCaptureService.framesCaptured.value
                    found = repo.count()
                }
            }
        }
    }

    LaunchedEffect(isCapturing) {
        while (isCapturing) {
            kotlinx.coroutines.delay(500)
            frames = ScreenCaptureService.framesCaptured.value
            found = repo.count()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("99Pay Extractor", fontWeight = FontWeight.Bold)
                        Text("Extrato automatico", style = MaterialTheme.typography.labelSmall, color = Gray200)
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
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(16.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Gray700)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "Extracao Inteligente",
                        style = MaterialTheme.typography.titleLarge,
                        color = Gray50
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Abra o historico da 99Pay e toque em iniciar.\nO app captura a tela e extrai as transacoes automaticamente.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Gray200,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            if (isCapturing || found > 0) {
                CaptureProgressCard(
                    progress = if (frames > 0) (found.toFloat() / (found + 5).coerceAtLeast(1)) else 0f,
                    framesCaptured = frames,
                    transactionsFound = found,
                    isActive = isCapturing
                )
                Spacer(Modifier.height(16.dp))
            }

            if (errorMsg != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Red.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        errorMsg!!, color = Red,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                Spacer(Modifier.height(12.dp))
            }

            if (found > 0 && !isCapturing) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Gray700)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Transacoes encontradas:", style = MaterialTheme.typography.labelMedium, color = Gray200)
                        Spacer(Modifier.height(8.dp))
                        val preview = repo.getAll().take(5)
                        preview.forEach { TransactionRow(it) }
                        if (repo.getAll().size > 5) {
                            Text("...e mais ${repo.getAll().size - 5} transacoes",
                                style = MaterialTheme.typography.bodyMedium, color = Gray200)
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            }

            Spacer(Modifier.weight(1f))

            // Buttons
            if (!isCapturing && found == 0) {
                Button(
                    onClick = {
                        val mgr = context.getSystemService(android.content.Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                        projectionLauncher.launch(mgr.createScreenCaptureIntent())
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Purple)
                ) {
                    Icon(Icons.Rounded.CameraAlt, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Iniciar Captura", fontWeight = FontWeight.SemiBold)
                }
            }

            if (isCapturing) {
                Button(
                    onClick = {
                        context.stopService(Intent(context, ScreenCaptureService::class.java))
                        isCapturing = false
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Red)
                ) {
                    Text("Parar Captura", fontWeight = FontWeight.SemiBold)
                }
            }

            if (found > 0 && !isCapturing) {
                Button(
                    onClick = {
                        scope.launch {
                            val result = exporter.export(context, repo.getAll())
                            if (result.isSuccess) {
                                exportPath = result.getOrThrow().csvPath
                                exported = true
                            } else {
                                errorMsg = result.exceptionOrNull()?.message
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Green)
                ) {
                    Icon(Icons.Rounded.FileDownload, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Exportar CSV", fontWeight = FontWeight.SemiBold)
                }

                Spacer(Modifier.height(8.dp))

                OutlinedButton(
                    onClick = { onNavigateToPreview(repo.getAll()) },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Purple)
                ) {
                    Icon(Icons.Rounded.Visibility, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Visualizar Dados", fontWeight = FontWeight.SemiBold)
                }
            }

            if (exported) {
                Spacer(Modifier.height(8.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = Green.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = Green)
                        Spacer(Modifier.width(8.dp))
                        Text("Salvo em: $exportPath", color = Green, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }

    DisposableEffect(Unit) {
        onDispose { ocr.release() }
    }
}
