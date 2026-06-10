package expo.modules.madarthermal.network

import java.io.IOException
import java.io.OutputStream
import java.net.Socket

object TcpSocketWriter {
  const val DEFAULT_CHUNK_SIZE = 8192
  const val DEFAULT_SETTLE_MS = 80L

  data class WriteResult(val bytesWritten: Int, val transferMs: Long)

  @Throws(IOException::class)
  fun writeBuffer(socket: Socket, buffer: ByteArray, chunkSize: Int = DEFAULT_CHUNK_SIZE): WriteResult {
    val out: OutputStream = socket.getOutputStream()
    val start = System.currentTimeMillis()
    var offset = 0
    while (offset < buffer.size) {
      val end = minOf(offset + chunkSize, buffer.size)
      out.write(buffer, offset, end - offset)
      offset = end
    }
    out.flush()
    return WriteResult(buffer.size, System.currentTimeMillis() - start)
  }

  fun settle(ms: Long = DEFAULT_SETTLE_MS) {
    if (ms <= 0) return
    try {
      Thread.sleep(ms)
    } catch (_: InterruptedException) {
      Thread.currentThread().interrupt()
    }
  }
}
