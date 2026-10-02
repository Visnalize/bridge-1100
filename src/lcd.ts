// The phone's LCD, as a grid of square pixels for a game to draw on.
//
// The screen is always ROWS pixels tall. Its width in pixels depends on the phone model, as each
// model's screen has its own shape, so a game reads it from `--cols` or `lcd.cols()`: it is not
// always the Nokia 1100's 96. Nothing runs until a game calls `watch` or `fit`, so a page that only
// imports the bridge, such as Brick 1100's own, is left as it is.

/** The screen's height in LCD pixels, on every phone model. */
var ROWS = 65;

// From this many device pixels per LCD pixel, a fitted grid shrinks to a whole number of them, so
// every LCD pixel is drawn the same size. Below it, shrinking would cost too much of the screen, so
// neighbouring pixels may differ by one device pixel.
var WHOLE_FROM = 4;

// The 3 x 5 pixel font, drawn by hand so no digit is ever smoothed. "#" is a dark pixel.
var GLYPHS: Record<string, string[]> = {
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", ".##", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"],
  7: ["###", "..#", "..#", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"],
  L: ["#..", "#..", "#..", "#..", "###"],
};
var GLYPH_WIDTH = 3;
var GLYPH_GAP = 1;

/** What drawing pixels and digits needs of a canvas context. */
export type PixelContext = Pick<CanvasRenderingContext2D, "fillRect">;

interface Fitted {
  el: HTMLElement;
  cols: number;
  rows: number;
}

var fitted: Fitted[] = [];
var watching = false;

/**
 * @param width The space available, in CSS pixels
 * @returns the size of one LCD pixel, in CSS pixels
 */
function pixelSize(width: number, height: number, cols: number, rows: number, dpr: number): number {
  var px = Math.min(width / cols, height / rows);
  if (px * dpr >= WHOLE_FROM) px = Math.floor(px * dpr) / dpr;
  return px;
}

/** Rounds a length in CSS pixels to a device pixel, so a pixelated canvas stays sharp. */
function snap(value: number): number {
  var dpr = window.devicePixelRatio || 1;
  return Math.round(value * dpr) / dpr;
}

function apply(entry: Fitted): number {
  var px = pixelSize(
    window.innerWidth,
    window.innerHeight,
    entry.cols,
    entry.rows,
    window.devicePixelRatio || 1
  );
  var style = entry.el.style;
  style.position = "absolute";
  style.width = entry.cols * px + "px";
  style.height = entry.rows * px + "px";
  style.left = snap((window.innerWidth - entry.cols * px) / 2) + "px";
  style.top = snap((window.innerHeight - entry.rows * px) / 2) + "px";
  style.setProperty("--px", px + "px");
  return px;
}

/** How many whole LCD pixels fit across the screen. */
function cols(): number {
  return Math.floor(window.innerWidth / (window.innerHeight / ROWS));
}

function update() {
  var root = document.documentElement.style;
  root.setProperty("--px", window.innerHeight / ROWS + "px");
  root.setProperty("--cols", String(cols()));
  fitted.forEach(apply);
}

/**
 * Sets `--px` and `--cols` on the root element, and keeps them, and every fitted grid, up to date as
 * the screen resizes. `--px` is one LCD pixel in CSS pixels, for sizing in CSS:
 * `calc(var(--px) * 5)`.
 */
function watch() {
  if (!watching) {
    watching = true;
    window.addEventListener("resize", update);
  }
  update();
}

/**
 * Keeps `el` sized to a `cols` x `rows` grid, as large as fits and centred, with its own `--px`. With
 * a fixed playfield, a game plays the same on every model, and only the empty margin changes. A
 * canvas game makes its canvas `cols` x `rows` and lets CSS scale it with
 * `image-rendering: pixelated`, so it can only ever draw whole LCD pixels.
 *
 * @returns the size of one LCD pixel, in CSS pixels
 */
function fit(el: HTMLElement, cols: number, rows?: number): number {
  watch();
  fitted = fitted.filter(function (entry) {
    return entry.el !== el;
  });
  var entry = { el: el, cols: cols, rows: rows || ROWS };
  fitted.push(entry);
  return apply(entry);
}

/**
 * Draws a picture, one string per row, where "#" is a dark pixel.
 */
function drawPixels(ctx: PixelContext, rows: string[], x: number, y: number) {
  rows.forEach(function (row, rowY) {
    for (var col = 0; col < row.length; col++) {
      if (row[col] === "#") ctx.fillRect(x + col, y + rowY, 1, 1);
    }
  });
}

/**
 * Draws digits in a 3 x 5 pixel font, for a score or a level number. Words are translated, so they
 * belong in the DOM, in the bitmap fonts of font.css.
 *
 * @param text Digits and "L" only
 * @param y The top row
 */
function drawText(ctx: PixelContext, text: string | number, x: number, y: number) {
  String(text)
    .split("")
    .forEach(function (char, i) {
      drawPixels(ctx, GLYPHS[char], x + i * (GLYPH_WIDTH + GLYPH_GAP), y);
    });
}

/** The width in pixels of `text`, as `drawText` draws it. */
function textWidth(text: string | number): number {
  return Math.max(0, String(text).length * (GLYPH_WIDTH + GLYPH_GAP) - GLYPH_GAP);
}

/** The screen's dark colour, as Brick 1100 sends it, or black before it has. */
function ink(): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "#000"
  );
}

/**
 * Repaints every pixel drawn on the canvas in the screen's dark colour, keeping which are drawn.
 * Call it at the end of each frame. That colour is a little see-through, so pure black looks darker
 * than the rest of the screen, and so does dark drawn over dark: draw each pixel once.
 */
function inkCanvas(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = ink();
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

var lcd = {
  ROWS: ROWS,
  cols: cols,
  pixelSize: pixelSize,
  watch: watch,
  fit: fit,
  drawPixels: drawPixels,
  drawText: drawText,
  textWidth: textWidth,
  ink: ink,
  inkCanvas: inkCanvas,
};

export default lcd;
