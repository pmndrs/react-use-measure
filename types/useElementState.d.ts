export default function useElementState<T>(
  initialState: T,
  elementToState: (element: HTMLElement) => T
): [(node: HTMLElement | null) => void, T]
