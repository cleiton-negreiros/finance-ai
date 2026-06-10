package com.financeai.ninetyninepay.extractor

import com.financeai.ninetyninepay.model.Transaction
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class TransactionParserTest {

    private val parser = TransactionParser()

    @Test
    fun `test parse 99Pay format with timestamps`() {
        val result = parser.testParse()
        
        assertEquals(7, result.transactions.size)
        assertEquals(0, result.errors.size)
        
        // Check first transaction (entrada)
        val firstTx = result.transactions[0]
        assertEquals("2026-06-06 04:52:18", firstTx.data)
        assertEquals("Lucro", firstTx.descricao)
        assertEquals(1.20, firstTx.valor)
        assertEquals(Transaction.Tipo.ENTRADA, firstTx.tipo)
        
        // Check second transaction (saida)
        val secondTx = result.transactions[1]
        assertEquals("2026-06-05 16:02:26", secondTx.data)
        assertEquals("Pagamento com Pix enviado", secondTx.descricao)
        assertEquals(-1.50, secondTx.valor)
        assertEquals(Transaction.Tipo.SAIDA, secondTx.tipo)
        
        // Check third transaction (entrada)
        val thirdTx = result.transactions[2]
        assertEquals("2026-06-05 05:15:38", thirdTx.data)
        assertEquals("Lucro", thirdTx.descricao)
        assertEquals(1.20, thirdTx.valor)
        assertEquals(Transaction.Tipo.ENTRADA, thirdTx.tipo)
        
        // Check fourth transaction (saida)
        val fourthTx = result.transactions[3]
        assertEquals("2026-06-04 22:02:27", fourthTx.data)
        assertEquals("Pagamento com Pix enviado", fourthTx.descricao)
        assertEquals(-7.00, fourthTx.valor)
        assertEquals(Transaction.Tipo.SAIDA, fourthTx.tipo)
        
        // Check fifth transaction (entrada)
        val fifthTx = result.transactions[4]
        assertEquals("2026-06-04 04:43:50", fifthTx.data)
        assertEquals("Lucro", fifthTx.descricao)
        assertEquals(1.21, fifthTx.valor)
        assertEquals(Transaction.Tipo.ENTRADA, fifthTx.tipo)
        
        // Check sixth transaction (saida)
        val sixthTx = result.transactions[5]
        assertEquals("2026-06-03 19:59:45", sixthTx.data)
        assertEquals("Pagamento com Pix enviado", sixthTx.descricao)
        assertEquals(-15.00, sixthTx.valor)
        assertEquals(Transaction.Tipo.SAIDA, sixthTx.tipo)
        
        // Check seventh transaction (entrada)
        val seventhTx = result.transactions[6]
        assertEquals("2026-06-03 06:05:10", seventhTx.data)
        assertEquals("Lucro", seventhTx.descricao)
        assertEquals(1.21, seventhTx.valor)
        assertEquals(Transaction.Tipo.ENTRADA, seventhTx.tipo)
    }

    @Test
    fun `test parse 99Pay format with negative values`() {
        val result = parser.testParse()
        
        // Check that all negative values are correctly identified as SAIDA
        val saidas = result.transactions.filter { it.tipo == Transaction.Tipo.SAIDA }
        assertEquals(3, saidas.size)
        
        // Verify negative values
        assertTrue(saidas.all { it.valor < 0 })
        assertTrue(saidas.map { kotlin.math.abs(it.valor) }.containsAll(listOf(1.50, 7.00, 15.00)))
    }

    @Test
    fun `test parse 99Pay format with positive values`() {
        val result = parser.testParse()
        
        // Check that all positive values are correctly identified as ENTRADA
        val entradas = result.transactions.filter { it.tipo == Transaction.Tipo.ENTRADA }
        assertEquals(4, entradas.size)
        
        // Verify positive values
        assertTrue(entradas.all { it.valor > 0 })
        assertTrue(entradas.map { kotlin.math.abs(it.valor) }.containsAll(listOf(1.20, 1.20, 1.21, 1.21)))
    }

    @Test
    fun `test parse 99Pay format with deduplication`() {
        val testText = """*Lucro*: +R$1,20 (2026-06-06 04:52:18)
*Lucro*: +R$1,20 (2026-06-06 04:52:18)
*Pagamento com Pix enviado*: -R$1,50 (2026-06-05 16:02:26)
*Pagamento com Pix enviado*: -R$1,50 (2026-06-05 16:02:26)"""
        
        val result = parser.parse(testText)
        
        // Should have only 2 unique transactions (deduplicated)
        assertEquals(2, result.transactions.size)
    }
}