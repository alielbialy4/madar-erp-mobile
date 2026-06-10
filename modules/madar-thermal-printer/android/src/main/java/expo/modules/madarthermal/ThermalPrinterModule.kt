package expo.modules.madarthermal

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.madarthermal.diagnostics.PrinterDiagnostics
import expo.modules.madarthermal.network.ChunkBenchmark
import expo.modules.madarthermal.network.TcpConnectionManager
import expo.modules.madarthermal.pipeline.ReceiptPrintPipeline
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

class ThermalPrinterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ThermalPrinter")

    AsyncFunction("isAvailable") {
      true
    }

    AsyncFunction("warmup") Coroutine { ip: String, port: Int? ->
      withContext(Dispatchers.IO) {
        TcpConnectionManager.warmup(ip, port ?: 9100)
      }
    }

    AsyncFunction("diagnosePrinter") Coroutine { ip: String, port: Int? ->
      withContext(Dispatchers.IO) {
        PrinterDiagnostics.diagnose(ip, port ?: 9100).toMap()
      }
    }

    AsyncFunction("printReceipt") Coroutine { options: Map<String, Any?> ->
      withContext(Dispatchers.IO) {
        val ip = options["ip"] as? String ?: throw CodedException("INVALID_IP", "عنوان IP مطلوب", null)
        val imageUri = options["imageUri"] as? String
        val imageBase64 = options["imageBase64"] as? String
        if (imageUri.isNullOrBlank() && imageBase64.isNullOrBlank()) {
          throw CodedException("INVALID_IMAGE", "imageUri أو imageBase64 مطلوب", null)
        }
        val port = (options["port"] as? Number)?.toInt() ?: 9100
        val paperWidth = options["paperWidth"] as? String ?: "80mm"
        val cut = options["cut"] as? Boolean ?: true
        val chunkSize = (options["chunkSize"] as? Number)?.toInt() ?: 8192
        val settleMs = (options["settleMs"] as? Number)?.toLong() ?: 80L

        try {
          val result = if (!imageUri.isNullOrBlank()) {
            ReceiptPrintPipeline.printReceiptFromUri(
              ip = ip,
              port = port,
              imageUri = imageUri,
              paperWidth = paperWidth,
              cut = cut,
              chunkSize = chunkSize,
              settleMs = settleMs,
            )
          } else {
            ReceiptPrintPipeline.printReceipt(
              ip = ip,
              port = port,
              imageBase64 = imageBase64!!,
              paperWidth = paperWidth,
              cut = cut,
              chunkSize = chunkSize,
              settleMs = settleMs,
            )
          }
          result.timing.toMap()
        } catch (e: IOException) {
          throw CodedException("PRINT_FAILED", e.message ?: "فشلت الطباعة", e)
        }
      }
    }

    AsyncFunction("benchmarkChunks") Coroutine { options: Map<String, Any?> ->
      withContext(Dispatchers.IO) {
        val ip = options["ip"] as? String ?: throw CodedException("INVALID_IP", "عنوان IP مطلوب", null)
        val imageBase64 = options["imageBase64"] as? String
          ?: throw CodedException("INVALID_IMAGE", "imageBase64 مطلوب", null)
        val port = (options["port"] as? Number)?.toInt() ?: 9100
        val paperWidth = options["paperWidth"] as? String ?: "80mm"
        ChunkBenchmark.benchmarkChunks(ip, port, imageBase64, paperWidth)
          .map { it.toMap() }
      }
    }
  }
}
