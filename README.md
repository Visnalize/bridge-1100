# Bridge 1100

[![NPM Version](https://img.shields.io/npm/v/bridge-1100?logo=npm)](http://npm.im/bridge-1100)
[![NPM Downloads](https://img.shields.io/npm/dm/bridge-1100?logo=npm)](http://npm.im/bridge-1100)
[![Discord](https://img.shields.io/discord/1153955094337957908?logo=discord)](https://discord.com/invite/6AQDnZa4Xm)

A simplified and type-safe interface to easily bridge between [Brick 100](https://brick1100.app) and external games/apps.

## 🔁 How it works

![How it works](./docs/bridge-1100%20visual.svg)

The interface allows you to [send](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) and [receive](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/message_event) messages in form of events between the Brick 1100 and your app.

From Brick 1100's perspective, the interface allows it to emit operational events to your app such as key presses, start trigger, etc. and listen to any event emitted from your app.

From your app's perspective, the interface allows you to listen to the operational events from Brick 1100 to control your game/app and send back events to notify Brick 1100 of any changes in your game/app state.

## 📦 Installation

### CDN

Simply add the below line in your HTML file's `<body>` tag.

```html
<body>
  ...
  <script src="https://unpkg.com/bridge-1100/dist/index.umd.js"></script>
</body>
```

A `window.bridge` object will then be available to use.

### npm

```sh
npm install bridge-1100

# or

yarn add bridge-1100
```

## ✅ Usage

```js
import bridge from 'bridge-1100';

bridge.on('keypress', (key) => {
  console.log(key)
});

bridge.off('keypress');

bridge.send(window.parent, { event: 'stop', data: { score: 1000, level: 1 } });
```

See more examples in the [Examples](#examples) section below.

## 💅 Styling

The interface also packs a default stylesheet that can be used to style your app. Simply add the below line in your HTML file's `<head>` tag.

```html
<head>
  ...
  <link rel="stylesheet" href="https://unpkg.com/bridge-1100/dist/index.css" />
  <link rel="stylesheet" href="https://unpkg.com/bridge-1100/dist/font.css" />
</head>
```

### Fonts

`font.css` registers the bitmap fonts of the Nokia 1100 firmware itself, named after the sizes it exposes.
By default, the stylesheet applies `BrickTiny` to `<header>`, `BrickMedium` to `<body>` and `BrickSmallBold` to `<footer>`. Reach for other fonts where appropriate to make your app's text match the phone's native UI.

Family | Firmware font | Em height |
--- | --- | --- |
`BrickTiny` | tiny/plain | 8px |
`BrickTinyBold` | tiny/bold | 8px |
`BrickSmall` | small/plain | 9px |
`BrickSmallBold` | small/bold | 9px |
`BrickMedium` | medium/bold | 11px |
`BrickLarge` | large/bold | 13px |

## 🧱 Screens

`bridge.ui` opens screens that look and behave like the phone's own: a title between two lines, a
list with a highlighted row and a scroll bar, text paged three lines at a time, a result with the
phone's icons, a number field, a loading bar. Use them so your app feels like part of the phone,
and so you do not have to write their key handling yourself.

Add `ui.css` next to the other two stylesheets:

```html
<link rel="stylesheet" href="https://unpkg.com/bridge-1100/dist/index.css" />
<link rel="stylesheet" href="https://unpkg.com/bridge-1100/dist/font.css" />
<link rel="stylesheet" href="https://unpkg.com/bridge-1100/dist/ui.css" />
```

```js
var ui = window.bridge.ui;

var menu = ui.list({
  title: "Sudoku",
  items: ["New game", "Level", "Instructions"],
  onSelect: function (index) {
    if (index === 0) {
      menu.close(); // your game shows again
      startGame();
    }
    if (index === 2) {
      ui.text({ title: "Instructions", text: "Fill every row..." }); // opens on top of the menu
    }
  },
  onBack: function () {
    bridge.send(window.parent, { event: "stop" });
  },
});
```

How screens work:

- **They stack.** Each call opens a screen on top of the others and returns it. `screen.close()`
  removes it and shows the one below.
- **The top screen takes every key.** While a screen is open, your own `keypress` and `numpress`
  callbacks are not called, not even for the key that closes the last screen. They are called
  again once every screen is closed.
- **Your page is hidden** while a screen is open, and shown again when the last one closes.
- **Clear goes back.** Every screen closes on Clear unless you pass `onBack`.
- Callbacks (except `onClose`) get the screen as their last argument, so `onBack: function (screen) { screen.close() }`
  works without keeping a variable.

### `ui.list(options)`

Option | Type | Default | |
--- | --- | --- | ---
`items` | `string[]` | | The rows. Three fit on the screen; more scroll. A selected row too long for the screen scrolls its text, as on the phone.
`title` | `string` | | Shown in the header. No header without it.
`index` | `number` | `0` | The row selected when the list opens.
`action` | `string` | `"Select"` | The footer label.
`onSelect` | `(index, screen) => void` | | On OK.
`onChange` | `(index, screen) => void` | | When the selected row changes.
`onBack` | `(screen) => void` | closes | On Clear.

### `ui.text(options)`

Long text, paged three lines at a time. Up and down turn pages; OK turns the page, and on the last
page calls `onDone`.

Option | Type | Default
--- | --- | ---
`text` | `string` |
`title` | `string` |
`action` | `string` | `"OK"`
`onDone` | `(screen) => void` | closes
`onBack` | `(screen) => void` | closes

### `ui.confirm(options)`

A question in large text, answered with OK or Clear.

Option | Type | Default
--- | --- | ---
`text` | `string` |
`info` | `string` | A short note at the bottom end, such as a count
`action` | `string` | `"OK"`
`onDone` | `(screen) => void` | closes
`onBack` | `(screen) => void` | closes

### `ui.result(options)`

A short message that closes by itself, or sooner on any key.

Option | Type | Default
--- | --- | ---
`message` | `string` |
`type` | `"done" \| "fail" \| "info"` | no icon
`timeout` | `number` (ms) | `1500`
`onClose` | `() => void` |

### `ui.number(options)`

A number field. Number keys type, Clear deletes the last digit and goes back once the field is
empty, OK gives the value as a string.

Option | Type | Default
--- | --- | ---
`title` | `string` |
`value` | `string` | `""`
`maxLength` | `number` | no limit; the header counts down when set
`action` | `string` | `"OK"`
`onDone` | `(value, screen) => void` | closes
`onBack` | `(screen) => void` | closes

### `ui.loading(options?)`

The phone's loading bar with a message (`"Loading"` by default). It takes no keys: close it with
the returned `screen.close()`.

### `ui.closeAll()` and `ui.isOpen()`

Close every screen, or check whether any is open.

## 🔌 API

### `on(...)`

```ts
bridge.on(event: BridgeEvent, callback: KeyCallback | ShakeCallback | GameloopCallback) => void;
```

Subscribe to a message event.

__`event`__

- Type: [BridgeEvent](#bridgeevent)
- Description: The event to subscribe to.

__`callback`__

- Type: [KeyCallback](#keycallback) | [ShakeCallback](#shakecallback) | [GameloopCallback](#gameloopcallback)
- Description: The callback handler when the event is received.

### `off(...)`

```ts
bridge.off(event: BridgeEvent) => void;
```

Unsubscribe from a message event.

__`event`__

- Type: [BridgeEvent](#bridgeevent)
- Description: The event to unsubscribe from.

### `send(...)`

```ts
bridge.send(target: Window, eventData: { event: BridgeEvent, data: any }) => void;
```

Send an event to the target window.

__`target`__

- Type: [Window](https://developer.mozilla.org/en-US/docs/Web/API/Window)
- Description: The target window to send the event to. In most cases, this will be `window.parent`.

__`eventData`__

- Type: `{ event: BridgeEvent, data: any }`
- Description: The event data to send. The data type depends on the event, see [Examples](#examples) for more details.

## Types

### `BridgeEvent`

Available events: `"keypress" | "keyrelease" | "keyhold" | "numpress" | "numrelease" | "numhold" | "shake" | "start" | "pause" | "stop" | "progress"`

### `KeyCallback`

```ts
(key: Key) => void;
```

The callback handler when a key event is received. Available for `keypress`, `keyrelease`, `keyhold`, `numpress`, `numrelease`, and `numhold` events. See [Key](#key) for available keys.

### `ShakeCallback`

```ts
(intensity: ShakeIntensity) => void
```

The callback handler when a shake event is received. Available for the `shake` event. See [ShakeIntensity](#shakeintensity) for available intensity options.

### `GameloopCallback`

```ts
(...args: any[]) => void
```

The callback handler when a gameloop event is received. Available for the `start`, `pause`, `stop`, and `progress` events. A game sends `progress` to mark a milestone inside a run, such as a level passed, so the app can save it before the run ends.

### `ShakeIntensity`

Available options: `"LIGHT" | "MEDIUM" | "HEAVY"`

## Enums

### `Key`

Member | Value |
--- | --- |
`Power` | `"power"` |
`Ok` | `"ok"` |
`Clear` | `"clear"` |
`Up` | `"up"` |
`Down` | `"down"` |
`Zero` | `0` |
`One` | `1` |
`Two` | `2` |
`Three` | `3` |
`Four` | `4` |
`Five` | `5` |
`Six` | `6` |
`Seven` | `7` |
`Eight` | `8` |
`Nine` | `9` |
`Aste` | `"*"` |
`Hash` | `"#"` |

## Examples

In most cases, you will be using the [`on`](#on) method to subscribe and the [`send`](#send) method to send certain events to interact with [Brick 1100](https://brick1100.app). Following are some examples of how you can use the API.

```js
bridge.on("keypress", (key) => {
  if (key === bridge.Key.Clear) {
    // Handle "clear" key press event
  }
  if (key === bridge.Key.Up || key === bridge.Key.Down) {
    // Handle "up" or "down" key press event
  }
  if (key === bridge.Key.Ok) {
    // Handle "ok" key press event
  }
});

bridge.on("numpress", (key) => {
  if (key === 2) {
    // Handle "2" key press event
  }
  if (key === 4) {
    // Handle "4" key press event
  }
  if (key === 6) {
    // Handle "6" key press event
  }
  if (key === 8) {
    // Handle "8" key press event
  }
});

bridge.on("start", (gameConfig) => {
  // Handle game start event with game configuration
});

bridge.send(window.parent, { event: "stop", data: gameResults });

bridge.send(window.parent, { event: "shake", data: "LIGHT" });

bridge.send(window.parent, {
  event: "loadAudio",
  data: [
    "https://example.com/hit.mp3",
    "https://example.com/bounce.mp3"
  ],
});

bridge.send(window.parent, { event: "playAudio", data: "bounce" })
```

## See also

- [Complete guide on how to build games/apps for Brick 1100](https://visnalize.com/brick1100/builders)
- [Brick 1100 Apps](https://github.com/Visnalize/brick-1100-apps)
- [Brick 1100 Games](https://github.com/Visnalize/brick-1100-games)
