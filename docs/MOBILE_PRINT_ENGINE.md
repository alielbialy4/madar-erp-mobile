# Mobile Print Engine

## Module layout

```
src/services/printing/
  printEngine.ts          # public API
  printQueue.ts           # AsyncStorage job queue
  printerProfiles.ts      # profile CRUD
  escposBuilder.ts        # ESC/POS bytes
  receiptTemplates.ts
  kitchenTicketTemplates.ts
  networkTcpPrinter.ts    # TCP :9100 (native module optional)
  androidBluetoothPrinter.ts
  iosAirPrintPrinter.ts
  printDiagnostics.ts
  printerCapabilities.ts
```

## API

- `printEngine.print(job)`
- `printEngine.printReceipt(payload, profile)`
- `printEngine.printKitchenTicket(payload, profile)`
- `printEngine.printShiftSummary(payload, profile)`
- `printEngine.testConnection(profile)`
- `printEngine.printTestPage(profile)`
- `printEngine.printArabicTest(profile)`
- `printEngine.processPendingQueue()`

## Job lifecycle

`pending` → `printing` → `printed` | `failed` | `cancelled`

Failed jobs store `error_message`; UI supports retry via `PrintQueueScreen`.

## Dev Client / native modules

| Transport | Expo Go | Dev Client + prebuild |
|-----------|---------|------------------------|
| network_tcp | Blocked (clear error) | `react-native-tcp-socket` |
| bluetooth_android | Blocked | `react-native-bluetooth-escpos-printer` (planned) |
| airprint_ios | Blocked | `expo-print` (dialog, not silent) |

Do not claim Expo Go supports raw TCP or Bluetooth ESC/POS.
