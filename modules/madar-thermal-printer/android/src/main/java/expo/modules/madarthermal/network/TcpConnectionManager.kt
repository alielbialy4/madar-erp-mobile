package expo.modules.madarthermal.network

import java.io.IOException
import java.net.InetSocketAddress
import java.net.Socket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

object TcpConnectionManager {
  private const val CONNECT_TIMEOUT_MS = 8_000
  private const val POOL_IDLE_MS = 45_000L

  private data class ManagedSocket(
    val socket: Socket,
    var lastUsedAt: Long,
  )

  private val idlePool = ConcurrentHashMap<String, ManagedSocket>()
  private val sendLocks = ConcurrentHashMap<String, ReentrantLock>()

  private fun poolKey(ip: String, port: Int): String = "${ip.trim()}:$port"

  fun lockFor(ip: String, port: Int): ReentrantLock =
    sendLocks.getOrPut(poolKey(ip, port)) { ReentrantLock() }

  private fun evictStale() {
    val now = System.currentTimeMillis()
    val iter = idlePool.entries.iterator()
    while (iter.hasNext()) {
      val entry = iter.next()
      if (now - entry.value.lastUsedAt > POOL_IDLE_MS) {
        closeQuietly(entry.value.socket)
        iter.remove()
      }
    }
  }

  fun connectFresh(ip: String, port: Int): Socket {
    val socket = Socket()
    socket.tcpNoDelay = true
    socket.connect(InetSocketAddress(ip.trim(), port), CONNECT_TIMEOUT_MS)
    return socket
  }

  private fun isSocketReusable(socket: Socket): Boolean {
    return socket.isConnected && !socket.isClosed && !socket.isInputShutdown && !socket.isOutputShutdown
  }

  fun acquire(ip: String, port: Int): Pair<Socket, Long> {
    evictStale()
    val key = poolKey(ip, port)
    val pooled = idlePool.remove(key)
    if (pooled != null && isSocketReusable(pooled.socket)) {
      return pooled.socket to 0L
    }
    pooled?.let { closeQuietly(it.socket) }
    val start = System.currentTimeMillis()
    val socket = connectFresh(ip, port)
    return socket to (System.currentTimeMillis() - start)
  }

  fun release(ip: String, port: Int, socket: Socket) {
    idlePool[poolKey(ip, port)] = ManagedSocket(socket, System.currentTimeMillis())
  }

  fun invalidate(ip: String, port: Int, socket: Socket?) {
    idlePool.remove(poolKey(ip, port))
    closeQuietly(socket)
  }

  fun warmup(ip: String, port: Int) {
    val key = poolKey(ip, port)
    if (idlePool.containsKey(key)) return
    try {
      val (socket, _) = acquire(ip, port)
      release(ip, port, socket)
    } catch (_: IOException) {
      /* non-fatal */
    }
  }

  private fun closeQuietly(socket: Socket?) {
    try {
      socket?.close()
    } catch (_: IOException) {
    }
  }
}
