    yarn add react-use-measure

This small tool will measure the boundaries of a view you reference. It is reactive and responds to changes in size, window-scroll and nested-area-scroll. It uses the [resize-observer-polyfill](https://github.com/que-etc/resize-observer-polyfill) on platforms that do not support resize observers.

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
  // Millisecond debounce for events, default: 0
  debounce?: number | { scroll: number; resize: number }
  // React to nested scroll changes, default: false
  scroll?: boolean
}

useMeasure(
  options: Options = { debounce: 0, scroll: false }
): [React.MutableRefObject<HTMLElement>, RectReadOnly]
```

# ⚠️ Notes

useMeasure currently returns its own ref. We do this because we are using functional refs for unmount tracking. If you need to have a ref of your own on the same element, use [react-merge-refs](https://github.com/smooth-code/react-merge-refs).
