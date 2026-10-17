# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm + Turborepo workspace (`packages/*`, `docs`, `example`). Run from the repo root unless noted.

```sh
pnpm test                 # vitest in packages/react-jsonschema-ui (unit, jsdom render, type tests)
pnpm typecheck            # tsc across all workspaces (library, samples, docs, example)
pnpm lint                 # biome check .   (pnpm format to apply fixes)
pnpm build                # tsup library build + docs vite build
pnpm docs                 # playground dev server
pnpm --filter example start   # Expo dev server (SDK 57)
```

Single test file / test name (from `packages/react-jsonschema-ui`):

```sh
../../node_modules/.bin/vitest run src/store/createFormStore.test.ts
../../node_modules/.bin/vitest run -t "re-renders only the field that changed"
```

Expo checks (from `example/`): `npx expo install --check`, `npx expo-doctor`,
`npx expo export --platform ios --platform android` (bundles without a device).

## Architecture

The published package is `packages/react-jsonschema-ui` (npm name `react-jsonschema-ui`; the
unscoped `react-schema-ui` belongs to someone else). Layers depend only on earlier ones:

`schema/` (types, `InferSchema`, `UiSchema`) → `utils/pointer` → `parser/` → `validation/` →
`store/` → `react/` (context + hooks) → `registry/` + `renderer/` → `tamagui/` (widgets/templates)

- **Entry points.** `src/core.ts` → `react-jsonschema-ui/core` is headless and must never import
  `tamagui` (check `dist/core.js` + its chunk after building). `src/index.ts` re-exports core plus
  `tamagui/`, and its explicit `export { SchemaForm }` deliberately shadows the headless one.
- **JSON Pointers are the only addressing scheme**: store keys, error-map keys, field ids
  (`root_a_b`). They match Ajv's `instancePath`; `required` errors are re-pointed at the missing child
  in `validation/ajv.ts`.
- **Parser** (`parser/parse.ts`) turns schema + uiSchema into a value-independent `FieldNode` tree,
  cached by object identity of both. Nodes carry no pointers (array items share one template
  node); object `properties` and array `items` are lazy getters so recursive `$ref`s work.
  `resolve.ts` memoizes per input object so recursion detection in `getDefaultValues` can compare
  schema identity.
- **Store** (`store/createFormStore.ts`) is a vanilla Zustand store. Performance depends on
  structural sharing: `setIn` copies only the changed path, `shareErrors` keeps unchanged error
  arrays/maps by identity. Array ops (`remap.ts`) re-key errors, touched flags and stable
  `itemKeys` so item components keep their state across remove/move. Validation timing
  (`validateOn`) scopes errors to the visited field before the first submit, then re-validates the
  whole form.
- **Renderer** (`renderer/SchemaField.tsx`) is memoized on `(node, pointer)`; each adapter
  subscribes only to its own store slices — tests assert sibling fields don't re-render.
  `createSchemaForm(baseRegistry)` builds a `<SchemaForm>`; the registry is merged per form from
  `widgets` / `fields` / `templates` overrides. Headless templates render fragments only.
- **Tamagui widgets** use longhand style props (they work under any Tamagui config; shorthands
  only exist if the app's config defines them). Tamagui is pinned to **2.x** (`^2.7.0` peer);
  3.x has a different API. Widget value conversions that matter: number widget keeps partial text
  locally (no `type="number"`), date-time/time widgets emit RFC 3339 strings Ajv accepts.

## Workspace conventions

- `docs/` and `example/` compile the library from source through the custom export condition
  `@react-jsonschema-ui/source` (Vite `resolve.conditions`, Metro `unstable_conditionNames`,
  TS `customConditions`). No rebuild is needed while developing.
- `packages/samples` (`@react-jsonschema-ui/samples`, private) holds the sample schemas shared by
  the playground and the Expo app — add new samples there.
- `pnpm-workspace.yaml` pins `react`/`react-dom` 19.2.3, `react-native` 0.86.3, Reanimated and
  Worklets workspace-wide. Expo SDK 57 needs exactly these; duplicates break hooks or native
  builds. Change them only together with an Expo SDK upgrade, and re-run `expo-doctor`.
- In `example/`, add packages with `npx expo install` (except `tamagui`/`@tamagui/*`, which must
  stay on 2.7.x — `expo install` would pick 3.x).
- Library tests that render Tamagui run in jsdom with `react-native` aliased to `react-native-web`
  (`vitest.config.ts`) and stubs in `vitest.setup.ts`. jsdom's "Could not parse CSS stylesheet"
  output is noise.
- `nodeLinker: hoisted` is required for Expo/Metro.

## Releasing

`pnpm --filter react-jsonschema-ui publish` — `prepack` copies the root README/LICENSE into the
package and builds; `postpack` removes the copies. Docs deploy via `.github/workflows/docs.yml` on
pushes to `main` (Pages source must be "GitHub Actions").
