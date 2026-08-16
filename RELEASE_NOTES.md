# Release Notes — v1.4.0

## 🚀 New Features

- **Dynamic & Extended OpenAPI Metadata Support in `$$oa` & Global `$$*` Keys ([#50](https://github.com/spailybot/moleculer-auto-openapi/issues/50), [#51](https://github.com/spailybot/moleculer-auto-openapi/pull/51)):**
  - Full support for arbitrary standard OpenAPI metadata properties inside the `$$oa` block of Fastest-Validator rules (e.g., `title`, `description`, `deprecated`, `style`, `explode`, `example`, `allowEmptyValue`, `allowReserved`, etc.).
  - Added support for global meta shortcuts directly on parameter rules: `$$title`, `$$description`, `$$default`, `$$example`, `$$examples`, `$$format`, `$$readOnly`, `$$writeOnly`, `$$deprecated`, `$$pattern`.
  - Automatic OpenAPI 3.1 example pluralization and normalization (`example: "value"` $\rightarrow$ `examples: ["value"]`).
  - Direct schema reference overrides support via `$ref` inside `$$oa` (e.g., `$$oa: { $ref: '#/components/schemas/CustomSchema' }`).
- **Advanced `requestBody` Configuration ([#29](https://github.com/spailybot/moleculer-auto-openapi/issues/29)):**
  - Seamless merge between automatically extracted parameter schemas and manual overrides specified in `action.openapi.requestBody` or `alias.openapi.requestBody`.
  - Support for custom request body metadata (`description`, `required`, content types).

---

## 🏗️ Architecture & Refactoring

- **Modular extraction of `OpenApiGenerator`:**
  - `ComponentsManager`: Centralized management of OpenAPI components (`#/components/schemas`, `#/components/parameters`), reference resolution, and clean deep merging.
  - `ParametersExtractor`: Dedicated parameter extraction and mapping for URL, query, and path parameters with `style`, `explode`, and `deepObject` serialization support.
  - `RequestBodyGenerator`: Dedicated generator for JSON, multipart form data, and streaming request bodies.
- **Testing framework migration (Jest $\rightarrow$ Vitest):**
  - Full migration of the test suite to Vitest with native ESM execution and improved performance.
- **Deep clone & performance optimizations:**
  - Optimized schema cloning and extension stripping across the generator pipeline.

---

## 🔧 Bug Fixes & Improvements

- **Cache handling in mixin:**
  - Added optional chaining (`this?.cache?.enabled`) to safeguard against `TypeError` when `this` context is undefined.
- **Null-safety in extension cleaning:**
  - Fixed null object handling in `removeExtensions`.
- **TypeDoc documentation:**
  - Fixed all compilation errors and eliminated all TypeDoc warnings.

---

## ⚙️ CI/CD & Build Ecosystem

- **Node.js 24 & GitHub Actions update:**
  - Upgraded all GitHub workflow actions to native Node.js 24 targeting releases (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/cache@v6`, `pnpm/action-setup@v6`, `peaceiris/actions-gh-pages@v4`).
- **pnpm v11 compatibility:**
  - Migrated build script policies to `allowBuilds` in `pnpm-workspace.yaml` (`esbuild: true`, `@scarf/scarf: false`), eliminating `ERR_PNPM_IGNORED_BUILDS` errors in CI.

---

## 📦 Dependency Updates

- Upgraded dependencies: `semver`, `fastest-validator`, `swagger-ui-dist`, `qs`, `flatted`, `minimatch`, `js-yaml`, `lodash`.
