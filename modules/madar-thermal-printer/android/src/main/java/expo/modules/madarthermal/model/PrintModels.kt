package expo.modules.madarthermal.model

data class MonoRaster(
  val width: Int,
  val height: Int,
  val data: ByteArray,
) {
  fun toMap(): Map<String, Any> = mapOf(
    "width" to width,
    "height" to height,
    "bytesPerRow" to ((width + 7) / 8),
  )
}

data class PrintTiming(
  val decodeMs: Long,
  val bitmapProcessMs: Long,
  val rasterMs: Long,
  val connectMs: Long,
  val transferMs: Long,
  val settleMs: Long,
  val totalMs: Long,
  val bytesSent: Int,
  val widthBefore: Int,
  val heightBefore: Int,
  val widthAfter: Int,
  val heightAfter: Int,
  val chunkSize: Int,
) {
  fun toMap(): Map<String, Any> = mapOf(
    "decodeMs" to decodeMs,
    "bitmapProcessMs" to bitmapProcessMs,
    "rasterMs" to rasterMs,
    "connectMs" to connectMs,
    "transferMs" to transferMs,
    "settleMs" to settleMs,
    "totalMs" to totalMs,
    "bytesSent" to bytesSent,
    "widthBefore" to widthBefore,
    "heightBefore" to heightBefore,
    "widthAfter" to widthAfter,
    "heightAfter" to heightAfter,
    "chunkSize" to chunkSize,
  )
}

data class DiagnoseResult(
  val reachable: Boolean,
  val connectMs: Long,
  val message: String,
) {
  fun toMap(): Map<String, Any> = mapOf(
    "reachable" to reachable,
    "connectMs" to connectMs,
    "message" to message,
  )
}

data class ChunkBenchmarkResult(
  val chunkSize: Int,
  val transferMs: Long,
  val bytesSent: Int,
  val success: Boolean,
  val error: String?,
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "chunkSize" to chunkSize,
    "transferMs" to transferMs,
    "bytesSent" to bytesSent,
    "success" to success,
    "error" to error,
  )
}
