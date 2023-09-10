# Bridge 1100

A simplified and type-safe interface to easily bridge between Brick 100 and external games/apps.

## Installation

### unpkg

Simply add the below line in your HTML file's `<body>` tag.

```html
<body>
  ...
  <script src="https://unpkg.com/bridge-1100/dist/index.umd.js" crossorigin></script>
</body>
```

A `bridge` object will then be available in the global scope.

### npm

```sh
npm install bridge-1100

# or

yarn add bridge-1100
```

## Usage

```js
import bridge from 'bridge-1100';

bridge.on('keyclick', (key) => {
  console.log(key)
});

bridge.off();

bridge.send(iframe.contentWindow, {
  type: 'keyclick',
  key: 5,
});
```
