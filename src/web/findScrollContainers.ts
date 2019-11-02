export default function findScrollContainers(element: HTMLElement | null): HTMLElement[] {
  const result: HTMLElement[] = []

  if (!element || element === document.body) {
    return result
  }

  const { overflow, overflowX, overflowY } = window.getComputedStyle(element)

  if ([overflow, overflowX, overflowY].some(prop => prop === 'auto' || prop === 'scroll')) {
    result.push(element)
  }

  return [...result, ...findScrollContainers(element.parentElement)]
}
