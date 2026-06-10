package expo.modules.madarthermal.pipeline

import android.graphics.Bitmap
import expo.modules.madarthermal.model.PrintTiming
import expo.modules.madarthermal.network.TcpConnectionManager
import expo.modules.madarthermal.network.TcpSocketWriter
import java.io.IOException
import java.net.Socket

object ReceiptPrintPipeline {
  data class PipelineResult(val timing: PrintTiming)

  private fun decodeImage(imageUri: String?, imageBase64: String?): BitmapDecoder.DecodeResult {
    return when {
      !imageUri.isNullOrBlank() -> BitmapDecoder.decodeFile(imageUri)
      !imageBase64.isNullOrBlank() -> BitmapDecoder.decodeBase64Png(imageBase64)
      else -> throw IllegalArgumentException("imageUri أو imageBase64 مطلوب")
    }
  }

  fun buildPayloadOnly(imageBase64: String, paperWidth: String, cut: Boolean): ByteArray {
    return buildPayloadOnlyFromImage(null, imageBase64, paperWidth, cut)
  }

  fun buildPayloadOnlyFromUri(imageUri: String, paperWidth: String, cut: Boolean): ByteArray {
    return buildPayloadOnlyFromImage(imageUri, null, paperWidth, cut)
  }

  private fun buildPayloadOnlyFromImage(
    imageUri: String?,
    imageBase64: String?,
    paperWidth: String,
    cut: Boolean,
  ): ByteArray {
    var bitmap: Bitmap? = null
    try {
      val decoded = decodeImage(imageUri, imageBase64)
      bitmap = decoded.bitmap
      val targetWidth = BitmapDecoder.dotsForPaper(paperWidth)
      val scaled = BitmapDecoder.scaleToTargetWidth(bitmap, targetWidth)
      if (scaled !== bitmap) {
        bitmap.recycle()
        bitmap = scaled
      } else {
        bitmap = scaled
      }
      val mono = BitmapMonoConverter.bitmapToMono(bitmap, targetWidth)
      return EscPosRasterBuilder.buildEscPosFromMono(mono, cut)
    } finally {
      bitmap?.recycle()
    }
  }

  @Throws(IOException::class)
  fun printReceipt(
    ip: String,
    port: Int,
    imageBase64: String,
    paperWidth: String,
    cut: Boolean,
    chunkSize: Int = TcpSocketWriter.DEFAULT_CHUNK_SIZE,
    settleMs: Long = TcpSocketWriter.DEFAULT_SETTLE_MS,
  ): PipelineResult {
    return printReceiptFromImage(ip, port, null, imageBase64, paperWidth, cut, chunkSize, settleMs)
  }

  @Throws(IOException::class)
  fun printReceiptFromUri(
    ip: String,
    port: Int,
    imageUri: String,
    paperWidth: String,
    cut: Boolean,
    chunkSize: Int = TcpSocketWriter.DEFAULT_CHUNK_SIZE,
    settleMs: Long = TcpSocketWriter.DEFAULT_SETTLE_MS,
  ): PipelineResult {
    return printReceiptFromImage(ip, port, imageUri, null, paperWidth, cut, chunkSize, settleMs)
  }

  @Throws(IOException::class)
  private fun printReceiptFromImage(
    ip: String,
    port: Int,
    imageUri: String?,
    imageBase64: String?,
    paperWidth: String,
    cut: Boolean,
    chunkSize: Int,
    settleMs: Long,
  ): PipelineResult {
    val totalStart = System.currentTimeMillis()
    var bitmap: Bitmap? = null
    var socket: Socket? = null
    val lock = TcpConnectionManager.lockFor(ip, port)

    lock.lock()
    try {
      val decodeStart = System.currentTimeMillis()
      val decoded = decodeImage(imageUri, imageBase64)
      bitmap = decoded.bitmap
      val widthBefore = decoded.widthBefore
      val heightBefore = decoded.heightBefore
      val decodeMs = System.currentTimeMillis() - decodeStart

      val bitmapStart = System.currentTimeMillis()
      val targetWidth = BitmapDecoder.dotsForPaper(paperWidth)
      val scaled = BitmapDecoder.scaleToTargetWidth(bitmap, targetWidth)
      if (scaled !== bitmap) {
        bitmap.recycle()
        bitmap = scaled
      }
      val mono = BitmapMonoConverter.bitmapToMono(bitmap, targetWidth)
      val widthAfter = mono.width
      val heightAfter = mono.height
      val bitmapProcessMs = System.currentTimeMillis() - bitmapStart

      val rasterStart = System.currentTimeMillis()
      val payload = EscPosRasterBuilder.buildEscPosFromMono(mono, cut)
      val rasterMs = System.currentTimeMillis() - rasterStart

      val connectStart = System.currentTimeMillis()
      val acquired = TcpConnectionManager.acquire(ip, port)
      socket = acquired.first
      val connectMs = if (acquired.second > 0) acquired.second else (System.currentTimeMillis() - connectStart)

      val write = TcpSocketWriter.writeBuffer(socket, payload, chunkSize)
      val settleStart = System.currentTimeMillis()
      TcpSocketWriter.settle(settleMs)
      val settleElapsed = System.currentTimeMillis() - settleStart

      if (cut) {
        TcpConnectionManager.invalidate(ip, port, socket)
      } else {
        TcpConnectionManager.release(ip, port, socket)
      }
      socket = null

      val timing = PrintTiming(
        decodeMs = decodeMs,
        bitmapProcessMs = bitmapProcessMs,
        rasterMs = rasterMs,
        connectMs = connectMs,
        transferMs = write.transferMs,
        settleMs = settleElapsed,
        totalMs = System.currentTimeMillis() - totalStart,
        bytesSent = write.bytesWritten,
        widthBefore = widthBefore,
        heightBefore = heightBefore,
        widthAfter = widthAfter,
        heightAfter = heightAfter,
        chunkSize = chunkSize,
      )
      return PipelineResult(timing)
    } catch (e: IOException) {
      TcpConnectionManager.invalidate(ip, port, socket)
      throw e
    } finally {
      bitmap?.recycle()
      lock.unlock()
    }
  }
}
