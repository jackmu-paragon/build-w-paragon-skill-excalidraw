# AGENTS.md

This file provides guidelines for AI coding agents working in the Excalidraw codebase.

## Project Structure

Excalidraw is a **monorepo** with a clear separation between the core library and the application:

- **`packages/excalidraw/`** - Main React component library published to npm as `@excalidraw/excalidraw`
- **`excalidraw-app/`** - Full-featured web application (excalidraw.com) that uses the library
- **`packages/`** - Core packages: `@excalidraw/common`, `@excalidraw/element`, `@excalidraw/math`, `@excalidraw/utils`
- **`examples/`** - Integration examples (NextJS, browser script)

## Build/Lint/Test Commands

### Core Development Commands

```bash
yarn start               # Start development server
yarn build               # Build the app
yarn build:packages      # Build all packages (common, math, element, excalidraw)
```

### Testing Commands

```bash
yarn test:app            # Run Vitest tests (watch mode)
yarn test:update         # Run tests and update snapshots (use before committing)
yarn test:all            # All tests: typecheck + eslint + prettier + tests
yarn test:typecheck      # TypeScript type checking only
yarn test:coverage       # Tests with coverage report
```

### Running a Single Test

```bash
# Run specific test file
yarn test:app packages/excalidraw/tests/selection.test.tsx

# Run tests matching a name pattern
yarn test:app -t "should select element"

# Watch mode for specific file
yarn test:app packages/excalidraw/tests/selection.test.tsx --watch
```

In test files, use `.only` or `.skip`:

```typescript
it.only("runs only this test", () => { ... });
describe.only("runs only this suite", () => { ... });
it.skip("skips this test", () => { ... });
```

### Linting and Formatting

```bash
yarn fix                 # Auto-fix all formatting and linting issues
yarn fix:code            # ESLint with --fix
yarn fix:other           # Prettier with --write
yarn test:code           # ESLint check (max-warnings=0)
yarn test:other          # Prettier check
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code with strict mode enabled
- Prefer implementations without allocation where possible
- Opt for performant solutions; trade RAM for fewer CPU cycles
- Prefer immutable data (`const`, `readonly`)
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Separate type imports from value imports:

```typescript
import { something } from "module";
import type { SomeType } from "module";
```

### Import Order (enforced by ESLint)

1. builtin
2. external
3. internal (`@excalidraw/*`)
4. parent
5. sibling
6. index
7. object
8. type

### Package Imports

```typescript
import { something } from "@excalidraw/common";
import { pointFrom } from "@excalidraw/math";
import type { ExcalidrawElement } from "@excalidraw/element/types";
```

**Important**: Do not import from `jotai` directly. Use `editor-jotai` or `app-jotai` instead.

### Naming Conventions

- **PascalCase**: Component names, interfaces, type aliases
- **camelCase**: Variables, functions, methods
- **ALL_CAPS**: Constants

### React Guidelines

- Use functional components with hooks
- Follow React hooks rules (no conditional hooks)
- Keep components small and focused
- Use CSS modules for component styling

### Math Types

When writing math-related code, always use types from `packages/math/src/types.ts`:

```typescript
import type {
  GlobalPoint,
  LocalPoint,
  Vector,
  Radians,
} from "@excalidraw/math";

// Use tuple points, NOT { x, y } objects
const point: GlobalPoint = pointFrom(10, 20);
```

Key types: `GlobalPoint`, `LocalPoint`, `Vector`, `Radians`, `Degrees`, `LineSegment`, `Polygon`, `Curve`

### Error Handling

- Use try/catch blocks for async operations
- Implement error boundaries in React components
- Log errors with contextual information
- Use custom error classes from `packages/excalidraw/errors.ts`:
  - `CanvasError`, `AbortError`, `ImageSceneDataError`
  - `ExcalidrawError` (generic handled error)
  - `RequestError` (with status and data)

```typescript
try {
  await riskyOperation();
} catch (error: unknown) {
  console.error("Operation failed:", error);
  throw new ExcalidrawError("Descriptive message");
}
```

## Development Workflow

1. **Package Development**: Work in `packages/*` for editor features
2. **App Development**: Work in `excalidraw-app/` for app-specific features
3. **Testing**: Always run `yarn test:update` before committing
4. **Type Safety**: Use `yarn test:typecheck` to verify TypeScript

## Architecture Notes

### Package System

- Uses Yarn workspaces for monorepo management
- Internal packages use path aliases (see `vitest.config.mts`)
- Build system uses esbuild for packages, Vite for the app

### Key Directories

- `packages/excalidraw/components/` - React UI components
- `packages/excalidraw/actions/` - User action handlers
- `packages/element/` - Element manipulation logic
- `packages/math/` - Geometry and math utilities
- `packages/common/` - Shared utilities

## Agent Communication Guidelines

- Be succinct; avoid expansive explanations unless asked
- Prefer code over explanations
- Don't apologize for corrections; just provide correct information
- Don't summarize changes after modifications unless asked
- Always attempt to fix problems reported by tests/linting
- Offer to run `yarn test:app` after modifications and fix issues
