package com.financeai.ninetyninepay.export

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
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
            val dir = getExportDir(context)
            if (!dir.exists()) dir.mkdirs()

            val csvFile = File(dir, "99pay_extrato.csv")
            val jsonFile = File(dir, "99pay_extrato.json")

            csvFile.writeText(buildCSV(transactions))
            jsonFile.writeText(buildJSON(transactions))

            registerInMediaStore(context, csvFile)
            registerInMediaStore(context, jsonFile)

            Result.success(ExportResult(
                csvPath = csvFile.absolutePath,
                jsonPath = jsonFile.absolutePath,
                transactionCount = transactions.size
            ))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun getExportDir(context: Context): File {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            File(context.getExternalFilesDir(null), "99PayExport")
        } else {
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), "99PayExport")
        }
    }

    private fun buildCSV(transactions: List<Transaction>): String {
        val header = "data,descricao,valor,tipo"
        val rows = transactions.joinToString("\n") { it.toCSV() + "," + it.tipo.name.lowercase() }
        return "$header\n$rows"
    }

    private fun buildJSON(transactions: List<Transaction>): String {
        val items = transactions.joinToString(",\n  ") { it.toJson() }
        return "{\n  \"fonte\": \"99Pay\",\n  \"exportado_em\": \"${java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())}\",\n  \"transacoes\": [\n  $items\n  ]\n}"
    }

    private fun registerInMediaStore(context: Context, file: File) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val values = ContentValues().apply {
                put(MediaStore.Files.FileColumns.DISPLAY_NAME, file.name)
                put(MediaStore.Files.FileColumns.MIME_TYPE, if (file.extension == "csv") "text/csv" else "application/json")
                put(MediaStore.Files.FileColumns.RELATIVE_PATH, "Documents/99PayExport")
            }
            context.contentResolver.insert(MediaStore.Files.getContentUri("external"), values)
        }
    }
}
