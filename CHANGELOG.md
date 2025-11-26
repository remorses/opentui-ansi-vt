# Changelog

## 1.2.3

### Features

- **terminal-buffer**: Add text highlighting support
  - New `HighlightRegion` interface for specifying highlight regions with `line`, `start`, `end`, `backgroundColor`
  - `replaceWithX` option to mask highlighted text with 'x' characters (useful for testing)
  - `applyHighlightsToLine` function to apply highlights to text chunks
  - `terminalDataToStyledText` now accepts optional `highlights` parameter
  - `TerminalBufferRenderable` now accepts `highlights` option in constructor and as a property

## 1.2.2

### Bug Fixes

- **zig**: Disable all logging from ghostty-vt library
  - Suppresses unwanted console messages (e.g., "adjusting page opacity") when using the package

## 1.2.1

### Bug Fixes

- **zig**: Enable linefeed mode to fix newline column reset
  - Lines containing ANSI escape sequences followed by `\n` were wrapping incorrectly
  - Example: `import { readFileSync } from 'fs';` would split as `import { readFileSync } from 'f` + `s';`
  - Root cause: LF (0x0A) only moves cursor down without resetting column in standard VT100 behavior
  - Fix: Enable ghostty's linefeed mode so LF also performs carriage return (column reset)

### Dev Dependencies

- Added `@types/react` for TypeScript type checking
