export type BrandPoint = { x: number; y: number }
const radians = Math.PI / 180
// Each rigid face turns about its own fold, rather than melting between
// unrelated contours. The initial pose is a compact, readable mark; its last
// small adjustments finish after the sticky hero has started moving away.
const folds = [
  { pivot: [220, 220], offset: [0, 0, 0], angles: [-10, -24, -8], start: .12, end: 1 },
  { pivot: [220, 220], offset: [0, 0, 0], angles: [-10, -24, -8], start: .08, end: .96 },
  { pivot: [220, 220], offset: [0, 0, 0], angles: [-10, -24, -8], start: .04, end: 1 },
  { pivot: [220, 220], offset: [0, 0, 0], angles: [-10, -24, -8], start: 0, end: .94 },
]
export function foldProgress(index: number, progress: number) {
  const { start, end } = folds[index]
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}
export function foldContour(points: BrandPoint[], index: number, progress: number): string {
  const fold = folds[index]
  const amount = 1 - foldProgress(index, progress)
  const [ax, ay, az] = fold.angles.map(a => a * radians * amount)
  return 'M' + points.map(point => {
    const x = point.x - fold.pivot[0], y = point.y - fold.pivot[1]
    const y1 = y * Math.cos(ax), z1 = y * Math.sin(ax)
    const x2 = x * Math.cos(ay) + z1 * Math.sin(ay)
    const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay) + fold.offset[2] * amount
    const x3 = x2 * Math.cos(az) - y1 * Math.sin(az)
    const y3 = x2 * Math.sin(az) + y1 * Math.cos(az)
    const perspective = 1100 / (1100 - z2)
    return `${(fold.pivot[0] + x3 * perspective + fold.offset[0] * amount).toFixed(2)},${(fold.pivot[1] + y3 * perspective + fold.offset[1] * amount).toFixed(2)}`
  }).join('L') + 'Z'
}
