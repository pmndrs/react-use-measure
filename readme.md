    npm install resize-observer-polyfill react-use-measure

This small tool will measure the bounds of the view you reference. It is reactive and responds to size (or scroll) changes that affect the views size or position.

# Usage

```jsx
import useMeasure from 'react-use-measure'
// This step is optional, resize observers are supported by most browsers
// See: https://caniuse.com/#feat=resizeobserver
import ResizeObserver from 'resize-observer-polyfill'

function App() {
  const [ref, bounds] = useMeasure()

  // consider that knowing bounds is only possible *after* the view renders
  // so you'll get zero values on the first run and be informed later

  return <div ref={ref} />
}
```

or

```jsx
const ref = useRef()
const bounds = useMeasure(ref)
return <div ref={ref} />
```

# API

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

useMeasure(
  ref?: React.MutableRefObject<HTMLElement>
): [React.MutableRefObject<HTMLElement>, RectReadOnly]
```
