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
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow

class ScreenCaptureService : Service() {

    companion object {
        const val CHANNEL_ID = "capture_channel"
        const val NOTIFICATION_ID = 1001
        const val CAPTURE_INTERVAL_MS = 3000L

        val captureState = MutableStateFlow(CaptureState.IDLE)
        val progress = MutableStateFlow(0f)
        val framesCaptured = MutableStateFlow(0)
        val errorMessage = MutableStateFlow<String?>(null)

        private val _frameFlow = MutableSharedFlow<Bitmap>(extraBufferCapacity = 1)
        val frameFlow: SharedFlow<Bitmap> = _frameFlow.asSharedFlow()

        private var mediaProjection: MediaProjection? = null
        private var virtualDisplay: VirtualDisplay? = null
        private var imageReader: ImageReader? = null
        private var job: Job? = null
        private var projectionCallback: MediaProjection.Callback? = null
    }

    enum class CaptureState { IDLE, CAPTURING, PROCESSING, DONE, ERROR }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            when (intent?.action) {
                "START_CAPTURE" -> {
                    val code = intent.getIntExtra("code", 0)
                    val data: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        intent.getParcelableExtra("data", Intent::class.java)
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getParcelableExtra("data")
                    }
                    if (data == null) {
                        errorMessage.value = "Erro: dados de captura invalidos"
                        return START_NOT_STICKY
                    }
                    val projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                    val proj = projectionManager.getMediaProjection(code, data)
                    proj.registerCallback(object : MediaProjection.Callback() {
                        override fun onStop() {
                            stopCapturing()
                        }
                    }, null)
                    mediaProjection = proj
                    startCapturing()
                }
                "STOP_CAPTURE" -> stopCapturing()
            }
        } catch (e: Exception) {
            errorMessage.value = e.message ?: "Erro desconhecido"
            captureState.value = CaptureState.ERROR
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
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

        imageReader = ImageReader.newInstance(width, height, android.graphics.PixelFormat.RGBA_8888, 3)

        imageReader?.setOnImageAvailableListener({ reader ->
            val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener
            val bitmap = imageToBitmap(image)
            image.close()
            if (bitmap != null) {
                _frameFlow.tryEmit(bitmap)
                framesCaptured.value = framesCaptured.value + 1
            }
        }, null)

        val surface = imageReader?.surface
        if (surface == null) {
            errorMessage.value = "Erro: surface do ImageReader nula"
            return
        }

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "CaptureDisplay",
            width, height, density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            surface, null, null
        )

        if (virtualDisplay == null) {
            errorMessage.value = "Falha ao criar VirtualDisplay"
            return
        }

        job = CoroutineScope(Dispatchers.IO + SupervisorJob()).launch {
            delay(2000)
            while (isActive) {
                val image = imageReader?.acquireLatestImage()
                if (image != null) {
                    val bitmap = imageToBitmap(image)
                    image.close()
                    if (bitmap != null) {
                        _frameFlow.tryEmit(bitmap)
                        framesCaptured.value = framesCaptured.value + 1
                    }
                }
                delay(CAPTURE_INTERVAL_MS)
            }
        }
    }

    private fun stopCapturing() {
        job?.cancel()
        imageReader?.setOnImageAvailableListener(null, null)
        virtualDisplay?.release()
        imageReader?.close()
        projectionCallback?.let { mediaProjection?.unregisterCallback(it) }
        mediaProjection?.stop()
        virtualDisplay = null
        imageReader = null
        mediaProjection = null
        projectionCallback = null
        captureState.value = CaptureState.IDLE
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun imageToBitmap(image: android.media.Image): Bitmap? {
        val planes = image.planes
        if (planes.isEmpty()) return null
        val buffer = planes[0].buffer
        val rowStride = planes[0].rowStride
        val width = image.width
        val height = image.height

        val pixels = IntArray(width * height)
        buffer.rewind()
        for (row in 0 until height) {
            buffer.position(row * rowStride)
            val intBuffer = buffer.asIntBuffer()
            intBuffer.get(pixels, row * width, width)
        }
        return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
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
