import { Key } from "./keys";
import viewport from "./viewport";

export type BridgeEvent = keyof BridgeEventMap;

export type ShakeIntensity = "LIGHT" | "MEDIUM" | "HEAVY";

type KeyCallback = (key: Key) => void;

type ShakeCallback = (intensity: ShakeIntensity) => void;

type GameloopCallback = (...args: any[]) => void;

type LoadAudioCallback = (audioUrls: string[]) => void;

type PlayAudioCallback = (audioId: string) => void;

type KeyEvent = "keypress" | "keyrelease" | "keyhold" | "numpress" | "numrelease" | "numhold";

type GameLoopEvent = "start" | "pause" | "stop";

interface BridgeEventMap {
  keypress: KeyCallback;
  numpress: KeyCallback;
  keyhold: KeyCallback;
  numhold: KeyCallback;
  keyrelease: KeyCallback;
  numrelease: KeyCallback;
  shake: ShakeCallback;
  start: GameloopCallback;
  pause: GameloopCallback;
  stop: GameloopCallback;
  loadAudio: LoadAudioCallback;
  playAudio: PlayAudioCallback;
}

var callbackMap: Partial<Record<BridgeEvent, BridgeEventMap[BridgeEvent]>> = {};

function messageReceiver(event: BridgeEvent) {
  return (messageEvent: MessageEvent<{ event: BridgeEvent; data: any }>) => {
    if (!/^(https?|capacitor):\/\/.*(localhost|brick1100|lhr.life|netlify)/.test(messageEvent.origin)) {
      throw new Error("Unauthorized origin: " + messageEvent.origin);
    }

    if (!event) {
      throw new Error("Missing eventType");
    }

    var message = messageEvent.data;
    var callback = callbackMap[event];
    if (message.event == event && callback) {
      callback!(message.data);
    }
  };
}

interface Bridge {
  viewport: typeof viewport;

  on(event: KeyEvent, callback: KeyCallback): void;
  on(event: GameLoopEvent, callback: GameloopCallback): void;
  on(event: "shake", callback: ShakeCallback): void;
  on(event: "loadAudio", callback: LoadAudioCallback): void;
  on(event: "playAudio", callback: PlayAudioCallback): void;

  off(event: BridgeEvent): void;

  send(target: Window, eventData: { event: KeyEvent; data: string | number }): void;
  send(target: Window, eventData: { event: GameLoopEvent; data: any }): void;
  send(target: Window, eventData: { event: "shake"; data: ShakeIntensity }): void;
  send(target: Window, eventData: { event: "loadAudio"; data: string[] }): void;
  send(target: Window, eventData: { event: "playAudio"; data: string }): void;
}

var bridge: Bridge = {
  viewport,

  on: function (event, callback) {
    callbackMap[event] = callback;
    window.addEventListener("message", messageReceiver(event));
  },

  off: function (event) {
    delete callbackMap[event];
    window.removeEventListener("message", messageReceiver(event));
  },

  send: function (target, eventData) {
    target.postMessage(eventData, "*");
  },
};

export default bridge;
