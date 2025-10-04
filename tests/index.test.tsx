import * as React from 'react'
import { render, cleanup, RenderResult, fireEvent } from '@testing-library/react'
import Polyfill from 'resize-observer-polyfill'
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'

import useMeasure, { Options } from '../src/index'

/**
 * Helpers
 */

const getBounds = (tools: RenderResult): DOMRect => JSON.parse(tools.getByTestId('box').innerHTML)
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock rAF for transform-aware tests
let rafCallbacks: (() => void)[] = []
let rafId = 0

const mockRequestAnimationFrame = vi.fn((callback: () => void) => {
  rafCallbacks.push(callback)
  return ++rafId
})

const mockCancelAnimationFrame = vi.fn((id: number) => {
  // Simple mock - just clear all callbacks
  rafCallbacks = []
})

function advanceRaf() {
  const callbacks = [...rafCallbacks]
  rafCallbacks = []
  callbacks.forEach(callback => callback())
}

function mockGetBoundingClientRect(rect: Partial<DOMRectReadOnly>) {
  const defaultRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => rect
  }
  return vi.fn(() => ({ ...defaultRect, ...rect }))
}

function ignoreWindowErrors(test: () => void) {
  const onErrorBackup = window.onerror
  window.onerror = () => null
  const consoleError = console.error
  console.error = () => null

  test()

  window.onerror = onErrorBackup
  console.error = consoleError
}

/**
 * Tests
 */

beforeEach(() => {
  // Reset rAF mocks
  rafCallbacks = []
  rafId = 0
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  window.scrollTo({ top: 0, left: 0 })
})

describe('useMeasure', () => {
  type Props = {
    switchRef?: boolean
    scale?: number
    onRender?: () => void
    options?: Options
    polyfill?: boolean
    offsetSize?: boolean
    includeTransforms?: boolean
  }

  function Test({ switchRef, options, onRender, polyfill, scale = 1, offsetSize = false, includeTransforms = false }: Props) {
    const [ref, bounds] = useMeasure({ ...options, polyfill: polyfill ? Polyfill : undefined, offsetSize, includeTransforms })
    const [big, setBig] = React.useState(false)

    if (onRender) {
      onRender()
    }

    return (
      <>
        <style>{'body, html { margin: 0; } body { height: 200vh; }'}</style>
        <div
          data-testid="wrapper"
          style={{
            transform: `scale(${scale})`,
            width: '500px',
            height: '500px',
            overflow: 'auto',
          }}
        >
          <div
            ref={!switchRef ? ref : undefined}
            data-testid="box"
            onClick={() => setBig(!big)}
            style={{
              width: `${big ? 400 : 200}px`,
              height: `${big ? 400 : 200}px`,
              overflow: 'hidden',
              fontSize: '8px',
            }}
          >
            {JSON.stringify(bounds)}
          </div>
          <div style={{ width: 2000, height: 2000 }} />
        </div>
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

  it('renders 1 additional time after first render', async () => {
    let count = 0

    render(<Test onRender={() => count++} />)

    await nextFrame()

    expect(count).toBe(2)
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
    const tools = render(<Test options={{ scroll: true }} />)

    window.scrollTo({ top: 200 })

    await nextFrame()

    expect(getBounds(tools).top).toBe(-200)
    expect(getBounds(tools).left).toBe(0)
  })
  it('gives correct dimensions and positions when the wrapper is scrolled', async () => {
    const tools = render(<Test options={{ scroll: true }} />)

    tools.getByTestId('wrapper').scrollTo({ top: 200 })

    await nextFrame()

    expect(getBounds(tools).top).toBe(-200)
    expect(getBounds(tools).left).toBe(0)
  })

  it('gives correct size when offsetSize: true and parent is scaled', async () => {
    const tools = render(<Test offsetSize scale={0.8} />)

    await nextFrame()

    expect(getBounds(tools).width).toBe(200)
    expect(getBounds(tools).height).toBe(200)
  })

  it('gives correct size when offsetSize: false and parent is scaled', async () => {
    const tools = render(<Test scale={0.8} />)

    await nextFrame()

    expect(getBounds(tools).width).toBe(200 * 0.8)
    expect(getBounds(tools).height).toBe(200 * 0.8)
  })

  it('debounces the scroll events', async () => {
    const tools = render(<Test options={{ scroll: true, debounce: { scroll: 50, resize: 0 } }} />)

    const wrapper = tools.getByTestId('wrapper')

    wrapper.scrollTo({ top: 200 })
    await nextFrame()
    wrapper.scrollTo({ top: 201 })
    await nextFrame()
    wrapper.scrollTo({ top: 202 })
    await nextFrame()

    expect(getBounds(tools).top).toBe(0)

    await wait(100)
    expect(getBounds(tools).top).toBe(-202)
  })

  // this one fails and needs to be fixed
  it('detects changes in ref', async () => {
    const tools = render(<Test />)

    await wait(100)

    tools.rerender(<Test switchRef />)

    await nextFrame()

    expect(getBounds(tools).top).toBe(500)
  })

  it('throws an descriptive error when the browser does not support ResizeObserver', () => {
    const RO = (window as any).ResizeObserver
    ;(window as any).ResizeObserver = null

    ignoreWindowErrors(() => {
      expect(() => render(<Test />)).toThrow(
        'This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills',
      )
    })
    ;(window as any).ResizeObserver = RO
  })

  it('does not throw when a ResizeObserver polyfill was provided', () => {
    const RO = (window as any).ResizeObserver
    ;(window as any).ResizeObserver = null

    ignoreWindowErrors(() => {
      expect(() => render(<Test polyfill />)).not.toThrow(
        'This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills',
      )
    })
    ;(window as any).ResizeObserver = RO
  })

  describe('transform-aware mode', () => {
    it('can be enabled without breaking existing functionality', async () => {
      const tools = render(<Test includeTransforms />)
      await nextFrame()
      
      // Should still measure correctly
      const bounds = getBounds(tools)
      expect(bounds.width).toBeGreaterThan(0)
      expect(bounds.height).toBeGreaterThan(0)
    })

    it('demonstrates transform scale difference', async () => {
      // Test with a scaled element
      const tools = render(<Test includeTransforms scale={0.75} />)
      
      await nextFrame()
      
      const bounds = getBounds(tools)
      
      // With includeTransforms: true, we should get the visual (scaled) dimensions
      // The element is 200x200 but scaled to 0.75, so visual should be ~150x150
      expect(bounds.width).toBeCloseTo(150, 1)
      expect(bounds.height).toBeCloseTo(150, 1)
    })

    it('demonstrates default mode vs transform mode difference', async () => {
      // Test default mode (should report layout dimensions)
      const defaultTools = render(<Test scale={0.75} />)
      await nextFrame()
      const defaultBounds = getBounds(defaultTools)
      
      // Test transform mode (should report visual dimensions)
      const transformTools = render(<Test includeTransforms scale={0.75} />)
      await nextFrame()
      const transformBounds = getBounds(transformTools)
      
      // Default mode should report larger dimensions (layout box)
      // Transform mode should report smaller dimensions (visual box)
      expect(defaultBounds.width).toBeGreaterThan(transformBounds.width)
      expect(defaultBounds.height).toBeGreaterThan(transformBounds.height)
    })
  })
})
