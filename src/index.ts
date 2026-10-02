import bridge, { BridgeEvent } from "./bridge";
import { Key } from "./keys";
import lcd from "./lcd";
import ui from "./ui";

var api = bridge as typeof bridge & { ui: typeof ui; lcd: typeof lcd };
api.ui = ui;
api.lcd = lcd;

export default api;
export type { BridgeEvent, Key };
export type { PixelContext } from "./lcd";
export type {
  ConfirmOptions,
  ListOptions,
  LoadingOptions,
  NumberOptions,
  ResultOptions,
  Screen,
  TextOptions,
} from "./ui";
