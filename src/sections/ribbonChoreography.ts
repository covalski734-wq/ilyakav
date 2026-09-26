export type RibbonPoint = { x: number; y: number }
export type RibbonEdges = { left: RibbonPoint[]; right: RibbonPoint[] }
export type RibbonBand = RibbonEdges & { u: number[] }
// Match each contour by its actual two edges and end caps. Arbitrary perimeter
// matching was what inverted the old mesh and produced shredded triangles.
export const ribbonEdgePaths = [
  ['M28 47 Q8 61 8 83 L8 135 Q8 158 29 146', 'M86 10 Q106 -3 106 17 L106 78 Q106 96 91 106'],
  ['M25 172 Q8 183 8 201 L8 363 Q8 391 32 400', 'M86 140 Q106 128 106 151 L106 411 Q106 428 88 422'],
  ['M178 288 Q151 315 169 333 L265 405 Q279 420 298 420', 'M239 219 L425 405 Q439 420 421 420'],
  ['M309 43 Q285 43 269 59 L145 183 Q132 196 132 213 L132 276 Q132 296 143 307', 'M428 43 L180 290 Q153 316 169 333'],
] as const
const TAU = Math.PI * 2
const lerp = (a: number,b: number,p: number)=>a+(b-a)*p
const ease = (p: number)=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t)}
const angle=(a:RibbonPoint,b:RibbonPoint)=>Math.atan2(b.y-a.y,b.x-a.x)
const near=(a:number,b:number)=>{while(a-b>Math.PI)a-=TAU;while(a-b< -Math.PI)a+=TAU;return a}
const order=[0,1,3,2]
const cuts=[0,.12,.39,.68,1]

function spiral(u:number,time:number):RibbonPoint {
  // An asymmetric, continuously travelling ribbon, rather than concentric rings.
  const t=.25+u*TAU+time*.35
  const wave=time-u*TAU
  const radius=125+57*Math.cos(3*t)+16*Math.cos(t+.8)
  const x=radius*Math.cos(2*t)+9*Math.sin(wave)
  const y=radius*Math.sin(2*t)+9*Math.cos(wave+.6)
  const tilt=-.5+.035*Math.sin(time)
  return {
    x:210+x*Math.cos(tilt)-y*Math.sin(tilt),
    y:210+x*Math.sin(tilt)+y*Math.cos(tilt),
  }
}

const width=(u:number,time:number)=>32*(.3+.7*Math.sqrt(.08+Math.cos(u*TAU*2+.25+.15*Math.sin(time))**2)/Math.sqrt(1.08))
const outline=(left:RibbonPoint[],right:RibbonPoint[])=>'M'+[...left,...right.slice().reverse()].map(point=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`).join('L')+'Z'

export function idleRibbonPath(time:number):string {
  const left:RibbonPoint[]=[],right:RibbonPoint[]=[]
  for(let j=0;j<=640;j++){
    const u=j/640,c=spiral(u,time)
    const normal=angle(spiral(u-.0001,time),spiral(u+.0001,time))-Math.PI/2
    const dx=Math.cos(normal)*width(u,time),dy=Math.sin(normal)*width(u,time)
    left.push({x:c.x-dx,y:c.y-dy});right.push({x:c.x+dx,y:c.y+dy})
  }
  return outline(left,right)
}

export function ribbonBands(edges:RibbonEdges[],progress:number,time:number):RibbonBand[] {
  return edges.map((edge,part)=>{
    const index=order.indexOf(part), count=edge.left.length
    const p=ease((progress-.025*index)/(.96-.025*index))
    const from:Array<RibbonPoint>=[], to:Array<RibbonPoint>=[]
    for(let j=0;j<count;j++) {
      from.push(spiral(lerp(cuts[index],cuts[index+1],j/(count-1)),time))
      to.push({x:(edge.left[j].x+edge.right[j].x)/2,y:(edge.left[j].y+edge.right[j].y)/2})
    }
    const middle=(points:RibbonPoint[])=>points.reduce((sum,a)=>({x:sum.x+a.x/count,y:sum.y+a.y/count}),{x:0,y:0})
    const a=middle(from),b=middle(to)
    const first=angle(from[0],from[count-1]),last=near(angle(to[0],to[count-1]),first)
    const rotation=(last-first)*ease(Math.min(1,p*1.6))
    const straighten=ease(Math.max(0,(p-.12)/.88))
    const centers=from.map((point,j)=>{
      const x=point.x-a.x,y=point.y-a.y
      return {
        x:lerp(a.x,b.x,p)+lerp(x*Math.cos(rotation)-y*Math.sin(rotation),to[j].x-b.x,straighten),
        y:lerp(a.y,b.y,p)+lerp(x*Math.sin(rotation)+y*Math.cos(rotation),to[j].y-b.y,straighten),
      }
    })
    const heading=(points:RibbonPoint[],j:number)=>angle(points[Math.max(0,j-1)],points[Math.min(count-1,j+1)])
    const left:RibbonPoint[]=[],right:RibbonPoint[]=[],parameters:number[]=[]
    for(let j=0;j<count;j++){
      const u=lerp(cuts[index],cuts[index+1],j/(count-1))
      parameters.push(u)
      const sourceWidth=width(u,time)
      const sourceHeading=angle(spiral(u-.0001,time),spiral(u+.0001,time))+rotation
      const normal=lerp(sourceHeading,near(heading(centers,j),sourceHeading),straighten)-Math.PI/2
      const targetX=(edge.right[j].x-edge.left[j].x)/2
      const targetY=(edge.right[j].y-edge.left[j].y)/2
      const materialAngle=lerp(normal,near(Math.atan2(targetY,targetX),normal),straighten)
      const materialWidth=lerp(sourceWidth,Math.hypot(targetX,targetY),straighten)
      const dx=Math.cos(materialAngle)*materialWidth
      const dy=Math.sin(materialAngle)*materialWidth
      left.push({x:centers[j].x-dx,y:centers[j].y-dy})
      right.push({x:centers[j].x+dx,y:centers[j].y+dy})
    }
    return {left,right,u:parameters}
  })
}

export function choreographRibbon(edges:RibbonEdges[],progress:number,time:number):string[] {
  return ribbonBands(edges,progress,time).map(band=>outline(band.left,band.right))
}


