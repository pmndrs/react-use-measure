'use strict'

var react = require('react')

function useMeasure() {
  var ref = react.useRef(null)

  var _useState = react.useState({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
    }),
    bounds = _useState[0],
    set = _useState[1]

  var _useState2 = react.useState(function() {
      return new ResizeObserver(function() {
        if (!ref.current) return
        var _window = window,
          pageXOffset = _window.pageXOffset,
          pageYOffset = _window.pageYOffset

        var _ref = ref.current.getBoundingClientRect(),
          left = _ref.left,
          top = _ref.top,
          width = _ref.width,
          height = _ref.height,
          bottom = _ref.bottom,
          right = _ref.right,
          x = _ref.x,
          y = _ref.y

        var size = {
          left: left,
          top: top,
          width: width,
          height: height,
          bottom: bottom,
          right: right,
          x: x,
          y: y,
        }
        size.top += pageYOffset
        size.bottom += pageYOffset
        size.y += pageYOffset
        size.left += pageXOffset
        size.right += pageXOffset
        size.x += pageXOffset
        Object.freeze(size)
        return set(size)
      })
    }),
    ro = _useState2[0]

  react.useEffect(function() {
    if (ref.current) ro.observe(ref.current)
    return function() {
      return ro.disconnect()
    }
  }, [])
  return [ref, bounds]
}

module.exports = useMeasure
