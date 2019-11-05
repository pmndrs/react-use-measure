import * as React from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import expect from 'expect'
import { render, cleanup, RenderResult, fireEvent } from '@testing-library/react'

import useMeasure, { Options } from '.'

/**
 * Styles
 */

const GlobalStyle = createGlobalStyle`
    body, html {
        margin: 0;
    }

    body {
        height: 200vh;
    }
`

const Wrapper = styled.div`
  width: 500px;
  height: 500px;
  overflow: auto;
`

const Box = styled.div<{ big: boolean }>`
  width: ${p => (p.big ? 400 : 200)}px;
  height: ${p => (p.big ? 400 : 200)}px;
  overflow: hidden;
  font-size: 8px;
`

/**
 * Helpers
 */

const getBounds = (tools: RenderResult): ClientRect => JSON.parse(tools.getByTestId('box').innerHTML)
const nextFrame = () => new Promise(resolve => setTimeout(resolve, 1000 / 60))
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Tests
 */

afterEach(() => {
    cleanup();
    window.scrollTo({ top: 0, left: 0})
})

describe('useMeasure', () => {
  function Test({ switchRef, ...options }: Options & { switchRef?: boolean }) {
    const [ref, bounds] = useMeasure()
    const [big, setBig] = React.useState(false)

    return (
      <>
        <GlobalStyle />
        <Wrapper data-testid="wrapper">
          <Box ref={!switchRef ? ref : undefined} data-testid="box" big={big} onClick={() => setBig(!big)}>
            {JSON.stringify(bounds)}
          </Box>
            <div style={{ width: 2000, height: 2000 }} /> 
        </Wrapper>
        <div ref={switchRef ? ref : null}>Dummy</div>
      </>
    )
  }

  it('gives empty initial bounds on first render', async () => {
    const tools = render(<Test />)

    expect(getBounds(tools).width).toBe(0)
    expect(getBounds(tools).height).toBe(0)
    expect(getBounds(tools).top).toBe(0)
    expect(getBounds(tools).left).toBe(0)
  })

  it('gives correct dimensions and positions after initial render', async () => {
    const tools = render(<Test />)

    await nextFrame()

    expect(getBounds(tools).width).toBe(200)
    expect(getBounds(tools).height).toBe(200)
    expect(getBounds(tools).top).toBe(0)
    expect(getBounds(tools).left).toBe(0)
  })

  it('gives correct dimensions and positions when the tracked elements changes in size', async () => {
    const tools = render(<Test />)

    fireEvent.click(tools.getByTestId('box'))

    await nextFrame()

    expect(getBounds(tools).width).toBe(400)
    expect(getBounds(tools).height).toBe(400)
    expect(getBounds(tools).top).toBe(0)
    expect(getBounds(tools).left).toBe(0)
  })

  it('gives correct dimensions and positions when the page is scrolled', async () => {
    const tools = render(<Test scroll />)

    window.scrollTo({ top: 200 })

    await nextFrame()

    expect(getBounds(tools).top).toBe(-200)
    expect(getBounds(tools).left).toBe(0)
  })
  it('gives correct dimensions and positions when the wrapper is scrolled', async () => {
    const tools = render(<Test scroll />)

    tools.getByTestId('wrapper').scrollTo({ top: 200 })

    await nextFrame()

    expect(getBounds(tools).top).toBe(-200)
    expect(getBounds(tools).left).toBe(0)
  })

  it('debounces the scroll events', async () => {
    const tools = render(<Test scroll debounce={{ scroll: 50, resize: 0 }} />)

    const wrapper = tools.getByTestId('wrapper');

    wrapper.scrollTo({ top: 200 });
    wrapper.scrollTo({ top: 201 });
    wrapper.scrollTo({ top: 202 });

    expect(getBounds(tools).top).toBe(0)

    await wait(60);
    expect(getBounds(tools).top).toBe(-202)
  })

  // this one fails and needs to be fixed
  xit('detects changes in ref', async () => {
    const tools = render(<Test />)

    await wait(100);

    tools.rerender(<Test switchRef />)

    await nextFrame()

    expect(getBounds(tools).top).toBe(200)
  })
})
