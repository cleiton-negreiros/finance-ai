package com.financeai.ninetyninepay.data

import android.graphics.Bitmap
import com.financeai.ninetyninepay.extractor.OCREngine
import com.financeai.ninetyninepay.extractor.TransactionParser
import com.financeai.ninetyninepay.model.Transaction

class TransactionRepository(
    private val ocrEngine: OCREngine,
    private val parser: TransactionParser
) {
    private val allTransactions = mutableListOf<Transaction>()
    private val seenHashes = mutableSetOf<String>()

    suspend fun processFrame(bitmap: Bitmap): ProcessResult {
        val ocrResult = ocrEngine.extractText(bitmap)

        if (ocrResult.isFailure) {
            return ProcessResult(
                newTransactions = emptyList(),
                error = ocrResult.exceptionOrNull()?.message
            )
        }

        val rawText = ocrResult.getOrThrow()
        val parseResult = parser.parse(rawText)

        val newTransactions = parseResult.transactions
            .filter { tx ->
                val hash = "${tx.data}_${tx.descricao}_${tx.valor}"
                hash !in seenHashes
            }
            .also { new ->
                new.forEach { tx ->
                    seenHashes.add("${tx.data}_${tx.descricao}_${tx.valor}")
                }
                allTransactions.addAll(new)
            }

        return ProcessResult(
            newTransactions = newTransactions,
            totalTransactions = allTransactions.size,
            error = parseResult.errors.firstOrNull()
        )
    }

    fun getAll(): List<Transaction> = allTransactions.toList()
    fun clear() { allTransactions.clear(); seenHashes.clear() }
    fun count() = allTransactions.size

    data class ProcessResult(
        val newTransactions: List<Transaction>,
        val totalTransactions: Int = 0,
        val error: String? = null
    )
}
