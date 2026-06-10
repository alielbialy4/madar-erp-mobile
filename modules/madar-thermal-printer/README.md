# madar-thermal-printer

Native Android ESC/POS thermal printing module for Madar ERP.

## Architecture

```
React Native (view-shot PNG base64)
  → ThermalPrinter.printReceipt()
  → Kotlin: Base64 decode → Bitmap scale → mono 1-bit → GS v 0
  → TcpConnectionManager (persistent socket)
  → Rongta RP326 :9100
```

## Setup

1. Module is linked via `package.json`: `"madar-thermal-printer": "file:./modules/madar-thermal-printer"`
2. Rebuild dev client: `npm run build:dev-client`
3. Arabic receipts still render in RN; native handles post-capture only.

## API

```typescript
import { ThermalPrinter } from 'madar-thermal-printer';

await ThermalPrinter.printReceipt({
  ip: '192.168.1.150',
  imageBase64: pngBase64,
  paperWidth: '80mm',
  cut: true,
});

await ThermalPrinter.diagnosePrinter('192.168.1.150');
await ThermalPrinter.benchmarkChunks('192.168.1.150', pngBase64, '80mm');
```

## Benchmarking

Use **Settings → تشخيص الطباعة** on device with RP326 at `192.168.1.150`.

See [docs/NATIVE_THERMAL_PRINT_BENCHMARK.md](../../docs/NATIVE_THERMAL_PRINT_BENCHMARK.md).
