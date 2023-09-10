import keys from "./keys";

export type Key = typeof keys;

export type EventType = keyof CallbackMap;

type KeyCallback = (key: Key) => void;

interface CallbackMap {
  keyclick: KeyCallback;
  numclick: KeyCallback;
}

interface BridgeMessage {
  type: EventType;
  data: any;
}

function messageReceiver(eventType?: EventType, callback?: CallbackMap[EventType]) {
  return (event: MessageEvent) => {
    if (!/^https?:\/\/(localhost|brick1100)/.test(event.origin)) {
      return;
    }

    if (!eventType) {
      throw new Error("Missing eventType");
    }

    callback && callback((event.data as BridgeMessage).data);
  };
}

const bridge = {
  /**
   * Subscribe to a message event.
   */
  on: function <E extends EventType>(event: E, callback: CallbackMap[E]) {
    window.addEventListener("message", messageReceiver(event, callback));
  },

  /**
   * Unsubscribe from a message event.
   */
  off: function () {
    window.removeEventListener("message", messageReceiver());
  },

  /**
   * Send a message to the target window.
   */
  send: function (target: Window, message: BridgeMessage) {
    target.postMessage(message, "*");
  },
};

export default bridge;
