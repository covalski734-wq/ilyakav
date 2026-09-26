import { brandParts } from '../components/brandGeometry'
import { ribbonBands, type RibbonEdges } from './ribbonChoreography'

type Point = { x: number; y: number; z: number }
type Color = [number, number, number]
export type RibbonFace = { points: Point[]; colors: Color[]; depth: number }
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, p: number) => {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const rgb = (hex: string): Color => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as Color
const palette = brandParts.map(part => part.colors.map(rgb))
const cyan: Color = [26, 202, 245], blue: Color = [67, 76, 246]
const cross = (a: Point, b: Point): Point => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x })
const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })

// A zero-thickness sheet. Depth controls which stretch passes over another;
// it does not turn the ribbon into a tube. All cuts share the same source frame.
export function ribbonSurface(edges: RibbonEdges[], progress: number, time: number): RibbonFace[] {
  const bands = ribbonBands(edges, progress, time)
  const flatten = smooth(.35, .92, progress)
  const material = 1 - smooth(.55, .96, progress)
  const brand = smooth(.4, .98, progress)
  const rows = bands.map((band, part) => band.left.map((left, i) => {
    const right = band.right[i], u = band.u[i], t = .25 + u * Math.PI * 2 + time * .35
    const center = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 }
    const z = mix(86 * Math.sin(3 * t), part * 1.5, flatten)
    const tilt = 26 * Math.sin(u * Math.PI * 4 + .25 + .15 * Math.sin(time)) * (1 - flatten)
    return { left: { ...left, z: z - tilt }, right: { ...right, z: z + tilt }, center: { ...center, z }, u }
  }))
  const allRows = rows.flat()
  const vertices = rows.map((band, part) => band.map((row, j) => {
    const previous = band[Math.max(0, j - 1)], next = band[Math.min(band.length - 1, j + 1)]
    const tangent = subtract(next.center, previous.center)
    const transverse = subtract(row.right, row.left)
    const normal = cross(tangent, transverse)
    const length = Math.hypot(normal.x, normal.y, normal.z) || 1
    const sign = normal.z < 0 ? -1 : 1
    const light = Math.max(0, sign * (-.28 * normal.x - .42 * normal.y + .86 * normal.z) / length)
    // Soft contact shade belongs only to the farther surface at a crossing.
    // Neighbouring rows are the same sheet and must never shadow themselves.
    let occlusion = 0
    if (material > .001) for (let k = 0; k < allRows.length; k += 3) {
      const other = allRows[k]
      const separation = Math.abs(other.u - row.u)
      if (Math.min(separation, 1 - separation) < .075 || other.center.z < row.center.z + 15) continue
      const dx = row.center.x - other.center.x - 6, dy = row.center.y - other.center.y - 8
      const radius = Math.hypot(other.right.x - other.left.x, other.right.y - other.left.y) / 2 + 8
      const distance = (dx * dx + dy * dy) / (radius * radius)
      occlusion = Math.max(occlusion, Math.exp(-distance * 1.5) * .42)
    }
    return Array.from({ length: 7 }, (_, column) => {
      const v = column / 6
      const point = { x: mix(row.left.x, row.right.x, v), y: mix(row.left.y, row.right.y, v), z: mix(row.left.z, row.right.z, v) }
      const hue = .5 + .5 * Math.sin(row.u * Math.PI * 2 - .8)
      const satin = Math.pow(Math.max(0, Math.cos((v - .3 - .18 * Math.sin(row.u * Math.PI * 2)) * Math.PI)), 12) * .08
      const illumination = .34 + .7 * light + satin - occlusion
      const base = blue.map((c, k) => mix(c, cyan[k], hue))
      const axis = brandParts[part].axis
      const ax = axis[2] - axis[0], ay = axis[3] - axis[1]
      const gradient = Math.max(0, Math.min(1, ((point.x - axis[0]) * ax + (point.y - axis[1]) * ay) / (ax * ax + ay * ay))) * 2
      const stop = Math.min(1, Math.floor(gradient))
      const colors = base.map((c, k) => {
        const lit = Math.min(255, c * illumination + 28 * satin)
        const target = mix(palette[part][stop][k], palette[part][stop + 1][k], gradient - stop)
        return mix(lit, target, brand)
      }) as Color
      return { point, colors }
    })
  }))
  const faces: RibbonFace[] = []
  for (const band of vertices) for (let row = 0; row < band.length - 1; row++) for (let column = 0; column < 6; column++) {
    const corners = [band[row][column], band[row + 1][column], band[row + 1][column + 1], band[row][column + 1]]
    faces.push({ points: corners.map(c => c.point), colors: corners.map(c => c.colors), depth: corners.reduce((sum, c) => sum + c.point.z, 0) / 4 })
  }
  return faces
}
