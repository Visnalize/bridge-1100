import { Key } from "./keys";

export type BridgeEvent = keyof BridgeEventMap;

type KeyCallback = (key: Key) => void;

type GenericCallback = (...args: any[]) => void;

interface BridgeEventMap {
  keyclick: KeyCallback;
  numclick: KeyCallback;
  start: GenericCallback;
  pause: GenericCallback;
  stop: GenericCallback;
}

interface BridgeEventData {
  event: BridgeEvent;
  data: any;
}

const callbackMap: Partial<Record<BridgeEvent, BridgeEventMap[BridgeEvent]>> = {};

function messageReceiver(event: BridgeEvent) {
  return (messageEvent: MessageEvent<BridgeEventData>) => {
    if (!/^https?:\/\/(localhost|brick1100)/.test(messageEvent.origin)) {
      return;
    }

    if (!event) {
      throw new Error("Missing eventType");
    }

    const message = messageEvent.data;
    const callback = callbackMap[event];
    if (message.event == event && callback) {
      callback!(message.data);
    }
  };
}

const bridge = {
  /**
   * Subscribe to a message event.
   *
   * @param event The event to subscribe to.
   * @param callback The callback handler when the event is received.
   */
  on: function <E extends BridgeEvent>(event: E, callback: BridgeEventMap[E]) {
    callbackMap[event] = callback;
    window.addEventListener("message", messageReceiver(event));
  },

  /**
   * Unsubscribe from a message event.
   *
   * @param event The event to unsubscribe from.
   */
  off: function (event: BridgeEvent) {
    delete callbackMap[event];
    window.removeEventListener("message", messageReceiver(event));
  },

  /**
   * Send an event to the target window.
   *
   * @param target The target window to send the event to.
   * @param eventData The event data to send.
   */
  send: function (target: Window, eventData: BridgeEventData) {
    target.postMessage(eventData, "*");
  },
};

export default bridge;
