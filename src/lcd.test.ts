// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import bridge from "./index";

var lcd = bridge.lcd;

/** Sets the window's size, as a game's iframe has it. */
function resize({ width, height, dpr = 1 }: { width: number; height: number; dpr?: number }) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
  Object.defineProperty(window, "devicePixelRatio", { value: dpr, configurable: true });
}

/** A canvas context that notes the pixels filled. */
function fakeContext() {
  var pixels = new Set<string>();
  return {
    pixels,
    fillRect: (x: number, y: number, w: number, h: number) => {
      for (var dy = 0; dy < h; dy++)
        for (var dx = 0; dx < w; dx++) pixels.add(`${x + dx},${y + dy}`);
    },
  };
}

describe("lcd", () => {
  it("leaves the page as it is until a game uses it", () => {
    expect(document.documentElement.style.getPropertyValue("--px")).toBe("");
  });

  // The game area of each phone model, in CSS pixels, as measured in Brick 1100
  it.each([
    ["1100", 272, 201, 87],
    ["3310", 295, 211, 90],
    ["5110", 252, 167, 98],
  ])("gives the %s's screen 65 rows and as many whole columns as fit", (_, width, height, cols) => {
    resize({ width, height });
    lcd.watch();
    expect(lcd.ROWS).toBe(65);
    expect(lcd.cols()).toBe(cols);
    expect(document.documentElement.style.getPropertyValue("--cols")).toBe(String(cols));
    expect(parseFloat(document.documentElement.style.getPropertyValue("--px"))).toBeCloseTo(
      height / 65
    );
  });

  it("fits a grid as large as it can, centred, with square pixels", () => {
    resize({ width: 272, height: 201 });
    var el = document.createElement("div");
    var px = lcd.fit(el, 96, 65);
    expect(px).toBeCloseTo(272 / 96);
    expect(parseFloat(el.style.width)).toBeCloseTo(272);
    expect(parseFloat(el.style.height)).toBeCloseTo(65 * px);
    expect(parseFloat(el.style.left)).toBeCloseTo(0);
    expect(parseFloat(el.style.top)).toBeCloseTo((201 - 65 * px) / 2, 0);
    expect(el.style.getPropertyValue("--px")).toBe(`${px}px`);
  });

  it("fills the screen it is given, at a fraction of a device pixel if need be", () => {
    // 8.5 device pixels a pixel stays 8.5: shrinking to 8 would leave a border round the game
    expect(lcd.pixelSize(272, 201, 96, 65, 3) * 3).toBeCloseTo(8.5);
    expect(lcd.pixelSize(272, 201, 96, 65, 1)).toBeCloseTo(272 / 96);
  });

  it("takes a size within rounding of a whole number of device pixels as exactly that", () => {
    // 4.999 device pixels, as a length worked out to be 5 can come back
    expect(lcd.pixelSize(96 * 2.4995, 201, 96, 65, 2) * 2).toBe(5);
  });

  it("puts a gap at the start of every LCD pixel, a whole number of device pixels apart", () => {
    expect(lcd.gapPositions(4, 5)).toEqual([0, 5, 10, 15]);
  });

  it("puts each gap on the device pixel nearest the pixel's edge when pixels are fractional", () => {
    // 5.4 device pixels a pixel: edges at 0, 5.4, 10.8, 16.2 and 21.6
    expect(lcd.gapPositions(5, 5.4)).toEqual([0, 5, 11, 16, 22]);
    lcd.gapPositions(96, 4.52).forEach((position, i) => expect(Math.abs(position - i * 4.52)).toBeLessThanOrEqual(0.5));
  });

  it("keeps a fitted grid fitted after a resize", () => {
    resize({ width: 272, height: 201 });
    var el = document.createElement("div");
    lcd.fit(el, 96, 65);
    resize({ width: 192, height: 201 });
    window.dispatchEvent(new Event("resize"));
    expect(parseFloat(el.style.width)).toBeCloseTo(192);
  });

  it("draws digits in a 3 x 5 pixel font, a pixel apart", () => {
    var ctx = fakeContext();
    lcd.drawText(ctx, "10", 2, 1);
    // "1" is 8 pixels and "0" is 12, the "0" starting 4 pixels after the "1"
    expect(ctx.pixels.size).toBe(20);
    expect(ctx.pixels.has("3,1")).toBe(true);
    expect(ctx.pixels.has("6,1")).toBe(true);
    expect(ctx.pixels.has("7,3")).toBe(false);
    expect(lcd.textWidth("10")).toBe(7);
    expect(lcd.textWidth("")).toBe(0);
  });

  it("repaints a canvas's drawn pixels in the screen's dark colour", () => {
    document.documentElement.style.setProperty("--background", "#000000e6");
    var calls: string[] = [];
    var ctx = {
      canvas: { width: 96, height: 65 },
      save: () => calls.push("save"),
      restore: () => calls.push("restore"),
      setTransform: () => {},
      fillRect: (x: number, y: number, w: number, h: number) =>
        calls.push(`fill ${x} ${y} ${w} ${h}`),
      set globalCompositeOperation(value: string) {
        calls.push(`composite ${value}`);
      },
      set fillStyle(value: string) {
        calls.push(`fill style ${value}`);
      },
    } as unknown as CanvasRenderingContext2D;
    expect(lcd.ink()).toBe("#000000e6");
    lcd.inkCanvas(ctx);
    // Only where something is drawn: the existing pixels keep their place, and take the colour
    expect(calls).toEqual([
      "save",
      "composite source-in",
      "fill style #000000e6",
      "fill 0 0 96 65",
      "restore",
    ]);
  });
});
