package com.financeai.ninetyninepay.extractor

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class OCREngine {

    private val recognizer = TextRecognition.getClient(
        TextRecognizerOptions.Builder()
            .build()
    )

    suspend fun extractText(bitmap: Bitmap): Result<String> = withContext(Dispatchers.IO) {
        try {
            val processed = preprocess(bitmap)
            val image = InputImage.fromBitmap(processed, 0)
            val result = recognizer.process(image).await()
            Result.success(result.text)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun preprocess(bitmap: Bitmap): Bitmap {
        val config = bitmap.copy(Bitmap.Config.ARGB_8888, true)
        val pixels = IntArray(config.width * config.height)
        config.getPixels(pixels, 0, config.width, 0, 0, config.width, config.height)

        for (i in pixels.indices) {
            val pixel = pixels[i]
            val r = (pixel shr 16) and 0xFF
            val g = (pixel shr 8) and 0xFF
            val b = pixel and 0xFF
            val gray = (0.299 * r + 0.587 * g + 0.114 * b).toInt().coerceIn(0, 255)
            val contrast = if (gray > 128) 255 else 0
            pixels[i] = (0xFF shl 24) or (contrast shl 16) or (contrast shl 8) or contrast
        }

        config.setPixels(pixels, 0, config.width, 0, 0, config.width, config.height)
        return config
    }

    fun release() {
        recognizer.close()
    }
}
