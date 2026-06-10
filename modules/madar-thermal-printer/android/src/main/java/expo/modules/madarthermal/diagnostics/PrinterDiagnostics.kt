package expo.modules.madarthermal.diagnostics

import expo.modules.madarthermal.model.DiagnoseResult
import expo.modules.madarthermal.network.TcpConnectionManager
import java.io.IOException
import java.net.Socket

object PrinterDiagnostics {
  fun diagnose(ip: String, port: Int): DiagnoseResult {
    if (ip.isBlank()) {
      return DiagnoseResult(false, 0, "عنوان IP مطلوب")
    }
    var socket: Socket? = null
    return try {
      val start = System.currentTimeMillis()
      val acquired = TcpConnectionManager.acquire(ip, port)
      socket = acquired.first
      val connectMs = acquired.second
      TcpConnectionManager.release(ip, port, socket)
      socket = null
      DiagnoseResult(
        reachable = true,
        connectMs = if (connectMs > 0) connectMs else (System.currentTimeMillis() - start),
        message = "متصل على المنفذ $port",
      )
    } catch (e: IOException) {
      TcpConnectionManager.invalidate(ip, port, socket)
      DiagnoseResult(false, 0, e.message ?: "فشل الاتصال")
    }
  }
}
