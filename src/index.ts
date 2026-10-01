import bridge, { BridgeEvent } from "./bridge";
import { Key } from "./keys";
import ui from "./ui";

var api = bridge as typeof bridge & { ui: typeof ui };
api.ui = ui;

export default api;
export type { BridgeEvent, Key };
export type {
  ConfirmOptions,
  ListOptions,
  LoadingOptions,
  NumberOptions,
  ResultOptions,
  Screen,
  TextOptions,
} from "./ui";
