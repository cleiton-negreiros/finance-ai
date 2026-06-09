package com.financeai.ninetyninepay

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import com.financeai.ninetyninepay.model.Transaction
import com.financeai.ninetyninepay.ui.screens.HomeScreen
import com.financeai.ninetyninepay.ui.screens.PreviewScreen
import com.financeai.ninetyninepay.ui.theme.NinetyNineTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NinetyNineTheme {
                AppNavigation()
            }
        }
    }
}

@Composable
fun AppNavigation() {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Home) }

    when (val screen = currentScreen) {
        is Screen.Home -> HomeScreen(
            onNavigateToPreview = { transactions ->
                currentScreen = Screen.Preview(transactions)
            }
        )
        is Screen.Preview -> PreviewScreen(
            transactions = screen.transactions,
            onBack = { currentScreen = Screen.Home }
        )
    }
}

sealed class Screen {
    data object Home : Screen()
    data class Preview(val transactions: List<Transaction>) : Screen()
}
