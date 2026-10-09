import { describe, expect, it } from "vitest";
import * as icons from "./icons";

describe("icons", () => {
  it("draws a progress bar of four frames at any width, framed by a one-pixel border", () => {
    var frames = icons.progressBar(20);
    expect(frames).toHaveLength(4);
    frames.forEach(function (rows) {
      expect(rows).toHaveLength(10);
      rows.forEach(function (row) {
        expect(row).toHaveLength(20);
        expect(row[0] + row[19]).toBe("##");
      });
      expect(rows[0]).toBe("#".repeat(20));
      expect(rows[9]).toBe("#".repeat(20));
    });
  });

  it("makes a path of one rectangle per run of lit pixels", () => {
    expect(icons.toPath(["##.#", ".##."])).toBe("M0 0h2v1h-2zM3 0h1v1h-1zM1 1h2v1h-2z");
  });

  // Sized in LCD pixels, which are taller than wide, the art must stretch rather than keep its shape
  it("draws art that stretches to the box it is given", () => {
    var svg = icons.svg(icons.check);
    expect(svg).toContain('viewBox="0 0 16 16"');
    expect(svg).toContain('preserveAspectRatio="none"');
  });
});
