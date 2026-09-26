type Vec = [number, number, number]
export type RibbonFace = { path: string; color: string; depth: number }
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (v: Vec): Vec => {
  const length = Math.hypot(...v) || 1
  return v.map(n => n / length) as Vec
}
const sub = (a: Vec, b: Vec): Vec => a.map((n, i) => n - b[i]) as Vec

const phase = (t: number) => (t - .5) * Math.PI * 2 * 1.6
function release(t: number, progress: number) {
  const p = Math.max(0, Math.min(1, (progress - .18 * t) / .82))
  return p * p * (3 - 2 * p)
}
function centerline(t: number, progress: number): Vec {
  const open = release(t, progress)
  const angle = (t - .5) * Math.PI * 2 * (1.6 - .86 * progress)
  return [
    (t - .5) * (280 + 120 * open) + 105 * Math.sin(angle) * (1 - open * .45),
    130 * Math.cos(angle) * (1 - open * .3) - 35 * open,
    105 * Math.sin(angle) * (1 - open * .35),
  ]
}

// Two open loops travel across the composition, separated in depth.
// Scrolling releases them into a long diagonal wave.
function surface(t: number, across: number, progress: number): Vec {
  const center = centerline(t, progress)
  const tangent = unit(sub(centerline(t + .0001, progress), centerline(t - .0001, progress)))
  const side = unit(cross(tangent, [0, 0, 1]))
  const perpendicular = cross(tangent, side)
  const twist = Math.sin(phase(t) + .4) * .38 * (1 - release(t, progress) * .85)
  const width = 34
  const direction = side.map((n, i) => n * Math.cos(twist) + perpendicular[i] * Math.sin(twist)) as Vec
  const point = center.map((n, i) => n + direction[i] * across * width) as Vec
  // A small turn accompanies the opening, while the geometry does the work.
  const yaw = .3 - progress * .12, tilt = -.48 + progress * .12
  const x = point[0] * Math.cos(yaw) + point[2] * Math.sin(yaw)
  const z = -point[0] * Math.sin(yaw) + point[2] * Math.cos(yaw)
  return [x * Math.cos(tilt) - point[1] * Math.sin(tilt), x * Math.sin(tilt) + point[1] * Math.cos(tilt), z]
}

const light = unit([- .45, -.6, 1])
function colorAt(t: number, across: number, progress: number) {
  const along = sub(surface(t + .0001, across, progress), surface(t - .0001, across, progress))
  const wide = sub(surface(t, across + .0001, progress), surface(t, across - .0001, progress))
  let normal = unit(cross(along, wide))
  if (normal[2] < 0) normal = normal.map(n => -n) as Vec
  const diffuse = Math.max(0, normal.reduce((sum, n, i) => sum + n * light[i], 0))
  const shine = Math.pow(Math.max(0, normal[2] * .93 - normal[0] * .25 - normal[1] * .27), 24)
  const brightness = .45 + diffuse * .53
  return `rgb(${[111, 91, 236].map(n => Math.round(Math.min(255, n * brightness + shine * 85))).join(',')})`
}

export function ribbonGeometry(rawProgress: number): RibbonFace[] {
  const progress = Math.min(1, Math.max(0, rawProgress))
  const faces: RibbonFace[] = []
  const segments = 300, lanes = 1
  const project = (v: Vec) => {
    const perspective = 1050 / (1050 - v[2])
    return `${(340 + v[0] * perspective).toFixed(2)},${(335 + v[1] * perspective).toFixed(2)}`
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < lanes; j++) {
      const t0 = i / segments, t1 = (i + 1) / segments
      const u0 = j / lanes * 2 - 1, u1 = (j + 1) / lanes * 2 - 1
      const points = [surface(t0, u0, progress), surface(t1, u0, progress), surface(t1, u1, progress), surface(t0, u1, progress)]
      faces.push({
        path: `M${points.map(project).join('L')}Z`,
        color: colorAt((t0 + t1) / 2, (u0 + u1) / 2, progress),
        depth: points.reduce((sum, p) => sum + p[2], 0) / 4,
      })
    }
  }
  return faces.sort((a, b) => a.depth - b.depth)
}
