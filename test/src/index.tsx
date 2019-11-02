import './index.css'
import React from 'react'
import ReactDOM from 'react-dom'
import useMeasure from 'react-use-measure'

type ScrollBoxProps = {
  size: number | string
  color: string
  children: any
}

const INNER_SIZE = 2000

function ScrollBox({ size, color, children }: ScrollBoxProps) {
  const scrollBoxRef = React.useRef<HTMLDivElement | null>(null)

  React.useLayoutEffect(() => {
    if (!scrollBoxRef.current) {
      return
    }

    const { width, height } = scrollBoxRef.current!.getBoundingClientRect()

    scrollBoxRef.current.scrollTop = INNER_SIZE / 2 - height / 2
    scrollBoxRef.current.scrollLeft = INNER_SIZE / 2 - width / 2
  }, [])

  return (
    <div
      ref={scrollBoxRef}
      style={{
        width: size,
        height: size,
        overflow: 'auto',
        backgroundColor: color,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
      <div
        style={{
          width: 2000,
          height: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {children}
      </div>
    </div>
  )
}

const Box = React.forwardRef(function Box(_, ref: any) {
  const [big, setBig] = React.useState(false)

  const size = big ? 100 : 50

  return (
    <div
      ref={ref}
      onClick={() => setBig(!big)}
      style={{
        width: size,
        height: size,
        backgroundColor: 'green',
        transition: '0.5s',
        cursor: 'pointer',
      }}
    />
  )
})

function Example() {
  const [ref, bounds] = useMeasure()

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          backgroundColor: 'white',
          zIndex: 100,
          borderBottom: '1px solid #ececec',
        }}>
        <div>Current position:</div>
        <code>
          {JSON.stringify({
            top: Math.round(bounds.top),
            left: Math.round(bounds.left),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
          })}
        </code>
      </div>
      <div style={{ width: '100vw', height: '300vh', paddingTop: 128 }}>
        <ScrollBox size="40vw" color="#d2d2d2">
          <ScrollBox size="30vw" color="white">
            <Box ref={ref} />
          </ScrollBox>
        </ScrollBox>

        <div
          style={{
            width: '40vw',
            height: 100,
            backgroundColor: 'pink',
            overflow: 'auto',
            margin: 'auto',
            marginTop: 32,
            padding: 16,
          }}>
          Dummy scrollbox
          <div style={{ width: 2000, height: 2000 }} />
        </div>
      </div>
    </>
  )
}

ReactDOM.render(<Example />, document.getElementById('root'))
