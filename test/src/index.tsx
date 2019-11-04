import React, { Fragment, useState } from "react"
import ReactDOM from "react-dom"
import useMeasure from "react-use-measure"
import { Global, Box, ScrollArea, ScrollContent } from "./styles"

function ScrollBox({ size, color, children }: { size: number | string; color: string; children: any }) {
  const scrollBoxRef = React.useRef<HTMLDivElement | null>(null)

  React.useLayoutEffect(() => {
    if (!scrollBoxRef.current) return
    const { width, height } = scrollBoxRef.current!.getBoundingClientRect()
    scrollBoxRef.current.scrollTop = 2000 / 2 - height / 2
    scrollBoxRef.current.scrollLeft = 2000 / 2 - width / 2
  }, [])

  return (
    <ScrollArea ref={scrollBoxRef} size={size} color={color}>
      <ScrollContent>{children}</ScrollContent>
    </ScrollArea>
  )
}

function MeasuredBox({ color }: { color: string }) {
  // This line is all you need ...
  const [ref, bounds] = useMeasure({ scroll: true })
  // The rest is just for effects, hover and mouse tracking
  const [big, setBig] = useState(false)
  const [hovered, setHover] = useState(false)
  const [xy, setXY] = useState([0, 0])

  return (
    <Box
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={({ clientX, clientY }) => setXY([clientX, clientY])}
      onClick={() => setBig(!big)}
      size={big ? 270 : 235}
      color={color}>
      {Object.keys(bounds).map(key => (
        <Fragment key={key}>
          <span>{key}</span>
          <span>{Math.round(bounds[key])}px</span>
        </Fragment>
      ))}
      {hovered && (
        <>
          <span>mouse x</span>
          <span>{Math.round(xy[0] - bounds.left)}px</span>
          <span>mouse y</span>
          <span>{Math.round(xy[1] - bounds.top)}px</span>
        </>
      )}
    </Box>
  )
}

function Example() {
  return (
    <>
      <Global color="white" />
      <div style={{ width: "100vw", height: "300vh", paddingTop: "20vh" }}>
        <ScrollBox size="60vh" color="#272730">
          <ScrollBox size="50vh" color="#676770">
            <MeasuredBox color="#F7567C" />
          </ScrollBox>
        </ScrollBox>
      </div>
    </>
  )
}

ReactDOM.render(<Example />, document.getElementById("root"))