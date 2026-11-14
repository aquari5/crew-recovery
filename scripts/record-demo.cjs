// Records docs/demo.mp4. Not part of the app: run the dev server on port 5183,
// then in a scratch folder `npm i playwright-core ffmpeg-static` and
// `node record-demo.cjs out.mp4` (uses the installed Google Chrome).
//
// Demo film. The real app runs in a window on a dark stage; a
// camera zooms into it, a drawn cursor clicks, captions animate word by word.
// Everything is slowed down SLOW times while frames are grabbed, then played
// back at normal speed, so the result is smooth at any resolution.
const { chromium } = require('playwright-core')
const ffmpeg = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const APP = 'http://localhost:5183'
const OUT = process.argv[2] || path.join(__dirname, 'demo2.mp4')
const FRAMES = path.join(__dirname, 'frames2')
const SLOW = Number(process.env.SLOW || 5)
const DSF = Number(process.env.DSF || 2)
const END = 29.6

const STAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:G;src:url(/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2) format('woff2');font-weight:100 900}
@font-face{font-family:GM;src:url(/node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:#04070e;font-family:G,system-ui,sans-serif;color:#fff}
#bg{position:fixed;inset:-10%;background:
  radial-gradient(1100px 700px at 18% 8%,rgba(40,90,235,.42),transparent 62%),
  radial-gradient(900px 640px at 92% 96%,rgba(125,70,235,.26),transparent 62%),
  radial-gradient(700px 500px at 70% 10%,rgba(20,170,160,.14),transparent 60%)}
#win{position:fixed;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;border-radius:16px;overflow:hidden;opacity:0;
  box-shadow:0 0 0 1px rgba(255,255,255,.10),0 50px 140px rgba(0,0,0,.65),0 0 120px rgba(50,100,255,.18);background:#f3f5f8}
#win iframe{width:1280px;height:720px;border:0;display:block}
#scrim{position:fixed;left:0;right:0;bottom:0;height:300px;background:linear-gradient(180deg,rgba(4,7,14,0),rgba(4,7,14,.86) 52%,#04070e);pointer-events:none}
#cap{position:fixed;left:0;right:0;bottom:64px;text-align:center;font-weight:600;font-size:54px;line-height:1.12;letter-spacing:-.035em;padding:0 160px;text-wrap:balance;pointer-events:none}
#cap .w,#card .w{display:inline-block;white-space:pre;opacity:0;transform:translateY(22px);filter:blur(8px);animation:rise .5s cubic-bezier(.23,1,.32,1) forwards}
#cap.out .w{animation:fall .22s ease-in forwards}
.hi{background:linear-gradient(90deg,#8fb4ff,#a8f3ff);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes rise{to{opacity:1;transform:none;filter:none}}
@keyframes fall{from{opacity:1;transform:none;filter:none}to{opacity:0;transform:translateY(-10px);filter:blur(6px)}}
#card{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;text-align:center;pointer-events:none;transition:opacity .35s ease}
#card .big{font-weight:600;font-size:104px;line-height:1.02;letter-spacing:-.045em;max-width:1500px;text-wrap:balance}
#card .mark{font-family:GM,monospace;font-size:24px;letter-spacing:.42em;font-weight:600;color:rgba(255,255,255,.72)}
#card .sub{font-size:34px;letter-spacing:-.02em;color:rgba(255,255,255,.66);font-weight:450}
#card .url{font-family:GM,monospace;font-size:20px;letter-spacing:.06em;color:rgba(255,255,255,.5)}
#cur{position:fixed;left:0;top:0;width:44px;height:44px;margin:-4px 0 0 -6px;pointer-events:none;opacity:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45));transform-origin:8px 6px}
#rip{position:fixed;left:0;top:0;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:3px solid rgba(255,255,255,.95);box-shadow:0 0 0 2px rgba(60,110,255,.6);opacity:0;pointer-events:none}
#rip.go{animation:rip .55s cubic-bezier(.23,1,.32,1)}
@keyframes rip{from{opacity:.95;transform:translate(var(--x),var(--y)) scale(.25)}to{opacity:0;transform:translate(var(--x),var(--y)) scale(1.25)}}
#wm{position:fixed;right:28px;bottom:18px;font-family:GM,monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.42)}
</style></head><body>
<div id="bg"></div>
<div id="win"><iframe src="/"></iframe></div>
<div id="scrim"></div>
<svg id="cur" viewBox="0 0 24 24"><path d="M5 3l14 8.2-6.2 1.5 3.6 7-2.7 1.4-3.6-7L5 18.6z" fill="#0b1020" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
<div id="rip"></div>
<div id="card"></div>
<div id="cap"></div>
<div id="wm">Live capture of the app · edited with AI assistance</div>
<script>
const $ = (id) => document.getElementById(id)
const ease = (t) => (t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2)
const out = (t) => 1 - Math.pow(1 - t, 4)
function tween(ms, fn, e = ease) {
  return new Promise((done) => {
    const t0 = performance.now()
    const tick = (now) => { const t = Math.min(1, (now - t0)/ms); fn(e(t)); t < 1 ? requestAnimationFrame(tick) : done() }
    requestAnimationFrame(tick)
  })
}
const words = (text, step = 55) => {
  let i = 0
  return text.split(/(\\*[^*]+\\*|\\n)/).map((part) => {
    if (part === '\\n') return '<br>'
    const hi = part.startsWith('*')
    return (hi ? part.slice(1, -1) : part).split(/(?<= )/).filter(Boolean)
      .map((w) => '<span class="w' + (hi ? ' hi' : '') + '" style="animation-delay:' + (i++ * step) + 'ms">' + w + '</span>').join('')
  }).join('')
}
const S = window.S = {
  cx: 960, cy: 440,
  camState: { x: 640, y: 360, s: 1.16 },
  apply(c, opacity, lift = 0) {
    const w = $('win')
    w.style.transform = 'translate(' + (S.cx - c.x*c.s) + 'px,' + (S.cy - c.y*c.s + lift) + 'px) scale(' + c.s + ')'
    if (opacity != null) w.style.opacity = opacity
  },
  cam(x, y, s, ms = 900) {
    const a = { ...S.camState }, b = { x, y, s }
    S.camState = b
    return tween(ms, (t) => S.apply({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t, s: a.s + (b.s-a.s)*t }))
  },
  winIn(ms = 1000) { const c = S.camState; return tween(ms, (t) => S.apply({ ...c, s: c.s*(.9 + .1*t) }, t, 90*(1-t)), out) },
  winOut(ms = 600) { const c = S.camState; return tween(ms, (t) => S.apply({ ...c, s: c.s*(1 - .08*t) }, 1 - t, 40*t)) },
  cap(text) {
    const el = $('cap')
    if (!el.innerHTML) { el.className = ''; el.innerHTML = text ? words(text) : ''; return }
    el.className = 'out'
    setTimeout(() => { el.className = ''; el.innerHTML = text ? words(text) : '' }, 200)
  },
  card(html) {
    const el = $('card')
    if (!html) { el.style.opacity = 0; return }
    el.innerHTML = html.replace(/\\{\\{(.*?)\\}\\}/gs, (_, t) => words(t, 70))
    el.style.opacity = 1
  },
  pos: { x: 1250, y: 760 },
  place(x, y) { S.pos = { x, y }; $('cur').style.transform = 'translate(' + x + 'px,' + y + 'px)' },
  cursor(x, y, ms = 650) {
    const a = { ...S.pos }
    $('cur').style.opacity = 1
    const bend = Math.min(60, Math.hypot(x-a.x, y-a.y)*.12)
    return tween(ms, (t) => { const arc = Math.sin(t*Math.PI)*bend; S.place(a.x + (x-a.x)*t, a.y + (y-a.y)*t - arc) })
  },
  hideCursor() { $('cur').style.opacity = 0 },
  click() {
    const r = $('rip'), c = $('cur')
    r.style.setProperty('--x', S.pos.x + 'px'); r.style.setProperty('--y', S.pos.y + 'px')
    r.classList.remove('go'); void r.offsetWidth; r.classList.add('go')
    c.animate([{ scale: 1 }, { scale: .82 }, { scale: 1 }], { duration: 260, easing: 'ease-out' })
  },
}
S.apply(S.camState, 0)
S.place(S.pos.x, S.pos.y)
</script></body></html>`

// Slows every JavaScript clock in the page; CSS animations are slowed through DevTools.
const SLOW_CLOCK = `(() => { const K = ${SLOW}; const now = performance.now.bind(performance); const t0 = now();
  performance.now = () => t0 + (now() - t0) / K;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf(() => cb(performance.now()));
  const st = window.setTimeout.bind(window); window.setTimeout = (fn, ms = 0, ...a) => st(fn, ms * K, ...a);
  const si = window.setInterval.bind(window); window.setInterval = (fn, ms = 0, ...a) => si(fn, ms * K, ...a);
})()`

const real = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true })
  fs.mkdirSync(FRAMES)
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'] })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: DSF })
  page.setDefaultTimeout(8000)
  await page.addInitScript(SLOW_CLOCK)
  await page.route(`${APP}/__stage`, (route) => route.fulfill({ contentType: 'text/html', body: STAGE }))
  await page.goto(`${APP}/__stage`)
  const app = page.frames().find((f) => f !== page.mainFrame()) || (await page.waitForEvent('frameattached'))
  await app.waitForSelector('.dock')
  await page.evaluate(() => document.fonts.ready)
  await app.evaluate(() => document.fonts.ready)
  await app.addStyleTag({ content: 'html{scrollbar-width:none} ::-webkit-scrollbar{display:none}' })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Animation.enable')
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW })

  const S = (fn, ...args) => page.evaluate(([f, a]) => window.S[f](...a), [fn, args])
  let day = 120
  const setDay = async (d) => {
    await app.evaluate((x) => {
      const input = document.querySelector('.strip input')
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(x))
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, d)
    day = d
  }
  const scrub = async (to, sec) => {
    const from = day
    const steps = Math.abs(to - from)
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      await setDay(Math.round(from + (to - from) * (1 - (1 - t) ** 3)))
      await real((sec * 1000 * SLOW) / steps)
    }
  }
  const scrollTo = (selector, ms, offset = 86) =>
    app.evaluate(
      ([sel, dur, off]) => {
        const scroller = document.scrollingElement
        const target = sel ? document.querySelector(sel).getBoundingClientRect().top + scroller.scrollTop - off : 0
        const start = scroller.scrollTop
        const t0 = performance.now()
        return new Promise((done) => {
          const tick = (now) => {
            const t = Math.min(1, (now - t0) / dur)
            scroller.scrollTop = start + (target - start) * (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
            t < 1 ? requestAnimationFrame(tick) : done()
          }
          requestAnimationFrame(tick)
        })
      },
      [selector, ms, offset],
    )
  const click = async (locator, ms = 600) => {
    // Position inside the app, mapped through the camera transform of the window.
    const r = await locator.evaluate((el) => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })
    const c = await page.evaluate(() => ({ ...window.S.camState, cx: window.S.cx, cy: window.S.cy }))
    const x = c.cx - c.x * c.s + r.x * c.s
    const y = c.cy - c.y * c.s + r.y * c.s
    await S('cursor', x, y, ms)
    await S('click')
    await locator.dispatchEvent('click')
  }

  await setDay(30)
  await real(1500)

  // ── Frame grabber ────────────────────────────────────────────────────────
  const stamps = []
  let recording = true
  const t0 = Date.now()
  const clock = () => (Date.now() - t0) / 1000 / SLOW // seconds of film
  const grabber = (async () => {
    let n = 0
    while (recording) {
      const at = clock()
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true })
      const name = `f${String(n++).padStart(5, '0')}.jpg`
      fs.writeFileSync(path.join(FRAMES, name), Buffer.from(data, 'base64'))
      stamps.push({ name, at })
    }
  })()
  const at = (sec) => real(Math.max(0, (sec - clock()) * 1000 * SLOW))
  const bg = (p) => p.catch((e) => console.error('step failed:', e.message))

  // 0.0  Cold open
  await S('card', '<div class="big">{{On the way to Mars,\na doctor is *20 minutes* away.}}</div>')
  await at(2.7)
  await S('card', null)
  await at(3.0)

  // 3.0  The product
  bg(S('winIn', 1000))
  await S('cap', '*Crew Recovery.* Health autonomy for deep space.')
  await at(5.6)

  // 5.6  One answer
  bg(S('cam', 500, 250, 1.5, 1000))
  await S('cap', 'Every morning, one answer:\n*am I fit for today?*')
  await at(8.3)

  // 8.3  Sleep debt, then fever
  bg(S('cam', 640, 360, 1.16, 800))
  await S('cap', 'It catches *sleep debt* building…')
  await at(8.7)
  await scrub(44, 0.9)
  await at(10.7)
  await S('cap', '…and the *fever* that follows.')
  await scrub(47, 0.4)
  await at(11.5)
  bg(S('cam', 520, 400, 1.42, 900))
  bg(scrollTo('.action-cards', 900, 150))
  await at(13.5)

  // 13.5  Solar storm and the report home
  bg(scrollTo(null, 500))
  bg(S('cam', 640, 360, 1.16, 700))
  await S('cap', 'Solar storm: *what to do, and who to tell.*')
  await scrub(78, 0.8)
  await at(15.5)
  await click(app.getByRole('button', { name: 'Ground report' }), 600)
  await at(16.4)
  bg(S('cam', 640, 350, 1.36, 900))
  await S('cap', 'One complete report to Earth.\n*Every question costs 40 minutes.*')
  await at(18.7)

  // 18.7  Body
  await click(app.getByRole('button', { name: 'Close report' }), 400)
  bg(S('cam', 640, 360, 1.16, 500))
  await click(app.getByRole('tab', { name: 'Body' }), 500)
  await S('cap', 'Every signal *explains itself.*')
  await at(19.9)
  bg(S('cam', 330, 330, 1.75, 1000))
  await at(20.9)
  await click(app.locator('.hotspot[aria-label^="Heart"] .hit'), 500)
  await at(21.4)
  bg(S('cam', 760, 380, 1.4, 900))
  await at(22.5)

  // 22.5  Patterns
  await S('hideCursor')
  await setDay(120)
  await app.getByRole('tab', { name: 'Trends' }).dispatchEvent('click')
  bg(S('cam', 640, 360, 1.34, 800))
  bg(scrollTo('#patterns-title', 900, 110))
  await S('cap', 'It learns what helps *you* recover.\nTested against *false patterns.*')
  await at(25.4)

  // 25.4  Outlook
  await app.getByRole('tab', { name: 'Today' }).dispatchEvent('click')
  bg(scrollTo('#outlook-title', 800, 150))
  bg(S('cam', 640, 340, 1.3, 800))
  await S('cap', 'And shows where the *slow risks* are heading.')
  await at(27.7)

  // 27.7  End card
  await S('cap', '')
  bg(S('winOut', 600))
  await at(28.0)
  await S('card', '<div class="mark">CREW RECOVERY</div><div class="big">{{No server.\n*No link to Earth* needed.}}</div><div class="url">github.com/aquari5/crew-recovery</div>')
  await at(END + 0.2)

  recording = false
  await grabber
  await browser.close()

  const kept = stamps.filter((s) => s.at < END)
  const list = kept.map((s, i) => `file '${path.join(FRAMES, s.name)}'\nduration ${((kept[i + 1]?.at ?? END) - s.at).toFixed(5)}`).join('\n')
  fs.writeFileSync(path.join(__dirname, 'list2.txt'), `${list}\nfile '${path.join(FRAMES, kept[kept.length - 1].name)}'\n`)
  execFileSync(
    ffmpeg,
    ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(__dirname, 'list2.txt'), '-vf', 'fps=60,scale=1920:1080:flags=lanczos,format=yuv420p', '-t', String(END), '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-movflags', '+faststart', OUT],
    { stdio: 'ignore' },
  )
  console.log(`frames ${kept.length}, film fps ${(kept.length / END).toFixed(1)}, wrote ${OUT}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
