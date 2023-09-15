export const VIEWPORT_RATIO = 1.374;

function getViewport() {
  if (!window) throw new Error("window is not defined");

  const ratio = VIEWPORT_RATIO;
  const height = window.innerHeight;
  const width = height * ratio;
  return {
    /** The width / height ratio for manual calculations. */
    ratio,
    /** The width of the viewport. */
    width,
    /** The height of the viewport. */
    height,
  };
}

export default getViewport();
