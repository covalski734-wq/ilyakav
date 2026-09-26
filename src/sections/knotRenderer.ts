import { knotFaces, type KnotPoint } from './knotGeometry'

// Small dedicated renderer. Smooth vertex lighting and a depth buffer avoid
// the striped SVG seams and incorrect overlaps of the earlier ribbon.
export function createKnotRenderer(canvas: HTMLCanvasElement, contours: KnotPoint[][]) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
  if (!gl) return null
  const shaders: WebGLShader[] = []
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    shaders.push(shader)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Knot shader compilation failed')
    return shader
  }
  const program = gl.createProgram()!
  let buffer: WebGLBuffer | null = null
  const dispose = () => { if (buffer) gl.deleteBuffer(buffer); gl.deleteProgram(program); shaders.forEach(shader=>gl.deleteShader(shader)) }
  try {
    gl.attachShader(program, compile(gl.VERTEX_SHADER, `
      attribute vec3 aPosition;
      attribute vec3 aColor;
      varying vec3 vColor;
      void main() {
        gl_Position = vec4((aPosition.x + 90.0) / 310.0 - 1.0, 1.0 - (aPosition.y + 80.0) / 310.0, -aPosition.z / 600.0, 1.0);
        vColor = aColor;
      }
    `))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec3 vColor;
      void main() { gl_FragColor = vec4(vColor, 1.0); }
    `))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Knot shader linking failed')
    gl.useProgram(program)
    buffer=gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer)
    const position=gl.getAttribLocation(program,'aPosition'), color=gl.getAttribLocation(program,'aColor')
    gl.enableVertexAttribArray(position); gl.enableVertexAttribArray(color)
    gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0)
    gl.vertexAttribPointer(color,3,gl.FLOAT,false,24,12)
    gl.enable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    let data = new Float32Array(0)
    return {
      draw(progress: number, flow = 0) {
        const compact=window.innerWidth<=760
        const faces=knotFaces(contours,progress,compact?40:64,6,flow)
        const length=faces.length*36
        if(data.length!==length) data=new Float32Array(length)
        let offset=0
        for(const face of faces) for(const index of [0,1,2,0,2,3]) {
          data[offset++]=face.points[index].x
          data[offset++]=face.points[index].y
          data[offset++]=face.depths[index]
          for(const value of face.colors[index]) data[offset++]=value/255
        }
        const size=Math.max(1,Math.round(canvas.clientWidth*Math.min(window.devicePixelRatio||1,1.75)))
        if(canvas.width!==size || canvas.height!==size){canvas.width=size;canvas.height=size}
        gl.viewport(0,0,size,size)
        gl.clearColor(0,0,0,0)
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
        gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW)
        gl.drawArrays(gl.TRIANGLES,0,data.length/6)
      },
      dispose,
    }
  } catch {
    dispose()
    return null
  }
}
