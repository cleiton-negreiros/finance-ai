package com.financeai.ninetyninepay.export

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import com.financeai.ninetyninepay.model.Transaction
import java.io.File

class CSVExporter {

    data class ExportResult(
        val csvPath: String,
        val jsonPath: String,
        val transactionCount: Int
    )

    fun export(context: Context, transactions: List<Transaction>): Result<ExportResult> {
        return try {
            val csvContent = buildCSV(transactions)
            val jsonContent = buildJSON(transactions)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                exportViaMediaStore(context, csvContent, jsonContent, transactions.size)
            } else {
                exportToLegacyDir(context, csvContent, jsonContent, transactions.size)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun exportViaMediaStore(
        context: Context, csvContent: String, jsonContent: String, count: Int
    ): Result<ExportResult> {
        val uriCsv = writeToMediaStore(context, "99pay_extrato.csv", "text/csv", csvContent)
        val uriJson = writeToMediaStore(context, "99pay_extrato.json", "application/json", jsonContent)
        return Result.success(ExportResult(
            csvPath = uriCsv?.toString() ?: "Downloads/99PayExport/99pay_extrato.csv",
            jsonPath = uriJson?.toString() ?: "Downloads/99PayExport/99pay_extrato.json",
            transactionCount = count
        ))
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun writeToMediaStore(context: Context, name: String, mime: String, content: String): Uri? {
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, name)
            put(MediaStore.Downloads.MIME_TYPE, mime)
            put(MediaStore.Downloads.RELATIVE_PATH, "Download/99PayExport")
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return null
        context.contentResolver.openOutputStream(uri)?.use { it.write(content.toByteArray()) }
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        context.contentResolver.update(uri, values, null, null)
        return uri
    }

    private fun exportToLegacyDir(
        context: Context, csvContent: String, jsonContent: String, count: Int
    ): Result<ExportResult> {
        val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), "99PayExport")
        if (!dir.exists()) dir.mkdirs()
        val csvFile = File(dir, "99pay_extrato.csv").apply { writeText(csvContent) }
        val jsonFile = File(dir, "99pay_extrato.json").apply { writeText(jsonContent) }
        return Result.success(ExportResult(
            csvPath = csvFile.absolutePath,
            jsonPath = jsonFile.absolutePath,
            transactionCount = count
        ))
    }

    private fun buildCSV(transactions: List<Transaction>): String {
        val header = "data,descricao,valor,tipo"
        val rows = transactions.joinToString("\n") { it.toCSV() }
        return "$header\n$rows"
    }

    private fun buildJSON(transactions: List<Transaction>): String {
        val items = transactions.joinToString(",\n  ") { it.toJson() }
        return "{\n  \"fonte\": \"99Pay\",\n  \"exportado_em\": \"${
            java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
        }\",\n  \"transacoes\": [\n  $items\n  ]\n}"
    }
}
