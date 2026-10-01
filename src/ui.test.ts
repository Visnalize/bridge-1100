// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bridge from "./index";

var ui = bridge.ui;

function press(key: string | number, event = typeof key === "number" ? "numpress" : "keypress") {
  window.dispatchEvent(new MessageEvent("message", { origin: "http://localhost", data: { event, data: key } }));
}

function visibleScreen() {
  return document.querySelector<HTMLElement>(".b-screen:not([hidden])");
}

describe("ui", () => {
  afterEach(() => {
    ui.closeAll();
    bridge.off("keypress");
    bridge.off("numpress");
    vi.useRealTimers();
  });

  describe("list", () => {
    it("shows the title, the items and the action", () => {
      ui.list({ title: "Sudoku", items: ["New game", "Level"], action: "Pick" });

      var screen = visibleScreen()!;
      expect(screen.querySelector(".b-header")!.textContent).toBe("Sudoku");
      expect(screen.querySelectorAll("li")).toHaveLength(2);
      expect(screen.querySelector("footer")!.textContent).toBe("Pick");
      expect(document.documentElement.classList.contains("b-ui-open")).toBe(true);
    });

    it("moves the highlight with up and down, wrapping at both ends", () => {
      var onChange = vi.fn();
      ui.list({ items: ["A", "B", "C"], onChange });
      var active = () => document.querySelector(".b-active")!.textContent;

      expect(active()).toBe("A");
      press("up");
      expect(active()).toBe("C");
      press("down");
      expect(active()).toBe("A");
      expect(onChange.mock.calls.map((call) => call[0])).toEqual([2, 0]);
    });

    it("starts on the given index", () => {
      ui.list({ items: ["A", "B", "C"], index: 1 });

      expect(document.querySelector(".b-active")!.textContent).toBe("B");
    });

    it("reports the selected row on OK", () => {
      var onSelect = vi.fn();
      ui.list({ items: ["A", "B"], onSelect });

      press("down");
      press("ok");

      expect(onSelect).toHaveBeenCalledWith(1, expect.anything());
    });

    it("closes on Clear when no onBack is given", () => {
      ui.list({ items: ["A"] });

      press("clear");

      expect(ui.isOpen()).toBe(false);
      expect(document.documentElement.classList.contains("b-ui-open")).toBe(false);
    });
  });

  describe("keys", () => {
    var appKeys: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      appKeys = vi.fn();
      bridge.on("keypress", appKeys);
      bridge.on("numpress", appKeys);
    });

    it("go to the app when no screen is open", () => {
      press("ok");
      press(5);

      expect(appKeys.mock.calls).toEqual([["ok"], [5]]);
    });

    it("do not reach the app while a screen is open", () => {
      ui.list({ items: ["A", "B"] });

      press("down");
      press(5);

      expect(appKeys).not.toHaveBeenCalled();
    });

    it("do not reach the app when they close the last screen", () => {
      ui.list({ items: ["A"] });

      press("clear");
      expect(appKeys).not.toHaveBeenCalled();

      press("clear");
      expect(appKeys).toHaveBeenCalledWith("clear");
    });

    it("go to the top screen only", () => {
      var below = vi.fn();
      ui.list({ items: ["A", "B"], onSelect: below });
      ui.confirm({ text: "Sure?" });

      press("ok");
      expect(below).not.toHaveBeenCalled();

      press("ok");
      expect(below).toHaveBeenCalled();
    });
  });

  describe("stack", () => {
    it("shows the screen below when the top one closes", () => {
      ui.list({ title: "Main", items: ["A"] });
      var top = ui.list({ title: "Level", items: ["Easy"] });

      expect(visibleScreen()!.querySelector(".b-header")!.textContent).toBe("Level");
      expect(document.querySelectorAll(".b-screen")).toHaveLength(2);

      top.close();

      expect(visibleScreen()!.querySelector(".b-header")!.textContent).toBe("Main");
    });

    it("closes every screen with closeAll", () => {
      ui.list({ items: ["A"] });
      ui.loading();

      ui.closeAll();

      expect(ui.isOpen()).toBe(false);
      expect(document.querySelectorAll(".b-screen")).toHaveLength(0);
    });
  });

  describe("number", () => {
    it("types digits up to the maximum length and counts what is left", () => {
      ui.number({ title: "Height (cm)", maxLength: 3 });

      [1, 7, 5, 9].forEach((key) => press(key));

      expect(document.querySelector(".b-digits")!.textContent).toBe("175");
      expect(document.querySelector(".b-count")!.textContent).toBe("0");
    });

    it("ignores * and #", () => {
      ui.number({ title: "Length" });

      press("*");
      press("#");

      expect(document.querySelector(".b-digits")!.textContent).toBe("");
    });

    it("deletes a digit on Clear, then goes back once empty", () => {
      var onBack = vi.fn();
      ui.number({ title: "Length", value: "1", onBack });

      press("clear");
      expect(onBack).not.toHaveBeenCalled();
      expect(document.querySelector(".b-digits")!.textContent).toBe("");

      press("clear");
      expect(onBack).toHaveBeenCalled();
    });

    it("gives the value on OK", () => {
      var onDone = vi.fn();
      ui.number({ title: "Length", onDone });

      press(1);
      press(2);
      press("ok");

      expect(onDone).toHaveBeenCalledWith("12", expect.anything());
    });
  });

  describe("result", () => {
    it("closes by itself after the timeout", () => {
      vi.useFakeTimers();
      var onClose = vi.fn();
      ui.result({ type: "done", message: "Saved", onClose });

      vi.advanceTimersByTime(1499);
      expect(onClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(ui.isOpen()).toBe(false);
    });

    it("closes on any key, and only once", () => {
      vi.useFakeTimers();
      var onClose = vi.fn();
      ui.result({ type: "fail", message: "Out of range", onClose });

      press(3);
      vi.advanceTimersByTime(2000);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("shows the icon of its type", () => {
      ui.result({ type: "info", message: "Note" });

      expect(document.querySelector(".b-info .b-icon img")).not.toBeNull();
    });
  });

  describe("confirm", () => {
    it("calls onDone on OK and onBack on Clear", () => {
      var onDone = vi.fn();
      var onBack = vi.fn();
      ui.confirm({ text: "Restart?", onDone, onBack });

      press("ok");
      press("clear");

      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("text", () => {
    it("closes on OK on its last page when no onDone is given", () => {
      ui.text({ title: "Help", text: "Fill every row." });

      press("ok");

      expect(ui.isOpen()).toBe(false);
    });
  });
});
