package expo.modules.madarthermal.pipeline

import expo.modules.madarthermal.model.MonoRaster

object EscPosRasterBuilder {
  private const val ESC = 0x1b
  private const val GS = 0x1d

  fun buildGsV0Raster(mono: MonoRaster): ByteArray {
    val bytesPerRow = (mono.width + 7) / 8
    val xL = bytesPerRow and 0xff
    val xH = (bytesPerRow shr 8) and 0xff
    val yL = mono.height and 0xff
    val yH = (mono.height shr 8) and 0xff
    val header = byteArrayOf(
      GS.toByte(), 0x76, 0x30, 0x00,
      xL.toByte(), xH.toByte(), yL.toByte(), yH.toByte(),
    )
    return header + mono.data
  }

  fun buildEscPosFromMono(mono: MonoRaster, cut: Boolean = true): ByteArray {
    val rasterBody = buildGsV0Raster(mono)
    val parts = mutableListOf<Byte>()
    parts.add(ESC.toByte()); parts.add(0x40)
    parts.add(ESC.toByte()); parts.add(0x33); parts.add(0x00)
    parts.addAll(rasterBody.toList())
    parts.add(ESC.toByte()); parts.add(0x64); parts.add(0x05)
    if (cut) {
      parts.add(GS.toByte()); parts.add(0x56); parts.add(0x00)
    }
    return parts.toByteArray()
  }
}
