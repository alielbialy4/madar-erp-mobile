package expo.modules.madarthermal.pipeline

import android.graphics.Bitmap
import expo.modules.madarthermal.model.MonoRaster
import kotlin.math.min

object BitmapMonoConverter {
  private const val LUM_THRESHOLD = 200
  private const val ALPHA_THRESHOLD = 32

  fun bitmapToMono(bitmap: Bitmap, targetWidthDots: Int): MonoRaster {
    val srcW = bitmap.width
    val srcH = bitmap.height
    val scale = min(1f, targetWidthDots.toFloat() / srcW.toFloat())
    val outW = maxOf(1, min(targetWidthDots, kotlin.math.round(srcW * scale).toInt()))
    val outH = maxOf(1, kotlin.math.round(srcH * scale).toInt())
    val bytesPerRow = (outW + 7) / 8
    val raster = ByteArray(bytesPerRow * outH)

    val pixels = IntArray(srcW * srcH)
    bitmap.getPixels(pixels, 0, srcW, 0, 0, srcW, srcH)

    val noScale = scale >= 0.999f && srcW == outW

    if (noScale) {
      for (y in 0 until outH) {
        for (x in 0 until outW) {
          if (isInk(pixels[y * srcW + x])) {
            val byteIndex = y * bytesPerRow + (x shr 3)
            raster[byteIndex] = (raster[byteIndex].toInt() or (1 shl (7 - (x and 7)))).toByte()
          }
        }
      }
    } else {
      for (y in 0 until outH) {
        val srcY = min(srcH - 1, (y / scale).toInt())
        for (x in 0 until outW) {
          val srcX = min(srcW - 1, (x / scale).toInt())
          if (isInk(pixels[srcY * srcW + srcX])) {
            val byteIndex = y * bytesPerRow + (x shr 3)
            raster[byteIndex] = (raster[byteIndex].toInt() or (1 shl (7 - (x and 7)))).toByte()
          }
        }
      }
    }

    return trimVerticalWhitespace(MonoRaster(outW, outH, raster))
  }

  private fun isInk(argb: Int): Boolean {
    val a = (argb ushr 24) and 0xff
    if (a <= ALPHA_THRESHOLD) return false
    val r = (argb shr 16) and 0xff
    val g = (argb shr 8) and 0xff
    val b = argb and 0xff
    val lum = 0.299 * r + 0.587 * g + 0.114 * b
    return lum < LUM_THRESHOLD
  }

  private fun rowHasInk(data: ByteArray, bytesPerRow: Int, row: Int): Boolean {
    val start = row * bytesPerRow
    val end = start + bytesPerRow
    for (i in start until end) {
      if (data[i] != 0.toByte()) return true
    }
    return false
  }

  fun trimVerticalWhitespace(mono: MonoRaster): MonoRaster {
    val bytesPerRow = (mono.width + 7) / 8
    if (mono.height <= 0) return mono

    var top = 0
    while (top < mono.height && !rowHasInk(mono.data, bytesPerRow, top)) top++

    var bottom = mono.height - 1
    while (bottom >= top && !rowHasInk(mono.data, bytesPerRow, bottom)) bottom--

    if (top == 0 && bottom == mono.height - 1) return mono

    val newHeight = maxOf(1, bottom - top + 1)
    val trimmed = ByteArray(bytesPerRow * newHeight)
    System.arraycopy(mono.data, top * bytesPerRow, trimmed, 0, trimmed.size)
    return MonoRaster(mono.width, newHeight, trimmed)
  }
}
