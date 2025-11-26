# pty-to-json

Fast ANSI/VT terminal parser powered by [Ghostty's](https://github.com/ghostty-org/ghostty) Zig terminal emulation library. Converts raw PTY logs to JSON or renders them in a TUI viewer.

## Features

- **Fast** - Written in Zig, processes terminal escape sequences at native speed
- **Full VT emulation** - ANSI colors (16/256/RGB), styles, cursor movements, scrolling
- **TUI Viewer** - Interactive terminal viewer built with [opentui](https://github.com/sst/opentui)
- **JSON output** - Compact format with merged spans for rendering
- **Bun FFI** - Use the Zig library directly from TypeScript

## Installation

```bash
bun add pty-to-json
```

## Usage

### Basic FFI Usage

```typescript
import { ptyToJson, type TerminalData } from "pty-to-json"

// Parse ANSI string or buffer
const data: TerminalData = ptyToJson("\x1b[32mHello\x1b[0m World", {
  cols: 120,
  rows: 40,
})

console.log(data.lines) // Array of lines with styled spans
console.log(data.cursor) // [col, row] cursor position
```

### With OpenTUI React

```tsx
import { ptyToJson } from "pty-to-json"
import "pty-to-json/terminal-buffer" // Register the <terminal-buffer> component

// Parse your ANSI data
const data = ptyToJson(ansiContent, { cols: 120, rows: 40 })

// Render in OpenTUI
function TerminalViewer() {
  return (
    <scrollbox focused style={{ flexGrow: 1 }}>
      <terminal-buffer data={data} />
    </scrollbox>
  )
}
```

### Terminal Buffer Component

The `<terminal-buffer>` component renders parsed terminal data with full styling support:

```tsx
import "pty-to-json/terminal-buffer"

<terminal-buffer
  data={terminalData}  // TerminalData from ptyToJson()
/>
```

### TypeScript Types

```typescript
import type { TerminalData, TerminalLine, TerminalSpan, PtyToJsonOptions } from "pty-to-json"

interface TerminalData {
  cols: number
  rows: number
  cursor: [number, number]
  offset: number
  totalLines: number
  lines: TerminalLine[]
}

interface TerminalSpan {
  text: string
  fg: string | null   // hex color e.g. "#ff5555"
  bg: string | null
  flags: number       // StyleFlags bitmask
  width: number
}

// StyleFlags: bold=1, italic=2, underline=4, strikethrough=8, inverse=16, faint=32
```

## Quick Start (Development)

```bash
# Setup (installs Zig 0.15.2, clones Ghostty, builds)
./setup.sh

# Run TUI viewer with sample
bun run dev

# Or convert a file to JSON
./zig-out/bin/pty-to-json session.log > output.json
```

## TUI Viewer

```bash
bun run dev                      # sample ANSI demo
bun run dev testdata/session.log # view a file
```

Controls: `↑/↓` scroll, `Page Up/Down` page, `Home/End` jump, `q/Esc` quit

```
┌─────────────────────────────────────┐
│ rootOptions (outer container)       │
│  ┌─────────────────────────────┐ ▲  │
│  │ viewport (visible area)     │ █  │ ← scrollbar
│  │  ┌─────────────────────┐    │ █  │
│  │  │ content (padded)    │    │ █  │
│  │  │  ┌───────────────┐  │    │ ▼  │
│  │  │  │ terminal lines│  │    │    │
│  │  │  └───────────────┘  │    │    │
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 120x40 | Cursor | Lines     │    │ ← info bar
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Raw PTY     │ ──▶ │  Zig VT      │ ──▶ │  JSON/TUI    │
│  (ANSI bytes)│     │  Emulator    │     │  Output      │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. **Input** - Raw PTY bytes with ANSI escape sequences
2. **Zig Processing** - Ghostty's VT parser emulates a full terminal
3. **Output** - JSON with styled spans, or rendered in TUI

The Zig library is exposed via Bun FFI for the TUI:

```typescript
import { ptyToJson } from "./tui/ffi"

const data = ptyToJson(ansiBuffer, { cols: 120, rows: 40 })
// Returns: { cols, rows, cursor, lines: [{ spans: [...] }] }
```

## JSON Format

```json
{
  "cols": 120,
  "rows": 40,
  "cursor": [0, 5],
  "totalLines": 42,
  "lines": [
    [["Hello ", "#5555ff", null, 1, 6], ["World", "#55ff55", null, 0, 5]]
  ]
}
```

Each span: `[text, fg, bg, flags, width]`

Flags: `bold=1, italic=2, underline=4, strikethrough=8, inverse=16, faint=32`

## CLI Usage

```bash
pty-to-json [OPTIONS] [FILE]

Options:
  -c, --cols N      Terminal width (default: 120)
  -r, --rows N      Terminal height (default: 40)
  -o, --output FILE Write to file instead of stdout
  --offset N        Start from line N (pagination)
  --limit N         Max lines to output
```

## Requirements

- **Zig 0.15.2** - Required by Ghostty
- **Bun** - For TUI viewer and FFI
- **Ghostty** - Cloned adjacent to this repo (setup.sh handles this)

## Development

```bash
zig build                        # debug build
zig build -Doptimize=ReleaseFast # release build
zig build test                   # run Zig tests
bun test                         # run TUI tests
```

## License

MIT
