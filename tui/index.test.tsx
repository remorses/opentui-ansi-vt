import { describe, expect, it, beforeEach, afterEach } from "bun:test"
import { testRender } from "@opentui/react/test-utils"
import { TerminalView } from "./index"
import type { TerminalData } from "./ffi"

let testSetup: Awaited<ReturnType<typeof testRender>>

describe("TerminalView", () => {
  afterEach(() => {
    if (testSetup) {
      testSetup.renderer.destroy()
    }
  })

  it("should render simple styled text", async () => {
    const data: TerminalData = {
      cols: 80,
      rows: 24,
      cursor: [0, 0],
      offset: 0,
      totalLines: 3,
      lines: [
        {
          spans: [
            { text: "Hello", fg: "#5555ff", bg: null, flags: 1, width: 5 },
            { text: " ", fg: null, bg: null, flags: 0, width: 1 },
            { text: "World", fg: "#55ff55", bg: null, flags: 0, width: 5 },
          ],
        },
        {
          spans: [{ text: "Normal text", fg: null, bg: null, flags: 0, width: 11 }],
        },
        {
          spans: [],
        },
      ],
    }

    testSetup = await testRender(<TerminalView data={data} />, {
      width: 40,
      height: 10,
    })

    await testSetup.renderOnce()
    const frame = testSetup.captureCharFrame()
    expect(frame).toMatchSnapshot()
  })

  it("should render text with all style flags", async () => {
    const data: TerminalData = {
      cols: 80,
      rows: 24,
      cursor: [5, 2],
      offset: 0,
      totalLines: 4,
      lines: [
        {
          spans: [{ text: "Bold", fg: null, bg: null, flags: 1, width: 4 }],
        },
        {
          spans: [{ text: "Italic", fg: null, bg: null, flags: 2, width: 6 }],
        },
        {
          spans: [{ text: "Underline", fg: null, bg: null, flags: 4, width: 9 }],
        },
        {
          spans: [{ text: "Inverse", fg: "#ff0000", bg: null, flags: 16, width: 7 }],
        },
      ],
    }

    testSetup = await testRender(<TerminalView data={data} />, {
      width: 40,
      height: 10,
    })

    await testSetup.renderOnce()
    const frame = testSetup.captureCharFrame()
    expect(frame).toMatchSnapshot()
  })

  it("should render colored terminal output", async () => {
    const data: TerminalData = {
      cols: 120,
      rows: 40,
      cursor: [0, 5],
      offset: 0,
      totalLines: 5,
      lines: [
        {
          spans: [
            { text: "Red", fg: "#ff5555", bg: null, flags: 0, width: 3 },
            { text: " ", fg: null, bg: null, flags: 0, width: 1 },
            { text: "Green", fg: "#55ff55", bg: null, flags: 0, width: 5 },
            { text: " ", fg: null, bg: null, flags: 0, width: 1 },
            { text: "Blue", fg: "#5555ff", bg: null, flags: 0, width: 4 },
          ],
        },
        {
          spans: [{ text: "With background", fg: "#ffffff", bg: "#ff0000", flags: 0, width: 15 }],
        },
        {
          spans: [{ text: "Bold red", fg: "#ff5555", bg: null, flags: 1, width: 8 }],
        },
        {
          spans: [{ text: "Faint text", fg: "#888888", bg: null, flags: 32, width: 10 }],
        },
        {
          spans: [],
        },
      ],
    }

    testSetup = await testRender(<TerminalView data={data} />, {
      width: 50,
      height: 12,
    })

    await testSetup.renderOnce()
    const frame = testSetup.captureCharFrame()
    expect(frame).toMatchSnapshot()
  })

  it("should display info bar with terminal dimensions", async () => {
    const data: TerminalData = {
      cols: 80,
      rows: 24,
      cursor: [10, 5],
      offset: 0,
      totalLines: 100,
      lines: [{ spans: [{ text: "Test", fg: null, bg: null, flags: 0, width: 4 }] }],
    }

    testSetup = await testRender(<TerminalView data={data} />, {
      width: 60,
      height: 8,
    })

    await testSetup.renderOnce()
    const frame = testSetup.captureCharFrame()
    expect(frame).toContain("80x24")
    expect(frame).toContain("Cursor: (10, 5)")
    expect(frame).toContain("Lines: 100")
  })
})
