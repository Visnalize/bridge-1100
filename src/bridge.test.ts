import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import bridgeCore from "./bridge";

describe("bridge", () => {
  let mockTarget: Window;
  let bridge: typeof bridgeCore;

  beforeEach(async () => {
    mockTarget = { postMessage: vi.fn() } as unknown as Window;
    global.window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;
    bridge = (await import("./bridge")).default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMessageEvent = (origin = "http://localhost", event = "keypress", data: any = "ok") =>
    new MessageEvent("message", { origin, data: { event, data } });

  const triggerEvent = (messageEvent: MessageEvent) => {
    const callback = (global.window.addEventListener as Mock).mock.calls[0][1];
    callback(messageEvent);
  };

  it("should register an event listener with on()", () => {
    const mockCallback = vi.fn();
    bridge.on("keypress", mockCallback);

    expect(global.window.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should unregister an event listener with off()", () => {
    const mockCallback = vi.fn();
    bridge.on("keypress", mockCallback);
    bridge.off("keypress");

    expect(global.window.removeEventListener).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it('should call the callback with event: "keypress"', () => {
    const mockCallback = vi.fn();
    bridge.on("keypress", mockCallback);

    const messageEvent = createMessageEvent();
    triggerEvent(messageEvent);

    expect(mockCallback).toHaveBeenCalledWith("ok");
  });

  it('should call the callback with event: "shake"', () => {
    const mockCallback = vi.fn();
    bridge.on("shake", mockCallback);

    const messageEvent = createMessageEvent(undefined, "shake", "LIGHT");
    triggerEvent(messageEvent);

    expect(mockCallback).toHaveBeenCalledWith("LIGHT");
  });

  it('should call the callback with event: "stop"', () => {
    const mockCallback = vi.fn();
    bridge.on("stop", mockCallback);

    const stopData = { score: 1000, level: 10 };
    const messageEvent = createMessageEvent(undefined, "stop", stopData);
    triggerEvent(messageEvent);

    expect(mockCallback).toHaveBeenCalledWith(stopData);
  });

  it("should not call the callback if the event type does not match", () => {
    const mockCallback = vi.fn();
    bridge.on("keypress", mockCallback);

    const messageEvent = createMessageEvent(undefined, "keyrelease", "ok");
    triggerEvent(messageEvent);

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it("should call the callback for an authorized origin: netlify", () => {
    const mockCallback = vi.fn();
    bridge.on("keypress", mockCallback);

    const messageEvent = createMessageEvent(
      "https://deploy-preview-1--brick1100-games.netlify.app/"
    );
    triggerEvent(messageEvent);

    expect(mockCallback).toHaveBeenCalledWith("ok");
  });

  it("should call the callback for an authorized origin: lhr.life", () => {
    const mockCallback = vi.fn();
    bridge.on("keypress", mockCallback);

    const messageEvent = createMessageEvent("https://1b3d6c557fb368.lhr.life");
    triggerEvent(messageEvent);

    expect(mockCallback).toHaveBeenCalledWith("ok");
  });

  it("should throw an error for unauthorized origins", () => {
    const mockCallback = vi.fn();
    bridge.on("keypress", mockCallback);

    const messageEvent = createMessageEvent("http://unauthorized.com");

    expect(() => triggerEvent(messageEvent)).toThrow(
      "Unauthorized origin: http://unauthorized.com"
    );
  });

  it("should send a message to the target window", () => {
    const eventData = { event: "keypress" as any, data: "ok" };
    bridge.send(mockTarget, eventData);

    expect(mockTarget.postMessage).toHaveBeenCalledWith(eventData, "*");
  });
});
