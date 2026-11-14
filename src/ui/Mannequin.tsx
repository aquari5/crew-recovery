import { useEffect, useRef } from 'react'

/**
 * A smooth 3D mannequin drawn entirely by a fragment shader (no model file, no
 * 3D library). The body is a signed distance field: a handful of rounded
 * shapes blended into one surface and found by ray marching. The camera is
 * orthographic, so a point on the body maps to the SVG overlay with the plain
 * arithmetic in `project()`.
 */

/** SVG user units per metre, and where the body's centre sits in the SVG. */
export const SCALE = 238
export const CENTER = { x: 160, y: 256, worldY: 0.9 }

export type Vec3 = [number, number, number]

/** Where a point on the body appears in SVG coordinates for a given turn of the camera. */
export function project(p: Vec3, yaw: number): { x: number; y: number } {
  return {
    x: CENTER.x + SCALE * (p[0] * Math.cos(yaw) - p[2] * Math.sin(yaw)),
    y: CENTER.y - SCALE * (p[1] - CENTER.worldY),
  }
}

export interface Glow {
  at: Vec3
  /** Linear RGB 0-1. */
  color: Vec3
  /** 0 = off, 1 = full tint. */
  strength: number
}

const MAX_GLOWS = 8

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec4 uView;   // SVG viewBox: x, y, width, height
uniform float uYaw;
uniform vec3 uGlowAt[${MAX_GLOWS}];
uniform vec4 uGlow[${MAX_GLOWS}];

float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float ellipsoid(vec3 p, vec3 r){
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}
// Capsule whose radius changes from r1 at a to r2 at b.
float cone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a;
  float l2 = dot(ba, ba);
  float rr = r1 - r2;
  float a2 = l2 - rr * rr;
  float il2 = 1.0 / l2;
  vec3 pa = p - a;
  float y = dot(pa, ba);
  float z = y - l2;
  vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv);
  float y2 = y * y * l2;
  float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

float body(vec3 p){
  p.x = abs(p.x);
  // head and neck
  float d = ellipsoid(p - vec3(0.0, 1.665, 0.005), vec3(0.092, 0.118, 0.104));
  d = smin(d, ellipsoid(p - vec3(0.0, 1.60, 0.03), vec3(0.07, 0.07, 0.075)), 0.03);
  d = smin(d, cone(p, vec3(0.0, 1.47, -0.01), vec3(0.0, 1.58, 0.0), 0.058, 0.05), 0.03);
  // torso
  float t = ellipsoid(p - vec3(0.0, 1.31, 0.0), vec3(0.185, 0.17, 0.112));
  t = smin(t, ellipsoid(p - vec3(0.085, 1.34, 0.055), vec3(0.095, 0.075, 0.06)), 0.05);
  t = smin(t, ellipsoid(p - vec3(0.0, 1.10, 0.0), vec3(0.14, 0.15, 0.092)), 0.09);
  t = smin(t, ellipsoid(p - vec3(0.0, 0.955, -0.005), vec3(0.168, 0.115, 0.105)), 0.08);
  t = smin(t, cone(p, vec3(0.06, 1.455, -0.01), vec3(0.2, 1.425, -0.01), 0.05, 0.07), 0.06);
  d = smin(d, t, 0.045);
  // arm
  float a = cone(p, vec3(0.215, 1.42, -0.01), vec3(0.285, 1.15, -0.01), 0.058, 0.044);
  a = smin(a, cone(p, vec3(0.285, 1.15, -0.01), vec3(0.345, 0.905, 0.03), 0.044, 0.03), 0.03);
  a = smin(a, ellipsoid(p - vec3(0.362, 0.82, 0.045), vec3(0.027, 0.075, 0.04)), 0.03);
  d = smin(d, a, 0.035);
  // leg
  float l = cone(p, vec3(0.092, 0.90, 0.0), vec3(0.102, 0.52, 0.005), 0.088, 0.058);
  l = smin(l, cone(p, vec3(0.102, 0.52, 0.005), vec3(0.108, 0.36, -0.012), 0.056, 0.058), 0.03);
  l = smin(l, cone(p, vec3(0.108, 0.36, -0.012), vec3(0.112, 0.085, 0.0), 0.058, 0.036), 0.03);
  l = smin(l, cone(p, vec3(0.112, 0.045, -0.02), vec3(0.122, 0.032, 0.125), 0.042, 0.03), 0.035);
  d = smin(d, l, 0.05);
  return d;
}

vec3 normal(vec3 p){
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    body(p + e.xyy) - body(p - e.xyy),
    body(p + e.yxy) - body(p - e.yxy),
    body(p + e.yyx) - body(p - e.yyx)));
}

void main(){
  vec2 f = gl_FragCoord.xy / uRes;
  float sx = uView.x + f.x * uView.z;
  float sy = uView.y + (1.0 - f.y) * uView.w;
  float wx = (sx - ${CENTER.x}.0) / ${SCALE}.0;
  float wy = ${CENTER.worldY} - (sy - ${CENTER.y}.0) / ${SCALE}.0;
  float px = uView.w / ${SCALE}.0 / uRes.y;

  // Cheap reject: nothing of the body is out here.
  if (abs(wx) > 0.52 || wy < -0.03 || wy > 1.83) { gl_FragColor = vec4(0.0); return; }

  float c = cos(uYaw), s = sin(uYaw);
  vec3 right = vec3(c, 0.0, -s);
  vec3 fwd = vec3(-s, 0.0, -c);
  vec3 ro = right * wx + vec3(0.0, wy, 0.0) - fwd * 1.2;

  float t = 0.6, nearest = 1.0;
  bool hit = false;
  for (int i = 0; i < 56; i++) {
    float d = body(ro + fwd * t);
    nearest = min(nearest, d);
    if (d < 0.0006) { hit = true; break; }
    t += d;
    if (t > 1.8) break;
  }
  float alpha = hit ? 1.0 : 1.0 - smoothstep(0.0, px * 1.6, nearest);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }

  vec3 p = ro + fwd * (hit ? t : t - nearest);
  vec3 n = normal(p);
  // Light travels with the camera: key from upper left, soft fill from the right.
  vec3 key = normalize(-right * 0.55 + vec3(0.0, 0.75, 0.0) - fwd * 0.75);
  vec3 fill = normalize(right * 0.8 + vec3(0.0, 0.1, 0.0) - fwd * 0.4);
  float kd = clamp(dot(n, key) * 0.6 + 0.4, 0.0, 1.0);
  float fd = clamp(dot(n, fill), 0.0, 1.0);
  float ao = clamp(0.5 + 0.5 * (body(p + n * 0.05) / 0.05), 0.0, 1.0);
  ao *= clamp(0.5 + 0.5 * (body(p + n * 0.14) / 0.14), 0.0, 1.0) * 0.5 + 0.5;
  float rim = pow(1.0 - clamp(dot(n, -fwd), 0.0, 1.0), 2.6);

  vec3 shade = vec3(0.52, 0.60, 0.78);
  vec3 lit = vec3(0.985, 0.99, 1.0);
  vec3 col = mix(shade, lit, kd * kd * (0.55 + 0.45 * ao));
  col += fd * 0.06;
  col = mix(col, vec3(0.36, 0.52, 0.98), rim * 0.62);

  // Regions that need attention tint the surface around them.
  for (int i = 0; i < ${MAX_GLOWS}; i++) {
    vec3 q = p - uGlowAt[i];
    float w = uGlow[i].a * exp(-dot(q, q) / 0.012);
    vec3 tint = uGlow[i].rgb * (0.62 + 0.5 * kd) + rim * 0.25;
    col = mix(col, tint, clamp(w, 0.0, 0.9));
  }
  gl_FragColor = vec4(col * alpha, alpha);
}
`

interface Props {
  /** The SVG viewBox the canvas sits behind: x, y, width, height. */
  view: [number, number, number, number]
  glows: Glow[]
  /** Called on every drawn frame with the camera turn, so overlays can follow. */
  onFrame?: (yaw: number) => void
  /** False keeps the figure still (reduced motion). */
  animate: boolean
  onUnsupported?: () => void
}

export default function Mannequin({ view, glows, onFrame, animate, onUnsupported }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The latest props, read inside the render loop without restarting it.
  const live = useRef({ glows, onFrame, animate })
  live.current = { glows, onFrame, animate }
  const [vx, vy, vw, vh] = view

  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false })
    if (!gl) {
      console.warn('Mannequin: WebGL is not available')
      onUnsupported?.()
      return
    }
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.warn('Mannequin shader:', gl.getShaderInfoLog(shader))
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Mannequin program:', gl.getProgramInfoLog(program))
      onUnsupported?.()
      return
    }
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const attr = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(attr)
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0)
    const u = (name: string) => gl.getUniformLocation(program, name)
    const uRes = u('uRes')
    const uYaw = u('uYaw')
    gl.uniform4f(u('uView'), vx, vy, vw, vh)

    let frame = 0
    let visible = true
    let pointer = 0 // -1..1 across the canvas, eased
    let pointerTarget = 0
    let lastKey = ''
    const start = performance.now()

    const draw = (now: number) => {
      frame = 0
      const { glows, onFrame, animate } = live.current
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(rect.width * ratio))
      const h = Math.max(1, Math.round(rect.height * ratio))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
        lastKey = ''
      }
      pointer += (pointerTarget - pointer) * 0.08
      const yaw = animate ? 0.3 * Math.sin((now - start) / 2600) + 0.35 * pointer : 0
      const key = `${yaw.toFixed(4)}|${glows.map((g) => g.strength.toFixed(2) + g.color.join()).join()}`
      if (key !== lastKey) {
        lastKey = key
        gl.uniform2f(uRes, w, h)
        gl.uniform1f(uYaw, yaw)
        for (let i = 0; i < MAX_GLOWS; i++) {
          const g = glows[i]
          gl.uniform3fv(u(`uGlowAt[${i}]`), g ? g.at : [0, 0, 0])
          gl.uniform4f(u(`uGlow[${i}]`), g?.color[0] ?? 0, g?.color[1] ?? 0, g?.color[2] ?? 0, g?.strength ?? 0)
        }
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        onFrame?.(yaw)
      }
      if (visible) frame = requestAnimationFrame(draw)
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !frame) frame = requestAnimationFrame(draw)
    })
    observer.observe(canvas)
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointerTarget = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1))
    }
    const onLeave = () => (pointerTarget = 0)
    const stage = canvas.parentElement!
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerleave', onLeave)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
    }
    // The loop reads changing props through `live`; it only restarts if the view changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [vx, vy, vw, vh])

  return <canvas ref={canvasRef} className="mannequin" aria-hidden="true" />
}
