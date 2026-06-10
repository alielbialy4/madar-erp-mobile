# Native Thermal Print — Benchmark Report (Rongta RP326)

## Printer

| Setting | Value |
|---------|-------|
| Model | Rongta RP326 |
| Connection | Ethernet TCP |
| IP | 192.168.1.150 |
| Port | 9100 |
| Paper | 80mm (576 dots) |

## How to run benchmarks

1. Rebuild dev client after adding `madar-thermal-printer`: `npm run build:dev-client`
2. Open **Settings → تشخيص الطباعة**
3. Select cashier profile with IP `192.168.1.150`
4. Run:
   - **Baseline 10× (JS vs Native)** — compares JS pipeline vs native post-capture
   - **Chunk benchmark** — tests transfer chunk sizes 512–8192
   - **تشخيص Native (TCP)** — socket reachability

## Pipeline comparison

| Stage | JS path | Native Android path |
|-------|---------|---------------------|
| Arabic render | RN view-shot | RN view-shot (unchanged) |
| Image decode | UPNG (JS) | `BitmapFactory` (Kotlin) |
| Mono conversion | JS loops | `Bitmap.getPixels()` bulk |
| ESC/POS | `buildEscPosFromMono` | `EscPosRasterBuilder` |
| TCP | New socket per print | Persistent pool (`TcpConnectionManager`) |

## Expected bottleneck attribution

Fill after on-device runs:

| Metric | JS avg (ms) | Native avg (ms) | Notes |
|--------|-------------|-----------------|-------|
| Render (view-shot) | ___ | ___ | Dominant if > 60% of total |
| Bitmap processing | ___ | ___ | |
| Raster build | ___ | ___ | |
| TCP connect | ___ | ___ | Native should → ~0 on 2nd print |
| TCP transfer | ___ | ___ | |
| **Total** | ___ | ___ | |

## Chunk size results (RP326)

| Chunk (bytes) | Transfer (ms) | Success |
|---------------|---------------|---------|
| 512 | ___ | |
| 1024 | ___ | |
| 2048 | ___ | |
| 4096 | ___ | |
| 8192 | ___ | |

Default in app: **8192** bytes, settle **80ms**.

## Target vs realistic ceiling

| Scenario | Expected duration |
|----------|-------------------|
| Current JS (reported) | 8–10s |
| Native post-capture only | −0.5 to −2s vs JS |
| **&lt;3s total** | Only if view-shot &lt; ~2s AND printer HW &lt; ~1s |

If view-shot remains 5–7s, **native module cannot reach &lt;3s** without moving capture off RN.

## Before / after template

```
BEFORE (JS):
  view_shot: ____ms
  png_decode + mono: ____ms
  tcp_connect: ____ms
  tcp_write: ____ms
  total: ____ms

AFTER (Native):
  view_shot: ____ms  (unchanged)
  native_bitmap + raster: ____ms
  native_connect: ____ms  (2nd print: ~0)
  native_transfer: ____ms
  total: ____ms
```

## Library choice

**Custom Kotlin** (not DantSu): full control over GS v 0, no 256px strip limit, persistent TCP, precise timing. DantSu retained as reference only.
