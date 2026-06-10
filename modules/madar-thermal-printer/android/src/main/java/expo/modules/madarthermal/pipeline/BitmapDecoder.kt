package expo.modules.madarthermal.pipeline

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64

object BitmapDecoder {
  data class DecodeResult(val bitmap: Bitmap, val widthBefore: Int, val heightBefore: Int)

  fun decodeBase64Png(base64: String): DecodeResult {
    val raw = base64.trim()
      .replace(Regex("^data:image/\\w+;base64,"), "")
    val bytes = Base64.decode(raw, Base64.DEFAULT)
    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
      ?: throw IllegalArgumentException("فشل فك صورة الإيصال")
    return DecodeResult(bitmap, bitmap.width, bitmap.height)
  }

  fun decodeFile(uriOrPath: String): DecodeResult {
    val path = uriOrPath.removePrefix("file://")
    val bitmap = BitmapFactory.decodeFile(path)
      ?: throw IllegalArgumentException("فشل فك صورة الإيصال من الملف")
    return DecodeResult(bitmap, bitmap.width, bitmap.height)
  }

  fun dotsForPaper(paperWidth: String): Int = if (paperWidth == "58mm") 384 else 576

  fun scaleToTargetWidth(source: Bitmap, targetWidth: Int): Bitmap {
    if (source.width <= targetWidth) return source
    val scale = targetWidth.toFloat() / source.width.toFloat()
    val targetHeight = maxOf(1, (source.height * scale).toInt())
    val scaled = Bitmap.createScaledBitmap(source, targetWidth, targetHeight, false)
    if (scaled !== source) source.recycle()
    return scaled
  }
}
