package com.financeai.ninetyninepay.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkScheme = darkColorScheme(
    primary = Purple,
    onPrimary = Gray50,
    secondary = Gray200,
    tertiary = Gray400,
    background = Gray900,
    surface = Gray800,
    surfaceVariant = Gray700,
    onBackground = Gray50,
    onSurface = Gray50,
    onSurfaceVariant = Gray200,
    outline = Gray600,
    error = Red,
)

@Composable
fun NinetyNineTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkScheme,
        typography = Typography,
        content = content
    )
}
