# DSF Media – Rechnungs-App (Mobile)

React Native + Expo (SDK 58) version of the web invoice app `dsf-invoice-app`. Same business rules,
same PDFs, redesigned for the phone: big touch targets, one topic per screen, everything autosaves.

- **Rechnungen**: a 5-step wizard (Auftrag → Objekt → Leistungen → Material → Abschluss) with a live total.
- **Fahrten**: travel statement (Fahrtkostenabrechnung) with optional "Kunde" and "Fahrdauer" columns.
- **Preise**: the price list (37 partner positions + material).
- **Einstellungen**: company data, tax ids and bank (each printed only when switched on), defaults, backup.
- PDFs are shared through the system share sheet (mail, WhatsApp, Files, print).

## Run it

Requires **Node 22.13 or newer** (Expo SDK 58 / React Native 0.88). Node 20 prints warnings and may break.

```bash
npm install
npx expo start          # scan the QR code with Expo Go (iOS / Android), or press a / i / w
```

```bash
npm run typecheck       # tsc --noEmit
npx eslint src          # eslint (expo config, React Compiler rules)
npx expo export --platform android --platform ios   # proves both native bundles compile
```

`npm run web` runs the app in a browser for development. The browser build is not a product:
on the phone the PDF is created by `expo-print`, in the browser by the print dialog.

## Architecture

```
src/
  domain/    Pure business logic, copied from the web app (types, totals, line splitting, rules).
             Only money.ts / dates.ts / id.ts differ: no Intl, no web crypto (Hermes).
  data/
    ports.ts     The contract the UI knows (same interfaces as the web app).
    local/       AsyncStorage implementation (one JSON document per collection, writes are serialized).
    index.ts     Composition root: the ONE place that picks the implementation.
    hooks.ts     React Query hooks + RepositoryProvider. Components never import data/local.
  pdf/       invoiceHtml.ts, travelHtml.ts -> HTML (595 x 842 px, 1 px = 1 pt) -> expo-print -> PDF.
  features/  invoice/ (wizard) · travel/ · useAutosave
  ui/        Small design system: theme, Button, Field, Controls, Layout, Sheet, DateField.
  app/       Expo Router screens: (tabs)/ · invoice/[id] · travel/[id] (+ /preview).
```

Rules that keep it swappable:

- Every repository method is `async`, so a backend (REST, Supabase) can implement `src/data/ports.ts`
  and be exported from `src/data/index.ts` instead of the local one.
- Money is integer cents everywhere; German formatting is done by hand in `domain/money.ts`.
- Issued invoices and finalized travel statements are immutable; the invoice number is assigned inside
  `issue()` (the counter is written before the invoice, so a crash can skip a number but never reuse one).

`src/domain` and `src/data/ports.ts` are a copy of the web app's code, not a shared package. If a business
rule changes, change it in both projects (a monorepo / shared package is the next step if that becomes a chore).

## Backup compatibility

"Sicherung speichern" writes the same JSON format as the web app (`version: 1`, invoices, travel, catalog,
company, counters). A backup from the web app can be imported here and the other way round.
All data lives only on the device: make backups regularly.

## PDF output

The PDFs are built as HTML with the same geometry as the web app's react-pdf documents and rendered by the
phone's own print engine. Arimo (Helvetica-compatible, embedded) keeps the text metrics identical on iOS and
Android. Compared against the web app's PDFs for the same data: horizontal positions match to 0.3 pt, vertical
positions to about 1 pt, and pages break at the same place.

Differences you may notice:

- A very long description makes the row grow (the web PDF keeps a fixed 19 pt row and lets the text overflow).
- In the travel table with the optional "Kunde" column, row heights follow the text; react-pdf is inconsistent there.

## Not tested here

Tested in a desktop browser (flows, storage, PDF geometry), type-checked, linted and bundled for Android and
iOS. **Not** run on a real phone: please try PDF sharing, the date pickers and backup import/export on your device.
