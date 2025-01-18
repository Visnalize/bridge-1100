export var VIEWPORT_RATIO = 1.374;

function getViewport() {
  if (!window) throw new Error("window is not defined");

  var ratio = VIEWPORT_RATIO;
  var height = window.innerHeight;
  var width = height * ratio;
  return {
    /** The width / height ratio for manual calculations. */
    ratio,
    /** The width of the viewport. */
    width,
    /** The height of the viewport. */
    height,
  };
}

var viewport = getViewport();

export default viewport;
