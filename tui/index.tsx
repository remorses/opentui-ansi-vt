import { createCliRenderer } from "@opentui/core"
import { createRoot, useKeyboard } from "@opentui/react"
import { ptyToJson, StyleFlags, type TerminalData, type TerminalSpan } from "./ffi"

const DEFAULT_FG = "#d4d4d4"
const DEFAULT_BG = "#1e1e1e"

function TerminalSpanView({ span }: { span: TerminalSpan }) {
  const { text, fg, bg, flags } = span

  let fgColor = fg || DEFAULT_FG
  let bgColor = bg || undefined

  if (flags & StyleFlags.INVERSE) {
    const temp = fgColor
    fgColor = bgColor || DEFAULT_BG
    bgColor = temp
  }

  const isBold = !!(flags & StyleFlags.BOLD)
  const isItalic = !!(flags & StyleFlags.ITALIC)
  const isUnderline = !!(flags & StyleFlags.UNDERLINE)
  const isFaint = !!(flags & StyleFlags.FAINT)

  let content: JSX.Element = <>{text}</>

  if (isBold) {
    content = <strong>{content}</strong>
  }
  if (isItalic) {
    content = <em>{content}</em>
  }
  if (isUnderline) {
    content = <u>{content}</u>
  }

  return (
    <span fg={fgColor} bg={bgColor} dim={isFaint}>
      {content}
    </span>
  )
}

function TerminalLineView({ spans }: { spans: TerminalSpan[] }) {
  if (spans.length === 0) {
    return <text> </text>
  }

  return (
    <text>
      {spans.map((span, i) => (
        <TerminalSpanView key={i} span={span} />
      ))}
    </text>
  )
}

export function TerminalView({ data }: { data: TerminalData }) {
  return (
    <box style={{ flexDirection: "column", flexGrow: 1 }}>
      <scrollbox
        focused
        style={{ flexGrow: 1 }}
        rootOptions={{ backgroundColor: DEFAULT_BG }}
        contentOptions={{ backgroundColor: DEFAULT_BG }}
      >
        {data.lines.map((line, i) => (
          <TerminalLineView key={i} spans={line.spans} />
        ))}
      </scrollbox>
      <box style={{ height: 1, backgroundColor: "#21262d", paddingLeft: 1 }}>
        <text fg="#8b949e">
          {data.cols}x{data.rows} | Cursor: ({data.cursor[0]}, {data.cursor[1]}) | Lines: {data.totalLines}
        </text>
      </box>
    </box>
  )
}

function App({ data }: { data: TerminalData }) {
  useKeyboard((key) => {
    if (key.name === "q" || key.name === "escape") {
      process.exit(0)
    }
  })

  return <TerminalView data={data} />
}

const SAMPLE_ANSI = `\x1b[1;34mHello\x1b[0m \x1b[32mWorld\x1b[0m!
\x1b[31mRed\x1b[0m \x1b[33mYellow\x1b[0m \x1b[35mMagenta\x1b[0m
\x1b[1mBold\x1b[0m \x1b[3mItalic\x1b[0m \x1b[4mUnderline\x1b[0m
\x1b[7mInverse\x1b[0m \x1b[2mFaint\x1b[0m
\x1b[38;2;255;100;50mRGB Color\x1b[0m
`

if (import.meta.main) {
  const inputFile = process.argv[2]
  let input: string | Buffer

  if (inputFile) {
    const fs = await import("fs")
    input = fs.readFileSync(inputFile)
  } else {
    input = SAMPLE_ANSI
  }

  const data = ptyToJson(input, { cols: 120, rows: 40 })

  const renderer = await createCliRenderer({ exitOnCtrlC: true })
  createRoot(renderer).render(<App data={data} />)
}
