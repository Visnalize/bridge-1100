// The phone's own icons, as pixel art: from apps/phone/src/components/core/graphics/pixelIcons.js.
// Keep them in sync by copying. "#" is a lit pixel.

export type PixelGrid = string[];

export var check: PixelGrid = [
  "..............##",
  "............###.",
  "...........##...",
  "..........##....",
  ".........##.....",
  "........##......",
  ".......###......",
  "......###.......",
  "##....###.......",
  ".##..###........",
  "..##.###........",
  "..#####.........",
  "...####.........",
  "...####.........",
  "...###..........",
  "....##..........",
];

export var info: PixelGrid = [
  "......####......",
  "....##....##....",
  "...#........#...",
  "...#........#...",
  "...#........#...",
  "...#........#...",
  "....##....##....",
  "......####......",
  ".############...",
  ".#..........#...",
  ".#..........#...",
  ".#..........#...",
  ".###........#...",
  "...#........#...",
  "...#........#...",
  "...#........#...",
  "...#........#...",
  "####........####",
  "#..............#",
  "#..............#",
  "#..............#",
  "################",
];

export var stop: PixelGrid = [
  ".......#########.......",
  "......#.........#......",
  ".....#.#########.#.....",
  "....#.###########.#....",
  "...#.#############.#...",
  "..#.###############.#..",
  ".#.#################.#.",
  "#.###################.#",
  "#.###.......#.##..###.#",
  "#.##.####.##.#.#.#.##.#",
  "#.##.####.##.#.#.#.##.#",
  "#.###.###.##.#.#..###.#",
  "#.####.##.##.#.#.####.#",
  "#.####.##.##.#.#.####.#",
  "#.##..###.###.##.####.#",
  "#.###################.#",
  ".#.#################.#.",
  "..#.###############.#..",
  "...#.#############.#...",
  "....#.###########.#....",
  ".....#.#########.#.....",
  "......#.........#......",
  ".......#########.......",
];

/** Rows of the progress bar's frame and stripes, and the columns one stripe repeats over */
var PROGRESS_ROWS = 10;
var STRIPE_PERIOD = 8;
/** Columns the stripes move per frame; four frames make one period */
var STRIPE_STEP = 2;

/**
 * The animated progress bar at any width: a frame with diagonal stripes inside that move one step
 * per frame, so a screen can fill whatever width it has.
 *
 * @param cols The bar's width in pixels, frame included
 */
export function progressBar(cols: number): PixelGrid[] {
  var frames: PixelGrid[] = [];
  for (var frame = 0; frame < STRIPE_PERIOD / STRIPE_STEP; frame++) {
    var rows: string[] = [];
    for (var row = 0; row < PROGRESS_ROWS; row++) {
      var line = "";
      for (var col = 0; col < cols; col++) {
        var edge = row === 0 || row === PROGRESS_ROWS - 1 || col === 0 || col === cols - 1;
        var inside = row >= 2 && row <= PROGRESS_ROWS - 3 && col >= 2 && col <= cols - 3;
        var gap = (col - STRIPE_STEP * frame + row) % STRIPE_PERIOD === STRIPE_PERIOD / 2;
        line += edge || (inside && !gap) ? "#" : ".";
      }
      rows.push(line);
    }
    frames.push(rows);
  }
  return frames;
}

/** One SVG path for a grid: a rectangle per run of lit pixels in a row, in pixel units. */
export function toPath(rows: PixelGrid): string {
  var d = "";
  rows.forEach(function (row, y) {
    var re = /#+/g;
    var run: RegExpExecArray | null;
    while ((run = re.exec(row)))
      d += "M" + run.index + " " + y + "h" + run[0].length + "v1h-" + run[0].length + "z";
  });
  return d;
}

/**
 * An SVG of the art, stretched to fill whatever box it is given, so that sized in LCD pixels, one
 * pixel of art is one LCD pixel, 6 wide to 7 tall.
 */
export function svg(rows: PixelGrid): string {
  var cols = rows[0] ? rows[0].length : 0;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    cols +
    " " +
    rows.length +
    '" preserveAspectRatio="none" shape-rendering="crispEdges"><path d="' +
    toPath(rows) +
    '"/></svg>'
  );
}
