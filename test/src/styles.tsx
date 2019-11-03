import styled, { createGlobalStyle } from 'styled-components'

const Global = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    overflow: hidden;
  }

  #root {
    overflow: auto;
  }

  body {
    position: fixed;
    overflow: hidden;
    overscroll-behavior-y: none;
    font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica, ubuntu, roboto, noto, segoe ui, arial, sans-serif;
    color: black;
  }
`

const Box = styled.div<{ size: number }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background-color: hotpink;
  transition: 0.5s;
  cursor: pointer;
  border-radius: 7px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-variant-numeric: tabular-nums;
  padding: 20px;
`

const ScrollArea = styled.div<{ size: number | string; color: string }>`
  width: ${props => props.size};
  height: ${props => props.size};
  background-color: ${props => props.color};
  overflow: auto;
  margin-left: auto;
  margin-right: auto;
`

const ScrollContent = styled.div`
  width: 2000px;
  height: 2000px;
  display: flex;
  justify-content: center;
  align-items: center;
`

export { Global, Box, ScrollArea, ScrollContent }
