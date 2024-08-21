# Bridge 1100

[![NPM Version](https://img.shields.io/npm/v/bridge-1100?logo=npm)](http://npm.im/bridge-1100)
[![NPM Downloads](https://img.shields.io/npm/dm/bridge-1100?logo=npm)](http://npm.im/bridge-1100)
[![Discord](https://img.shields.io/discord/1153955094337957908?logo=discord)](https://discord.com/invite/6AQDnZa4Xm)

A simplified and type-safe interface to easily bridge between Brick 100 and external games/apps.

## How it works

![How it works](./docs/bridge-1100%20visual.svg)

The interface allows you to [send](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) and [receive](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/message_event) messages in form of events between the Brick 1100 and your app.

From Brick 1100's perspective, the interface allows it to emit operational events to your app such as key presses, start trigger, etc. and listen to any event emitted from your app.

From your app's perspective, the interface allows you to listen to the operational events from Brick 1100 to control your game/app and send back events to notify Brick 1100 of any changes in your game/app state.

## Installation

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

## Usage

```js
import bridge from 'bridge-1100';

bridge.on('keypress', (key) => {
  console.log(key)
});

bridge.off('keypress');

bridge.send(window.parent, {
  event: 'stop',
  data: { /* data sent back to Brick 1100 */ },
});
```

## Styling

The interface also packs a default stylesheet that can be used to style your app. Simply add the below line in your HTML file's `<head>` tag.

```html
<head>
  ...
  <link rel="stylesheet" href="https://unpkg.com/bridge-1100/dist/index.css" />
  <link rel="stylesheet" href="https://unpkg.com/bridge-1100/dist/font.css" /> <!-- If you wish to use the same font as Brick 1100 -->
</head>
```

## API

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
bridge.send(target: Window, eventData: BridgeEventData) => void;
```

Send an event to the target window.

__`target`__

- Type: [Window](https://developer.mozilla.org/en-US/docs/Web/API/Window)
- Description: The target window to send the event to. In most cases, this will be `window.parent`.

__`eventData`__

- Type: [BridgeEventData](#bridgeeventdata)
- Description: The event data to send.

## Types

### `BridgeEvent`

Available events: `"keypress" | "keyrelease" | "keyhold" | "numpress" | "numrelease" | "numhold" | "shake" | "start" | "pause" | "stop"`

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

The callback handler when a gameloop event is received. Available for the `start`, `pause`, and `stop` events.

### `BridgeEventData`

```ts
{ event: BridgeEvent; data: any; }
```

### `ShakeIntensity`

Available options: `"LIGHT" | "MEDIUM" | "HEAVY"`

## Enums

### `Key`

Member | Value |
--- | --- |
`Power` | `"power"`
`Ok` | `"ok"`
`Clear` | `"clear"`
`Up` | `"up"`
`Down` | `"down"`
`Zero` | `0`
`One` | `1`
`Two` | `2`
`Three` | `3`
`Four` | `4`
`Five` | `5`
`Six` | `6`
`Seven` | `7`
`Eight` | `8`
`Nine` | `9`
`Aste` | `"*"`
`Hash` | `"#"`

## See also

- [Brick 1100 apps](https://github.com/Visnalize/brick-1100-apps)
