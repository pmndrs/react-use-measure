import ReactDOM from 'react-dom'
import React, { Fragment, useEffect, useRef } from 'react'
import useMeasure, { RectReadOnly } from 'react-use-measure'
import { useSpring, animated as a } from 'react-spring'
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

const MeasuredBox = React.forwardRef(({ children, color }: { children: any; color: string }, ref: any) => {
  const [big, setBig] = React.useState(false)
  return (
    <Box ref={ref} onClick={() => setBig(!big)} size={big ? 250 : 200} color={color}>
      {children}
    </Box>
  )
})

function Example() {
  const [ref, bounds] = useMeasure({ scroll: true })
  const prev = useRef<RectReadOnly>(bounds)
  useEffect(() => void (prev.current = { ...bounds }), [bounds])

  const inter = (o: any) => `rgba(0,0,0,${o})`
  const springs: any = useSpring({
    reset: true,
    from: Object.keys(bounds).reduce((acc, key) => ({ ...acc, [key]: prev.current[key] !== bounds[key] ? 1 : 0 }), {}),
    to: Object.keys(bounds).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
  })

  return (
    <>
      <Global color="white" />
      <div style={{ width: '100vw', height: '300vh', paddingTop: '20vh' }}>
        <ScrollBox size="60vh" color="#272730">
          <ScrollBox size="50vh" color="#676770">
            <MeasuredBox ref={ref} color="#F7567C">
              {Object.keys(bounds).map(key => (
                <Fragment key={key}>
                  <span>{key}</span>
                  <a.span style={{ background: springs[key].interpolate(inter) }}>{Math.round(bounds[key])}px</a.span>
                </Fragment>
              ))}
            </MeasuredBox>
          </ScrollBox>
        </ScrollBox>
      </div>
    </>
  )
}

ReactDOM.render(<Example />, document.getElementById('root'))
