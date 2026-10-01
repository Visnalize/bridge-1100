import { setKeyHandler } from "./bridge";
import * as icons from "./icons";

// Screens that look and behave like the phone's own: a header between two lines, a list with a
// highlighted row, a soft-key label in the footer. Screens stack: the top one takes every key while
// it is open, and closing it shows the one below. They need index.css, font.css and ui.css.

type KeyValue = string | number;

export interface Screen {
  /** Removes the screen. The screen below it, if any, takes the keys again. */
  close(): void;
}

export interface ListOptions {
  title?: string;
  items: string[];
  /** The row selected when the list opens. */
  index?: number;
  /** The footer label. */
  action?: string;
  onSelect?(index: number, screen: Screen): void;
  onChange?(index: number, screen: Screen): void;
  /** Called on Clear. Closes the list when not given. */
  onBack?(screen: Screen): void;
}

export interface TextOptions {
  title?: string;
  text: string;
  action?: string;
  /** Called on OK on the last page. Closes the screen when not given. */
  onDone?(screen: Screen): void;
  onBack?(screen: Screen): void;
}

export interface ConfirmOptions {
  text: string;
  /** A short note under the text, such as a count. */
  info?: string;
  action?: string;
  onDone?(screen: Screen): void;
  onBack?(screen: Screen): void;
}

export interface ResultOptions {
  type?: "done" | "fail" | "info";
  message: string;
  /** Milliseconds before it closes by itself. Any key closes it sooner. */
  timeout?: number;
  onClose?(): void;
}

export interface NumberOptions {
  title: string;
  value?: string;
  maxLength?: number;
  action?: string;
  onDone?(value: string, screen: Screen): void;
  /** Called on Clear when the field is empty. Closes the screen when not given. */
  onBack?(screen: Screen): void;
}

export interface LoadingOptions {
  message?: string;
}

interface Entry {
  el: HTMLElement;
  onKey(key: KeyValue): void;
  /** Runs each time the screen becomes the visible one, when its size can be measured. */
  onShow?(): void;
  onClose?(): void;
}

var LINES = 3;
var OPEN_CLASS = "b-ui-open";

var stack: Entry[] = [];
var root: HTMLElement | null = null;

function h(tag: string, className?: string, text?: string) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function icon(svg: string) {
  var img = document.createElement("img");
  img.src = "data:image/svg+xml," + encodeURIComponent(svg);
  img.alt = "";
  return img;
}

function header(title: string) {
  var el = h("header", "b-header");
  el.appendChild(h("span", "", title));
  return el;
}

function footer(action: string) {
  // A no-break space keeps the footer's height when it has no label, as the phone does.
  return h("footer", "b-footer", action || " ");
}

function screenEl(kind: string, title?: string) {
  var el = h("div", "b-screen b-" + kind);
  if (title) el.appendChild(header(title));
  return el;
}

function moveUp(index: number, length: number) {
  return index > 0 ? index - 1 : length - 1;
}

function moveDown(index: number, length: number) {
  return index < length - 1 ? index + 1 : 0;
}

function handleKey(event: string, key: KeyValue) {
  var top = stack[stack.length - 1];
  if (!top) return false;
  if (event === "keypress" || event === "numpress") top.onKey(key);
  // Every key event is the screen's while it is open, so the app below never sees a stray key.
  return true;
}

function show(entry: Entry) {
  entry.el.hidden = false;
  if (entry.onShow) entry.onShow();
}

function push(entry: Entry): Screen {
  if (!root) {
    root = h("div", "b-ui");
    document.body.appendChild(root);
    // The phone hides the frame while it loads, so a screen opened early measures a height of 0.
    // The frame gets a resize when it is shown, and the top screen then measures again.
    window.addEventListener("resize", function () {
      var top = stack[stack.length - 1];
      if (top && top.onShow) top.onShow();
    });
  }
  if (!stack.length) {
    setKeyHandler(handleKey);
    document.documentElement.classList.add(OPEN_CLASS);
  } else {
    stack[stack.length - 1].el.hidden = true;
  }
  stack.push(entry);
  root.appendChild(entry.el);
  show(entry);
  return {
    close: function () {
      remove(entry);
    },
  };
}

function remove(entry: Entry) {
  var index = stack.indexOf(entry);
  if (index === -1) return;
  var wasTop = index === stack.length - 1;
  stack.splice(index, 1);
  if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
  if (entry.onClose) entry.onClose();

  if (!stack.length) {
    setKeyHandler(null);
    document.documentElement.classList.remove(OPEN_CLASS);
  } else if (wasTop) {
    show(stack[stack.length - 1]);
  }
}

function list(options: ListOptions): Screen {
  var items = options.items;
  var index = Math.min(Math.max(options.index || 0, 0), items.length - 1);
  var el = screenEl("list-screen", options.title);
  var box = h("div", "b-list");
  var ul = h("ul");
  var rows: HTMLElement[] = [];
  var bar = h("aside", "b-scrollbar");
  var thumb = h("span", "b-thumb");

  items.forEach(function (item) {
    var li = h("li");
    var label = h("span", "b-label");
    label.appendChild(h("span", "", item));
    li.appendChild(label);
    ul.appendChild(li);
    rows.push(li);
  });
  thumb.style.height = 100 / items.length + "%";
  bar.appendChild(thumb);
  box.appendChild(ul);
  box.appendChild(bar);
  el.appendChild(box);
  el.appendChild(footer(options.action === undefined ? "Select" : options.action));

  function render() {
    rows.forEach(function (row, i) {
      var active = i === index;
      var label = row.firstChild as HTMLElement;
      var text = label.firstChild as HTMLElement;
      // The selected row scrolls whatever does not fit, as the phone's lists do.
      var overflow = active ? text.scrollWidth - label.clientWidth : 0;
      row.className = active ? "b-active" : "";
      label.className = overflow > 0 ? "b-label b-marquee" : "b-label";
      text.style.setProperty("--b-marquee-distance", overflow > 0 ? overflow + "px" : "");
    });
    thumb.style.top = (index * 100) / items.length + "%";
    // Rows scroll a page of three at a time, as the phone's lists do.
    var first = rows[index - (index % LINES)];
    if (first) ul.scrollTop = first.offsetTop;
  }

  // A row's width changes once the phone's font arrives, which may be after the list opens.
  if (document.fonts) document.fonts.ready.then(render);

  var screen = push({
    el: el,
    onShow: render,
    onKey: function (key) {
      var last = index;
      if (key === "up") index = moveUp(index, items.length);
      if (key === "down") index = moveDown(index, items.length);
      if (index !== last) {
        render();
        if (options.onChange) options.onChange(index, screen);
      }
      if (key === "ok" && options.onSelect) options.onSelect(index, screen);
      if (key === "clear") options.onBack ? options.onBack(screen) : screen.close();
    },
  });
  return screen;
}

function text(options: TextOptions): Screen {
  var el = screenEl("text-screen", options.title);
  var box = h("div", "b-text");
  var span = h("span", "", options.text);
  var page = 0;
  var pages = 1;
  box.appendChild(span);
  el.appendChild(box);
  el.appendChild(footer(options.action === undefined ? "OK" : options.action));

  // A page is a whole number of pixel lines: a fractional line height is rounded differently by
  // each browser, and the error adds up page after page until lines are cut in half.
  function layout() {
    box.style.maxHeight = "";
    span.style.lineHeight = "";
    span.style.height = "";
    var lineHeight = Math.floor(box.getBoundingClientRect().height / LINES);
    if (!lineHeight) return;
    var pageHeight = lineHeight * LINES;
    box.style.maxHeight = pageHeight + "px";
    span.style.lineHeight = lineHeight + "px";
    pages = Math.max(1, Math.ceil(span.offsetHeight / pageHeight));
    span.style.height = pageHeight * pages + "px";
    page = Math.min(page, pages - 1);
    box.scrollTop = page * pageHeight;
  }

  var screen = push({
    el: el,
    onShow: layout,
    onKey: function (key) {
      // Measured again on each key, as the fonts may have loaded since the screen opened.
      layout();
      if (key === "up") page = moveUp(page, pages);
      if (key === "down") page = moveDown(page, pages);
      if (key === "ok") {
        if (page < pages - 1) page++;
        else options.onDone ? options.onDone(screen) : screen.close();
      }
      if (key === "clear") return options.onBack ? options.onBack(screen) : screen.close();
      layout();
    },
  });
  return screen;
}

function confirm(options: ConfirmOptions): Screen {
  var el = screenEl("confirm-screen");
  el.appendChild(h("div", "b-prompt", options.text));
  if (options.info) el.appendChild(h("span", "b-hint", options.info));
  el.appendChild(footer(options.action === undefined ? "OK" : options.action));

  var screen = push({
    el: el,
    onKey: function (key) {
      if (key === "ok") options.onDone ? options.onDone(screen) : screen.close();
      if (key === "clear") options.onBack ? options.onBack(screen) : screen.close();
    },
  });
  return screen;
}

function result(options: ResultOptions): Screen {
  var type = options.type;
  var el = screenEl("result-screen");
  var iconBox = h("span", "b-icon");
  var timers: number[] = [];
  el.className += type ? " b-" + type : "";
  el.appendChild(h("span", "b-message", options.message));
  el.appendChild(iconBox);

  var svg = type === "done" ? icons.check : type === "fail" ? icons.stop : type === "info" ? icons.info : "";
  if (svg) {
    var img = icon(svg);
    // The tick is drawn into its box a moment later, as on the phone.
    if (type === "done") {
      img.style.visibility = "hidden";
      timers.push(
        window.setTimeout(function () {
          img.style.visibility = "";
        }, 500)
      );
    }
    iconBox.appendChild(img);
  }

  var screen = push({
    el: el,
    onKey: function () {
      screen.close();
    },
    onClose: function () {
      timers.forEach(function (timer) {
        clearTimeout(timer);
      });
      if (options.onClose) options.onClose();
    },
  });
  timers.push(
    window.setTimeout(function () {
      screen.close();
    }, options.timeout === undefined ? 1500 : options.timeout)
  );
  return screen;
}

function number(options: NumberOptions): Screen {
  var value = options.value || "";
  var maxLength = options.maxLength || 0;
  var el = screenEl("number-screen");
  var head = h("header", "b-editing");
  var count = h("span", "b-count");
  var field = h("div", "b-field");
  var digits = h("span", "b-digits");
  head.appendChild(h("span", "", "123"));
  head.appendChild(count);
  field.appendChild(digits);
  field.appendChild(h("span", "b-cursor"));
  el.appendChild(head);
  el.appendChild(h("h1", "b-input-label", options.title));
  el.appendChild(field);
  el.appendChild(footer(options.action === undefined ? "OK" : options.action));

  function render() {
    digits.textContent = value;
    count.textContent = maxLength ? String(maxLength - value.length) : "";
  }
  render();

  var screen = push({
    el: el,
    onKey: function (key) {
      if (typeof key === "number" && (!maxLength || value.length < maxLength)) value += key;
      if (key === "ok") options.onDone ? options.onDone(value, screen) : screen.close();
      if (key === "clear") {
        if (value) value = value.slice(0, -1);
        else return options.onBack ? options.onBack(screen) : screen.close();
      }
      render();
    },
  });
  return screen;
}

function loading(options?: LoadingOptions): Screen {
  var el = screenEl("loading-screen");
  var bar = h("div", "b-progress");
  bar.appendChild(icon(icons.progress));
  el.appendChild(bar);
  el.appendChild(h("div", "b-loading-text", (options && options.message) || "Loading"));
  return push({ el: el, onKey: function () {} });
}

function closeAll() {
  while (stack.length) remove(stack[stack.length - 1]);
}

function isOpen() {
  return stack.length > 0;
}

var ui = {
  list: list,
  text: text,
  confirm: confirm,
  result: result,
  number: number,
  loading: loading,
  closeAll: closeAll,
  isOpen: isOpen,
};

export default ui;
