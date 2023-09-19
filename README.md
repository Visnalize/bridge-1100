# Bridge 1100

[![npm](https://img.shields.io/npm/v/bridge-1100)](http://npm.im/bridge-1100)

A simplified and type-safe interface to easily bridge between Brick 100 and external games/apps.

## How it works

![How it works](./docs/bridge-1100%20visual.svg)

The interface allows you to [send](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) and [receive](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/message_event) messages in form of events between the Brick 1100 and your app.

From Brick 1100's perspective, the interface allows it to operational events to your app such as key presses, start trigger, etc. and listen to any event emitted from your app.

From your app's perspective, the interface allows you to listen to the operational events from Brick 1100 to control your game/app and send back events to notify Brick 1100 of any changes in your game/app.

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

bridge.send(iframe.contentWindow, {
  type: 'keypress',
  key: 5,
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

🚧 Under construction 🚧

## See also

- [Brick 1100 apps](https://github.com/Visnalize/brick-1100-apps)
