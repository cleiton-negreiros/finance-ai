package com.financeai.ninetyninepay.extractor

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class OCREngine {

    private val recognizer = TextRecognition.getClient(
        TextRecognizerOptions.Builder().build()
    )

    suspend fun extractText(bitmap: Bitmap): Result<String> = withContext(Dispatchers.IO) {
        try {
            val image = InputImage.fromBitmap(bitmap, 0)
            val result = recognizer.process(image).await()
            Result.success(result.text)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun release() {
        recognizer.close()
    }
}
