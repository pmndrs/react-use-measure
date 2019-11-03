import { RectReadOnly } from '.'

const keys: (keyof RectReadOnly)[] = ['x', 'y', 'top', 'bottom', 'left', 'right', 'width', 'height']

export default function areBoundsEqual(a: RectReadOnly, b: RectReadOnly): boolean {
  return keys.every(key => a[key] === b[key])
}
