import {
  TextBufferRenderable,
  type TextBufferOptions,
  StyledText,
  RGBA,
  type RenderContext,
  type TextChunk,
} from "@opentui/core"
import { ptyToJson, type TerminalData, type TerminalSpan, StyleFlags } from "./ffi"

const DEFAULT_FG = RGBA.fromHex("#d4d4d4")

const TextAttributes = {
  BOLD: 1 << 0,
  DIM: 1 << 1,
  ITALIC: 1 << 2,
  UNDERLINE: 1 << 3,
  BLINK: 1 << 4,
  REVERSE: 1 << 5,
  HIDDEN: 1 << 6,
  STRIKETHROUGH: 1 << 7,
}

function convertSpanToChunk(span: TerminalSpan): TextChunk {
  const { text, fg, bg, flags } = span

  let fgColor = fg ? RGBA.fromHex(fg) : DEFAULT_FG
  let bgColor = bg ? RGBA.fromHex(bg) : undefined

  if (flags & StyleFlags.INVERSE) {
    const temp = fgColor
    fgColor = bgColor || DEFAULT_FG
    bgColor = temp
  }

  let attributes = 0
  if (flags & StyleFlags.BOLD) attributes |= TextAttributes.BOLD
  if (flags & StyleFlags.ITALIC) attributes |= TextAttributes.ITALIC
  if (flags & StyleFlags.UNDERLINE) attributes |= TextAttributes.UNDERLINE
  if (flags & StyleFlags.STRIKETHROUGH) attributes |= TextAttributes.STRIKETHROUGH
  if (flags & StyleFlags.FAINT) attributes |= TextAttributes.DIM

  return { __isChunk: true, text, fg: fgColor, bg: bgColor, attributes }
}

export function terminalDataToStyledText(data: TerminalData): StyledText {
  const chunks: TextChunk[] = []

  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i]

    if (line.spans.length === 0) {
      chunks.push({ __isChunk: true, text: " ", attributes: 0 })
    } else {
      for (const span of line.spans) {
        chunks.push(convertSpanToChunk(span))
      }
    }

    if (i < data.lines.length - 1) {
      chunks.push({ __isChunk: true, text: "\n", attributes: 0 })
    }
  }

  return new StyledText(chunks)
}

export interface TerminalBufferOptions extends TextBufferOptions {
  ansi: string | Buffer
  cols?: number
  rows?: number
}

export class TerminalBufferRenderable extends TextBufferRenderable {
  private _ansi: string | Buffer
  private _cols: number
  private _rows: number
  private _ansiDirty: boolean = false
  private _lineCount: number = 0

  constructor(ctx: RenderContext, options: TerminalBufferOptions) {
    super(ctx, {
      ...options,
      fg: DEFAULT_FG,
      wrapMode: "none",
    })

    this._ansi = options.ansi
    this._cols = options.cols ?? 120
    this._rows = options.rows ?? 40
    this._ansiDirty = true
  }

  /**
   * Returns the total number of lines in the terminal buffer
   */
  get lineCount(): number {
    return this._lineCount
  }

  get ansi(): string | Buffer {
    return this._ansi
  }

  set ansi(value: string | Buffer) {
    if (this._ansi !== value) {
      this._ansi = value
      this._ansiDirty = true
      this.requestRender()
    }
  }

  get cols(): number {
    return this._cols
  }

  set cols(value: number) {
    if (this._cols !== value) {
      this._cols = value
      this._ansiDirty = true
      this.requestRender()
    }
  }

  get rows(): number {
    return this._rows
  }

  set rows(value: number) {
    if (this._rows !== value) {
      this._rows = value
      this._ansiDirty = true
      this.requestRender()
    }
  }

  protected renderSelf(buffer: any): void {
    if (this._ansiDirty) {
      const data = ptyToJson(this._ansi, { cols: this._cols, rows: this._rows })
      this._lineCount = data.lines.length
      const styledText = terminalDataToStyledText(data)
      this.textBuffer.setStyledText(styledText)
      this.updateTextInfo()
      this._ansiDirty = false
    }
    super.renderSelf(buffer)
  }

  /**
   * Maps an ANSI line number to the corresponding scrollTop position for a parent ScrollBox.
   * Uses the actual rendered Y position from the text buffer's line info, which accounts
   * for text wrapping and actual layout.
   * 
   * @param lineNumber - The line number (0-based) in the ANSI output
   * @returns The scrollTop value to pass to ScrollBox.scrollTo()
   * 
   * @example
   * ```tsx
   * const scrollPos = terminalBufferRef.current.getScrollPositionForLine(42)
   * scrollBoxRef.current.scrollTo(scrollPos)
   * ```
   */
  getScrollPositionForLine(lineNumber: number): number {
    // Clamp to valid range
    const clampedLine = Math.max(0, Math.min(lineNumber, this._lineCount - 1))
    
    // Get the line info which contains actual Y offsets for each line
    // This accounts for wrapping and actual text layout
    const lineInfo = this.textBufferView.logicalLineInfo
    const lineStarts = lineInfo.lineStarts
    
    // If we have line start info, use it; otherwise fall back to simple calculation
    let lineYOffset = clampedLine
    if (lineStarts && lineStarts.length > clampedLine) {
      lineYOffset = lineStarts[clampedLine]
    }
    
    // Return the absolute Y position: this renderable's Y + the line's offset within it
    return this.y + lineYOffset
  }
}
