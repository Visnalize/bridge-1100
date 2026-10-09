// The phone's LCD, as a grid of pixels 6 wide to 7 tall for a game to draw on, and the one place its
// geometry is defined: Brick 1100 sizes its own screen from these too, so a game and the phone always
// agree. `--px` is a pixel's height and `--px-x` its width: size vertical things in the one and
// horizontal things in the other.
//
// The screen is always ROWS pixels tall. Its width in pixels depends on the phone model, as each
// model's screen has its own shape, so a game reads it from `--cols` or `lcd.cols()`: it is not
// always the Nokia 1100's 96. Nothing runs until a game calls `watch` or `fit`, so a page that only
// imports the bridge, such as Brick 1100's own, is left as it is.

/** The screen in LCD pixels: the Nokia 1100's 96 x 65, on every phone model. */
var COLS = 96;
var ROWS = 65;
/**
 * An LCD pixel's width as a share of its height. The Nokia 1100's pixels are taller than wide, as
 * its circles come out upright ovals and its 96 x 65 panel is 1.27 times as wide as tall, not 1.48;
 * the phone's own fonts are drawn on pixels of this shape.
 */
var PIXEL_ASPECT = 6 / 7;

// Slack for the rounding of CSS lengths: a size worked out to be 5 device pixels may come back 4.999.
var ROUNDING = 0.01;

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
 * @returns the height of one LCD pixel, in CSS pixels, for a grid of `cols` x `rows` as large as fits;
 *   its width is PIXEL_ASPECT of that
 */
function pixelSize(width: number, height: number, cols: number, rows: number, dpr: number): number {
  // As large as fits, so the grid fills the screen it is given. Brick 1100 gives a game a screen of
  // exactly 96 x 65 of its own LCD pixels, so this is the phone's own pixel; snapping it to fewer
  // device pixels would leave a border round the game.
  var px = Math.min(width / (cols * PIXEL_ASPECT), height / rows);
  var whole = Math.round(px * dpr);
  return Math.abs(px * dpr - whole) < ROUNDING ? whole / dpr : px;
}

/**
 * Where the gaps between `count` LCD pixels of `devicePx` device pixels each fall, in device pixels:
 * the device pixel nearest each pixel's start edge. When an LCD pixel is a fraction of a device
 * pixel, this is as close as a one-device-pixel line can get, so neighbouring gaps are a device pixel
 * nearer or further apart, as the pixels' own edges are.
 */
function gapPositions(count: number, devicePx: number): number[] {
  var positions: number[] = [];
  for (var i = 0; i < count; i++) positions.push(Math.round(i * devicePx));
  return positions;
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
  var column = px * PIXEL_ASPECT;
  var style = entry.el.style;
  style.position = "absolute";
  style.width = entry.cols * column + "px";
  style.height = entry.rows * px + "px";
  style.left = snap((window.innerWidth - entry.cols * column) / 2) + "px";
  style.top = snap((window.innerHeight - entry.rows * px) / 2) + "px";
  style.setProperty("--px", px + "px");
  style.setProperty("--px-x", column + "px");
  return px;
}

/** How many whole LCD pixels fit across the screen. */
function cols(): number {
  return Math.floor(window.innerWidth / ((window.innerHeight / ROWS) * PIXEL_ASPECT));
}

function update() {
  var root = document.documentElement.style;
  root.setProperty("--px", window.innerHeight / ROWS + "px");
  root.setProperty("--px-x", (window.innerHeight / ROWS) * PIXEL_ASPECT + "px");
  root.setProperty("--cols", String(cols()));
  fitted.forEach(apply);
}

/**
 * Sets `--px`, `--px-x` and `--cols` on the root element, and keeps them, and every fitted grid, up to
 * date as the screen resizes. `--px` is an LCD pixel's height and `--px-x` its width, in CSS pixels,
 * for sizing in CSS: `calc(var(--px-x) * 5)` across, `calc(var(--px) * 5)` down.
 */
function watch() {
  if (!watching) {
    watching = true;
    window.addEventListener("resize", update);
  }
  update();
}

/**
 * Keeps `el` sized to a `cols` x `rows` grid, as large as fits and centred, with its own `--px` and
 * `--px-x`. With
 * a fixed playfield, a game plays the same on every model, and only the empty margin changes. A
 * canvas game makes its canvas `cols` x `rows` and lets CSS scale it with
 * `image-rendering: pixelated`, so it can only ever draw whole LCD pixels, in the LCD's own shape.
 *
 * @returns the height of one LCD pixel, in CSS pixels
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
  COLS: COLS,
  ROWS: ROWS,
  PIXEL_ASPECT: PIXEL_ASPECT,
  cols: cols,
  pixelSize: pixelSize,
  gapPositions: gapPositions,
  watch: watch,
  fit: fit,
  drawPixels: drawPixels,
  drawText: drawText,
  textWidth: textWidth,
  ink: ink,
  inkCanvas: inkCanvas,
};

export default lcd;
