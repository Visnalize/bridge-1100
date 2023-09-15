# Bridge 1100

[![npm](https://img.shields.io/npm/v/bridge-1100)](http://npm.im/bridge-1100)

A simplified and type-safe interface to easily bridge between Brick 100 and external games/apps.

## Installation

### unpkg

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

## API

🚧 Under construction 🚧
