import { Key } from "./keys";

export type BridgeEvent = keyof BridgeEventMap;

type KeyCallback = (key: Key) => void;

interface BridgeEventMap {
  keyclick: KeyCallback;
  numclick: KeyCallback;
}

interface BridgeMessage {
  type: BridgeEvent;
  data: any;
}

const callbackMap: Partial<Record<BridgeEvent, BridgeEventMap[BridgeEvent]>> = {};

function messageReceiver(eventName: BridgeEvent) {
  return (messageEvent: MessageEvent) => {
    if (!/^https?:\/\/(localhost|brick1100)/.test(messageEvent.origin)) {
      return;
    }

    if (!eventName) {
      throw new Error("Missing eventType");
    }

    const message = messageEvent.data as BridgeMessage;
    if (message.type == eventName && callbackMap[eventName]) {
      const callback = callbackMap[eventName] as KeyCallback;
      callback(message.data);
    }
  };
}

const bridge = {
  /**
   * Subscribe to a message event.
   */
  on: function <E extends BridgeEvent>(event: E, callback: BridgeEventMap[E]) {
    callbackMap[event] = callback;
    window.addEventListener("message", messageReceiver(event));
  },

  /**
   * Unsubscribe from a message event.
   */
  off: function (event: BridgeEvent) {
    delete callbackMap[event];
    window.removeEventListener("message", messageReceiver(event));
  },

  /**
   * Send a message to the target window.
   */
  send: function (target: Window, message: BridgeMessage) {
    target.postMessage(message, "*");
  },
};

export default bridge;
