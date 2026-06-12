# ML Kit OCR
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
