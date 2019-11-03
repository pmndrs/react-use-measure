import React from 'react'
import ReactDOM from 'react-dom'
import useMeasure from 'react-use-measure'
import { Global, Box, ScrollArea, ScrollContent } from './styles'

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

const MeasuredBox = React.forwardRef(({ children }: { children: any }, ref: any) => {
  const [big, setBig] = React.useState(false)
  return (
    <Box ref={ref} onClick={() => setBig(!big)} size={big ? 250 : 200}>
      {children}
    </Box>
  )
})

function Example() {
  const [ref, bounds] = useMeasure({ debounce: 0 })
  return (
    <>
      <Global />
      <div style={{ width: '100vw', height: '300vh', paddingTop: '25vh' }}>
        <ScrollBox size="50vh" color="#d2d2d2">
          <ScrollBox size="40vh" color="white">
            <MeasuredBox ref={ref}>
              <span>top</span>
              <span>{Math.round(bounds.top)}px</span>
              <span>left</span>
              <span>{Math.round(bounds.left)}px</span>
              <span>width</span>
              <span>{Math.round(bounds.width)}px</span>
              <span>height</span>
              <span>{Math.round(bounds.height)}px</span>
              <span>bottom</span>
              <span>{Math.round(bounds.bottom)}px</span>
              <span>right</span>
              <span>{Math.round(bounds.right)}px</span>
              <span>x</span>
              <span>{Math.round(bounds.x)}px</span>
              <span>y</span>
              <span>{Math.round(bounds.y)}px</span>
            </MeasuredBox>
          </ScrollBox>
        </ScrollBox>
      </div>
    </>
  )
}

ReactDOM.render(<Example />, document.getElementById('root'))
