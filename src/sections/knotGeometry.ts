export type KnotPoint = { x: number; y: number }
type V = [number, number, number]
export type KnotFace = { points: KnotPoint[]; depth: number; color: string; colors: number[][]; depths: number[] }
const TAU = Math.PI * 2
const mix = (a: number, b: number, p: number) => a + (b - a) * p
const smooth = (p: number) => { const t = Math.max(0, Math.min(1, p)); return t * t * (3 - 2 * t) }
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (v: V): V => { const n = Math.hypot(...v) || 1; return [v[0] / n, v[1] / n, v[2] / n] }
function curve(t: number): V {
  const radius = 2 + .62 * Math.cos(3 * t)
  return [radius * Math.cos(2 * t) * 77, radius * Math.sin(2 * t) * 77, Math.sin(3 * t) * 80]
}
function knot(t: number, v: number, progress: number): V {
  const center = curve(t)
  const tangent = unit(sub(curve(t + .001), curve(t - .001)))
  const radial = unit(cross(tangent, [0, 0, 1]))
  const normal = unit(cross(tangent, radial))
  const twist = .35 * Math.sin(t * 3)
  const width = 34
  // Open, zero-thickness strip rather than a round tube cross-section.
  const p = center.map((n, i) => n + (v * 2 - 1) * width * (radial[i] * Math.cos(twist) + normal[i] * Math.sin(twist))) as V
  const tilt = .7 - progress * .35, spin = -.65 + progress * 1.4
  const y = p[1] * Math.cos(tilt) - p[2] * Math.sin(tilt)
  const z = p[1] * Math.sin(tilt) + p[2] * Math.cos(tilt)
  return [220 + p[0] * Math.cos(spin) - y * Math.sin(spin), 220 + p[0] * Math.sin(spin) + y * Math.cos(spin), z]
}

const stops = [
  [[0,203,233],[0,117,255],[52,34,239]],
  [[0,185,243],[52,58,250],[37,18,153]],
  [[6,44,126],[32,47,183],[96,23,255]],
  [[0,209,223],[0,153,255],[38,52,255]],
]
const axes = [[100,0,0,150],[80,140,12,430],[190,250,420,420],[360,45,135,320]]

// A continuous flat ribbon. Color travels along its length at rest; scroll
// opens its four adjoining patches into the exact logo contours.
export function knotFaces(contours: KnotPoint[][], progress: number, segments = 56, lanes = 6, flow = 0): KnotFace[] {
  const faces: KnotFace[] = []
  const blend = smooth((progress - .08) / .88)
  for (let part = 0; part < 4; part++) {
    const boundary = contours[part]
    const at = (fraction: number) => {
      const index = ((fraction % 1) + 1) % 1 * boundary.length
      const a = boundary[Math.floor(index)], b = boundary[(Math.floor(index) + 1) % boundary.length]
      return { x: mix(a.x, b.x, index % 1), y: mix(a.y, b.y, index % 1) }
    }
    const grid: V[][] = []
    for (let i = 0; i <= segments; i++) {
      const u = i / segments
      const left = at(u * .5), right = at(1 - u * .5)
      const row: V[] = []
      for (let j = 0; j <= lanes; j++) {
        const v = j / lanes
        const source = knot((part + u) / 4 * TAU, v, progress)
        row.push([
          mix(source[0], mix(left.x, right.x, v), blend),
          mix(source[1], mix(left.y, right.y, v), blend),
          mix(source[2], part === 3 ? 2 : 0, blend),
        ])
      }
      grid.push(row)
    }
    const shade = (i: number, j: number) => {
      const along = sub(grid[Math.min(segments,i+1)][j], grid[Math.max(0,i-1)][j])
      const across = sub(grid[i][Math.min(lanes,j+1)], grid[i][Math.max(0,j-1)])
      let n = unit(cross(along, across))
      if (n[2] < 0) n = n.map(x => -x) as V
      const diffuse = Math.max(0, n[0] * -.35 + n[1] * -.45 + n[2] * .82)
      const alongPhase = (part + i / segments) / 4 * TAU - flow
      const travelingBand = Math.pow(.5 + .5 * Math.cos(alongPhase * 3), 10)
      const hue = .5 + .5 * Math.sin(alongPhase)
      const base = [mix(15,65,hue),mix(186,50,hue),mix(231,245,hue)]
      const center = grid[i][j]
      const [x1,y1,x2,y2] = axes[part]
      const gradient = Math.max(0,Math.min(1,((center[0]-x1)*(x2-x1)+(center[1]-y1)*(y2-y1))/((x2-x1)**2+(y2-y1)**2))) * 2
      const interval = Math.min(1,Math.floor(gradient))
      return base.map((c,k) => {
        const lit = Math.min(255,c * (.76 + diffuse * .18) + travelingBand * 38)
        const target = mix(stops[part][interval][k],stops[part][interval+1][k],gradient-interval)
        return Math.round(mix(lit,target,smooth((progress-.65)/.35)))
      })
    }
    const shades = grid.map((row,i)=>row.map((_,j)=>shade(i,j)))
    for (let i = 0; i < segments; i++) for (let j = 0; j < lanes; j++) {
      const quad = [grid[i][j], grid[i+1][j], grid[i+1][j+1], grid[i][j+1]]
      const colors = [shades[i][j],shades[i+1][j],shades[i+1][j+1],shades[i][j+1]]
      faces.push({
        points: quad.map(p => { const scale=1000/(1000-p[2]); return {x:220+(p[0]-220)*scale,y:220+(p[1]-220)*scale} }),
        depth: quad.reduce((sum,p)=>sum+p[2]/4,0), color: `rgb(${colors[0].join(',')})`, colors, depths: quad.map(p=>p[2]),
      })
    }
  }
  return faces.sort((a,b)=>a.depth-b.depth)
}
