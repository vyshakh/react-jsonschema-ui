# react-jsonschema-ui · Expo example

Every sample from the web playground, rendered natively with the Tamagui widget set
(Expo SDK 57, Expo Router).

```sh
pnpm install          # from the repo root
pnpm --filter example start
```

Then press `i` / `a` for a simulator, or scan the QR code with Expo Go.

- `react-jsonschema-ui` and `@react-jsonschema-ui/samples` resolve to their TypeScript source
  (see `metro.config.js`), so library edits hot-reload here.
- Samples live in `packages/samples` and are shared with `docs/`.
- `src/tamagui.config.ts` is the app's own Tamagui config; the form follows its theme
  and the system light/dark setting.
