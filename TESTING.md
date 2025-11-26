# Testing Prop Updates

The example in `tui/index.tsx` now includes an interactive button test:

## How to Test

```bash
bun run dev
```

Then press:
- **'p'** - Adds a purple prefix to the ANSI content
- **'q'** - Quit

## What This Tests

The component properly handles prop updates. Each time you press 'p':
1. React state updates with new ANSI content (prefix added)
2. The component's `ansi` setter is called
3. `ptyToJson()` is called again to re-parse
4. The buffer updates with the new content

## Implementation

The component now has getters/setters for:
- `ansi` - Triggers re-parse when changed
- `cols` - Triggers re-parse when changed  
- `rows` - Triggers re-parse when changed

Each setter calls `updateBuffer()` which re-parses and updates the display.
