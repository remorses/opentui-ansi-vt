import { dlopen, FFIType, ptr, read, suffix, toArrayBuffer } from "bun:ffi"
import path from "path"
import fs from "fs"

function getLibPath(): string {
  // Windows uses .dll without 'lib' prefix
  const libName = process.platform === "win32" ? `pty-to-json.${suffix}` : `libpty-to-json.${suffix}`

  // Check local development path first (zig-out)
  const devPath = path.join(import.meta.dir, "..", "zig-out", "lib", libName)
  if (fs.existsSync(devPath)) {
    return devPath
  }

  // Check npm package dist paths
  const platformMap: Record<string, string> = {
    darwin: "darwin-arm64",
    linux: "linux-x64",
    win32: "win32-x64",
  }
  const platform = platformMap[process.platform] || "linux-x64"
  const distPath = path.join(import.meta.dir, "..", "dist", platform, libName)
  if (fs.existsSync(distPath)) {
    return distPath
  }

  throw new Error(
    `Could not find native library ${libName}. ` +
      `Looked in:\n  - ${devPath}\n  - ${distPath}\n` +
      `Make sure to run 'zig build' or install the package with binaries.`
  )
}

const libPath = getLibPath()

const lib = dlopen(libPath, {
  ptyToJson: {
    args: [FFIType.ptr, FFIType.usize, FFIType.u16, FFIType.u16, FFIType.usize, FFIType.usize, FFIType.ptr],
    returns: FFIType.ptr,
  },
  freeArena: {
    args: [],
    returns: FFIType.void,
  },
})

export interface TerminalSpan {
  text: string
  fg: string | null
  bg: string | null
  flags: number
  width: number
}

export interface TerminalLine {
  spans: TerminalSpan[]
}

export interface TerminalData {
  cols: number
  rows: number
  cursor: [number, number]
  offset: number
  totalLines: number
  lines: TerminalLine[]
}

export interface PtyToJsonOptions {
  cols?: number
  rows?: number
  offset?: number
  limit?: number
}

export function ptyToJson(input: Buffer | Uint8Array | string, options: PtyToJsonOptions = {}): TerminalData {
  const { cols = 120, rows = 40, offset = 0, limit = 0 } = options

  const inputBuffer = typeof input === "string" ? Buffer.from(input) : input
  const inputPtr = ptr(inputBuffer)

  const outLenBuffer = new BigUint64Array(1)
  const outLenPtr = ptr(outLenBuffer)

  const resultPtr = lib.symbols.ptyToJson(inputPtr, inputBuffer.length, cols, rows, offset, limit, outLenPtr)

  if (!resultPtr) {
    throw new Error("ptyToJson returned null")
  }

  const outLen = Number(outLenBuffer[0])
  const jsonBuffer = toArrayBuffer(resultPtr, 0, outLen)
  const jsonStr = new TextDecoder().decode(jsonBuffer)

  lib.symbols.freeArena()

  const raw = JSON.parse(jsonStr) as {
    cols: number
    rows: number
    cursor: [number, number]
    offset: number
    totalLines: number
    lines: Array<Array<[string, string | null, string | null, number, number]>>
  }

  return {
    cols: raw.cols,
    rows: raw.rows,
    cursor: raw.cursor,
    offset: raw.offset,
    totalLines: raw.totalLines,
    lines: raw.lines.map((line) => ({
      spans: line.map(([text, fg, bg, flags, width]) => ({
        text,
        fg,
        bg,
        flags,
        width,
      })),
    })),
  }
}

export const StyleFlags = {
  BOLD: 1,
  ITALIC: 2,
  UNDERLINE: 4,
  STRIKETHROUGH: 8,
  INVERSE: 16,
  FAINT: 32,
} as const
