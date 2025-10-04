<p align="center">
  <img height="400" src="https://i.imgur.com/eMYYMla.jpg" />
</p>

    yarn add react-use-measure

This small tool will measure the boundaries (for instance width, height, top, left) of a view you reference. It is reactive and responds to changes in size, window-scroll and nested-area-scroll.

### Why do we need this hook?

Because there is [no simple way](https://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element) to just get relative view coordinates. Yes, there is getBoundingClientRect, but it does not work when your content sits inside scroll areas whose offsets are simply neglected (as well as page scroll). Worse, mouse coordinates are relative to the viewport (the visible rect that contains the page). There is no easy way, for instance, to know that the mouse hovers over the upper/left corner of an element. This hook solves it for you.

You can try a live demo here: https://codesandbox.io/s/musing-kare-4fblz

# Usage

```jsx
import useMeasure from 'react-use-measure'

function App() {
  const [ref, bounds] = useMeasure()

  // consider that knowing bounds is only possible *after* the view renders
  // so you'll get zero values on the first run and be informed later

  return <div ref={ref} />
}
```

# Api

```jsx
interface RectReadOnly {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

type Options = {
  // Debounce events in milliseconds
  debounce?: number | { scroll: number; resize: number }
  // React to nested scroll changes, don't use this if you know your view is static
  scroll?: boolean
  // You can optionally inject a resize-observer polyfill
  polyfill?: { new (cb: ResizeObserverCallback): ResizeObserver }
  // Measure size using offsetHeight and offsetWidth to ignore parent scale transforms
  offsetSize?: boolean
  // Measure visual (post-transform) bounds using getBoundingClientRect with rAF sampling
  includeTransforms?: boolean
}

useMeasure(
  options: Options = { debounce: 0, scroll: false }
): [React.MutableRefObject<HTMLElement | SVGElement>, RectReadOnly]
```

### Transform-aware measuring (opt-in)

By default, `useMeasure` reports the layout box (fast and efficient). CSS transforms (like `scale()`) change what you see but not the layout box, so layout-based measurements don't reflect transforms.

If you need the **visual** (post-transform) box, enable:

```tsx
const [ref, bounds] = useMeasure({ includeTransforms: true });
```

This uses `getBoundingClientRect()` under the hood and adds a small `requestAnimationFrame` sampler so transform-only changes are detected. It still updates on scroll/resize, and it pauses when the tab is hidden. Keep this option off unless you need it.

**Example:** A 40×40 element with `transform: scale(0.75)` will report ~30×30 with `includeTransforms: true`, but ~40×40 with the default mode.

> **Tip:** `offsetSize` is unrelated; it measures via `offsetWidth/offsetHeight` to ignore **parent** scaling. `includeTransforms` measures the element's **own** post-transform box.

# ⚠️ Notes

### Resize-observer polyfills

This lib relies on resize-observers. If you need a polyfill you can either polute the `window` object or inject it cleanly using the config options. We recommend [@juggle/resize-observer](https://github.com/juggle/resize-observer).

```jsx
import { ResizeObserver } from '@juggle/resize-observer'

function App() {
  const [ref, bounds] = useMeasure({ polyfill: ResizeObserver })
```

### Multiple refs

useMeasure currently returns its own ref. We do this because we are using functional refs for unmount tracking. If you need to have a ref of your own on the same element, use [react-merge-refs](https://github.com/smooth-code/react-merge-refs).
