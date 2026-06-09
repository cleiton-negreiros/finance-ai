package com.financeai.ninetyninepay.extractor

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.Bitmap
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class ScreenCaptureService : Service() {

    companion object {
        const val CHANNEL_ID = "capture_channel"
        const val NOTIFICATION_ID = 1001
        const val CAPTURE_INTERVAL_MS = 3000L

        val captureState = MutableStateFlow(CaptureState.IDLE)
        val progress = MutableStateFlow(0f)
        val framesCaptured = MutableStateFlow(0)
        val errorMessage = MutableStateFlow<String?>(null)

        private var mediaProjection: MediaProjection? = null
        private var virtualDisplay: VirtualDisplay? = null
        private var imageReader: ImageReader? = null
        private var job: Job? = null
    }

    enum class CaptureState { IDLE, CAPTURING, PROCESSING, DONE, ERROR }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "START_CAPTURE" -> {
                val code = intent.getIntExtra("code", 0)
                val data = intent.getParcelableExtra<Intent>("data")
                val projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjection = projectionManager.getMediaProjection(code, data!!)
                startCapturing()
            }
            "STOP_CAPTURE" -> stopCapturing()
        }
        return START_STICKY
    }

    private fun startCapturing() {
        captureState.value = CaptureState.CAPTURING
        framesCaptured.value = 0
        progress.value = 0f

        val metrics = resources.displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        imageReader = ImageReader.newInstance(width, height, android.graphics.PixelFormat.RGBA_8888, 2)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "CaptureDisplay",
            width, height, density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface, null, null
        )

        job = CoroutineScope(Dispatchers.IO + SupervisorJob()).launch {
            var frameCount = 0
            while (isActive) {
                val image = imageReader?.acquireLatestImage()
                if (image != null) {
                    val bitmap = imageToBitmap(image)
                    image.close()
                    if (bitmap != null) {
                        onFrame?.invoke(bitmap)
                        frameCount++
                        framesCaptured.value = frameCount
                    }
                }
                delay(CAPTURE_INTERVAL_MS)
            }
        }
    }

    private fun stopCapturing() {
        job?.cancel()
        virtualDisplay?.release()
        imageReader?.close()
        mediaProjection?.stop()
        virtualDisplay = null
        imageReader = null
        mediaProjection = null
        captureState.value = CaptureState.IDLE
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    var onFrame: ((Bitmap) -> Unit)? = null

    private fun imageToBitmap(image: android.media.Image): Bitmap? {
        val planes = image.planes
        val buffer = planes[0].buffer
        val pixelStride = planes[0].pixelStride
        val rowStride = planes[0].rowStride
        val rowPadding = rowStride - pixelStride * image.width

        val bitmap = Bitmap.createBitmap(image.width + rowPadding / pixelStride, image.height, Bitmap.Config.ARGB_8888)
        bitmap.copyPixelsFromBuffer(buffer)
        return Bitmap.createBitmap(bitmap, 0, 0, image.width, image.height)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Captura de Tela",
                NotificationManager.IMPORTANCE_LOW
            ).apply { setSound(null, null) }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Extraindo 99Pay")
            .setContentText("Capturando tela...")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopCapturing()
        super.onDestroy()
    }
}
