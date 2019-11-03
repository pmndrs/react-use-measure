    yarn add react-use-measure

This small tool will measure the boundaries of a view you reference. It is reactive and responds to changes in size, window-scroll and nested-area-scroll. It uses the [resize-observer-polyfill](https://github.com/que-etc/resize-observer-polyfill) on platforms that do not support resize observers.

### Why do we need this hook?

Because there is [no simple way](https://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element) to just get relative coordinates for a view react. Yes, there is getBoundingClientRect, but it does not work when your content sits inside scroll areas whose offsets are simply neglected (as well as page scroll). Worse, mouse coordinates are relative to the viewport (the visible rect that contains the page). There is no easy way, for instance, to know that the mouse hovers over the upper/left corner of an element. This hook solves it for you.

You can try a live demo here: https://codesandbox.io/s/musing-kare-4fblz

# Usage

```jsx
import useMeasure from 'react-use-measure'

function App() {
  const [ref, bounds] = useMeasure({ scroll: true })

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
  // React to nested scroll changes
  scroll?: boolean
}

useMeasure(
  options: Options = { debounce: 0, scroll: false }
): [React.MutableRefObject<HTMLElement>, RectReadOnly]
```

# ⚠️ Notes

useMeasure currently returns its own ref. We do this because we are using functional refs for unmount tracking. If you need to have a ref of your own on the same element, use [react-merge-refs](https://github.com/smooth-code/react-merge-refs).
