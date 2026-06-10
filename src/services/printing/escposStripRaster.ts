import { buildGsV0Raster, type MonoRaster } from './escposRaster';
import { recordPrintTimingSync } from './printTimingBuffer';

const ESC = 0x1b;
const GS = 0x1d;

export const STRIP_HEIGHT_PX = 48;

export type EscPosStripJob = {
  preamble: Uint8Array;
  strips: Uint8Array[];
  epilogue: Uint8Array;
  stripCount: number;
  stripHeightPx: number;
  totalBytes: number;
};

/** Split mono raster into vertical strips of at most chunkHeight rows. */
export function sliceMonoIntoStrips(mono: MonoRaster, chunkHeight = STRIP_HEIGHT_PX): MonoRaster[] {
  if (mono.height <= 0) return [];
  const bytesPerRow = Math.ceil(mono.width / 8);
  const strips: MonoRaster[] = [];
  for (let y = 0; y < mono.height; y += chunkHeight) {
    const stripH = Math.min(chunkHeight, mono.height - y);
    strips.push({
      width: mono.width,
      height: stripH,
      data: mono.data.subarray(y * bytesPerRow, (y + stripH) * bytesPerRow),
    });
  }
  return strips;
}

/** GS v 0 packet for one strip (header + 1-bit row data). */
export function buildGsV0StripPacket(strip: MonoRaster): Uint8Array {
  return buildGsV0Raster(strip);
}

/** Build preamble + N strip packets + feed/cut epilogue for TCP streaming. */
export function buildEscPosStripJob(
  mono: MonoRaster,
  cut = true,
  chunkHeight = STRIP_HEIGHT_PX,
): EscPosStripJob {
  const buildStart = Date.now();
  const stripMonos = sliceMonoIntoStrips(mono, chunkHeight);
  const strips = stripMonos.map(buildGsV0StripPacket);

  const preamble = Uint8Array.from([ESC, 0x40, ESC, 0x33, 0x00]);
  const epilogueParts: number[] = [ESC, 0x64, 0x05];
  if (cut) epilogueParts.push(GS, 0x56, 0x00);
  const epilogue = Uint8Array.from(epilogueParts);

  const totalBytes =
    preamble.length + strips.reduce((sum, strip) => sum + strip.length, 0) + epilogue.length;

  recordPrintTimingSync({
    gs_v0_build_ms: Date.now() - buildStart,
    strip_count: strips.length,
    strip_height_px: chunkHeight,
    raster_payload_bytes: totalBytes,
  });

  return {
    preamble,
    strips,
    epilogue,
    stripCount: strips.length,
    stripHeightPx: chunkHeight,
    totalBytes,
  };
}
