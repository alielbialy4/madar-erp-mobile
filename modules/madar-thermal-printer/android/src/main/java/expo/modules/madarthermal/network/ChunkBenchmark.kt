package expo.modules.madarthermal.network

import expo.modules.madarthermal.model.ChunkBenchmarkResult
import expo.modules.madarthermal.pipeline.ReceiptPrintPipeline
import java.io.IOException
import java.net.Socket

object ChunkBenchmark {
  val CHUNK_SIZES = intArrayOf(512, 1024, 2048, 4096, 8192)

  fun benchmarkChunks(
    ip: String,
    port: Int,
    imageBase64: String,
    paperWidth: String,
  ): List<ChunkBenchmarkResult> {
    val payload = ReceiptPrintPipeline.buildPayloadOnly(imageBase64, paperWidth, cut = false)
    val results = mutableListOf<ChunkBenchmarkResult>()
    val lock = TcpConnectionManager.lockFor(ip, port)

    for (chunkSize in CHUNK_SIZES) {
      lock.lock()
      var socket: Socket? = null
      try {
        val acquired = TcpConnectionManager.acquire(ip, port)
        socket = acquired.first
        val write = TcpSocketWriter.writeBuffer(socket, payload, chunkSize)
        TcpSocketWriter.settle(0)
        TcpConnectionManager.release(ip, port, socket)
        socket = null
        results.add(
          ChunkBenchmarkResult(
            chunkSize = chunkSize,
            transferMs = write.transferMs,
            bytesSent = write.bytesWritten,
            success = true,
            error = null,
          ),
        )
      } catch (e: IOException) {
        TcpConnectionManager.invalidate(ip, port, socket)
        socket = null
        results.add(
          ChunkBenchmarkResult(
            chunkSize = chunkSize,
            transferMs = 0,
            bytesSent = 0,
            success = false,
            error = e.message,
          ),
        )
      } finally {
        lock.unlock()
      }
    }
    return results
  }
}
