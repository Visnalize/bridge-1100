import { Key } from "./keys";
import viewport from "./viewport";

export type BridgeEvent = keyof BridgeEventMap;

export type ShakeIntensity = "LIGHT" | "MEDIUM" | "HEAVY";

type InitCallback = (data: { "vw-ratio": number; color: any }) => void;

type ScreenStateCallback = (data: { state: "active" | "inactive"; isNight: boolean }) => void;

type KeyCallback = (key: Key) => void;

type ShakeCallback = (intensity: ShakeIntensity) => void;

type GameloopCallback = (...args: any[]) => void;

type LoadAudioCallback = (audioUrls: string[]) => void;

type PlayAudioCallback = (audioId: string) => void;

type KeyEvent = "keypress" | "keyrelease" | "keyhold" | "numpress" | "numrelease" | "numhold";

// progress marks a milestone inside a running game, such as a level passed, for the app to save
type GameLoopEvent = "start" | "pause" | "stop" | "progress";

interface BridgeEventMap {
  _init: InitCallback;
  _screenstate: ScreenStateCallback;
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
  progress: GameloopCallback;
  loadAudio: LoadAudioCallback;
  playAudio: PlayAudioCallback;
}

var callbackMap: Partial<Record<BridgeEvent, BridgeEventMap[BridgeEvent]>> = {};
var receiverMap: Partial<Record<BridgeEvent, (messageEvent: MessageEvent) => void>> = {};

function messageReceiver(event: BridgeEvent) {
  return (messageEvent: MessageEvent<{ event: BridgeEvent; data: any }>) => {
    if (
      !/^(https?|capacitor):\/\/.*(localhost|brick1100|lhr.life|netlify)/.test(messageEvent.origin)
    ) {
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
  viewport: typeof viewport; // DEPRECATED: to be removed in the next patch

  on(event: "_init", callback: InitCallback): void;
  on(event: "_screenstate", callback: ScreenStateCallback): void;
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
    receiverMap[event] = messageReceiver(event);
    window.addEventListener("message", receiverMap[event]);
  },

  off: function (event) {
    delete callbackMap[event];
    window.removeEventListener("message", receiverMap[event]!);
    delete receiverMap[event];
  },

  send: function (target, eventData) {
    target.postMessage(eventData, "*");
  },
};

(function init() {
  if (!window || typeof window === "undefined") {
    throw new Error("window is not defined");
  }

  bridge.on("_init", function (data) {
    var color = data.color;
    var style = document.createElement("style");
    style.textContent = `
      :root {
        --vw-ratio: ${data["vw-ratio"]};
        --foreground: ${color.root.fg};
        --background: ${color.root.bg};
      }
      /* All input comes from the phone's keys, so a long press must not select anything in it. */
      body {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      .inactive {
        --foreground: ${color.inactive.fg};
      }
      .night {
        --foreground: ${color.night.fg};
      }
      .night.inactive {
        --foreground: ${color.night.inactive.fg};
      }`;
    document.head.appendChild(style);
  });

  bridge.on("_screenstate", function (data) {
    document.body.classList.toggle("inactive", data.state === "inactive");
    document.body.classList.toggle("night", data.isNight);
  });
})();

export default bridge;
