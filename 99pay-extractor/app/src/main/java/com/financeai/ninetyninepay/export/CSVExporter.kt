package com.financeai.ninetyninepay.export

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import com.financeai.ninetyninepay.model.Bank
import com.financeai.ninetyninepay.model.Transaction
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class CSVExporter {

    data class ExportResult(
        val csvPath: String,
        val jsonPath: String,
        val transactionCount: Int
    )

    fun export(context: Context, transactions: List<Transaction>, bank: Bank = Bank.NOVENTA_NOVE_PAY): Result<ExportResult> {
        return try {
            val csvContent = buildCSV(transactions)
            val jsonContent = buildJSON(transactions, bank)

            val prefix = bank.slug
            val csvName = "${prefix}_extrato.csv"
            val jsonName = "${prefix}_extrato.json"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                exportViaMediaStore(context, csvContent, jsonContent, csvName, jsonName, transactions.size)
            } else {
                exportToLegacyDir(context, csvContent, jsonContent, csvName, jsonName, transactions.size)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun exportViaMediaStore(
        context: Context, csvContent: String, jsonContent: String,
        csvName: String, jsonName: String, count: Int
    ): Result<ExportResult> {
        val uriCsv = writeToMediaStore(context, csvName, "text/csv", csvContent)
        val uriJson = writeToMediaStore(context, jsonName, "application/json", jsonContent)
        return Result.success(ExportResult(
            csvPath = uriCsv?.toString() ?: "Downloads/FinanceAIExport/$csvName",
            jsonPath = uriJson?.toString() ?: "Downloads/FinanceAIExport/$jsonName",
            transactionCount = count
        ))
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun writeToMediaStore(context: Context, name: String, mime: String, content: String): Uri? {
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, name)
            put(MediaStore.Downloads.MIME_TYPE, mime)
            put(MediaStore.Downloads.RELATIVE_PATH, "Download/FinanceAIExport")
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return null
        context.contentResolver.openOutputStream(uri)?.use { it.write(content.toByteArray()) }
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        context.contentResolver.update(uri, values, null, null)
        return uri
    }

    @Suppress("DEPRECATION")
    private fun exportToLegacyDir(
        context: Context, csvContent: String, jsonContent: String,
        csvName: String, jsonName: String, count: Int
    ): Result<ExportResult> {
        val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), "FinanceAIExport")
        if (!dir.exists()) dir.mkdirs()
        val csvFile = File(dir, csvName).apply { writeText(csvContent) }
        val jsonFile = File(dir, jsonName).apply { writeText(jsonContent) }
        return Result.success(ExportResult(
            csvPath = csvFile.absolutePath,
            jsonPath = jsonFile.absolutePath,
            transactionCount = count
        ))
    }

    private fun buildCSV(transactions: List<Transaction>): String {
        val header = "data,descricao,valor,tipo,fonte"
        val rows = transactions.joinToString("\n") { it.toCSV() }
        return "$header\n$rows"
    }

    private fun buildJSON(transactions: List<Transaction>, bank: Bank): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        val items = transactions.joinToString(",\n  ") { it.toJson() }
        return """{
  "fonte": "${bank.slug}",
  "banco": "${bank.displayName}",
  "exportado_em": "${sdf.format(Date())}",
  "transacoes": [
  $items
  ]
}"""
    }
}
