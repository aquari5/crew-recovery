// Records the two films: the 30-second demo (public/demo.mp4) and the in-app
// walk-through (public/tour.mp4). Not part of the app. Run the dev server on
// port 5183, then in a scratch folder `npm i playwright-core ffmpeg-static` and
//   node record-demo.cjs demo out.mp4
//   node record-demo.cjs tour out.mp4
// (uses the installed Google Chrome).
//
// The real app runs in a window on a dark stage; a camera zooms into it, a
// drawn cursor clicks, captions animate word by word. Everything is slowed down
// SLOW times while frames are grabbed, then played back at normal speed, so the
// result is smooth at any resolution.
const { chromium } = require('playwright-core')
const ffmpeg = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const APP = 'http://localhost:5183'
const FILM = process.argv[2] === 'tour' ? 'tour' : 'demo'
const OUT = process.argv[3] || path.join(process.cwd(), `${FILM}.mp4`)
const FRAMES = path.join(process.cwd(), `frames-${FILM}`)
const SLOW = Number(process.env.SLOW || 6)
const END = FILM === 'tour' ? 38.4 : 29.6

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
#cap{position:fixed;left:0;right:0;bottom:64px;height:0;pointer-events:none}
#cap .line{position:absolute;left:0;right:0;bottom:0;text-align:center;font-weight:600;font-size:54px;line-height:1.12;letter-spacing:-.035em;padding:0 160px;text-wrap:balance;
  transition:opacity .45s ease,transform .45s cubic-bezier(.4,0,.2,1),filter .45s ease}
#cap .line.leave{opacity:0;transform:translateY(-14px);filter:blur(8px)}
#cap .w,#card .w{display:inline-block;white-space:pre;opacity:0;transform:translateY(16px);filter:blur(7px);animation:rise .8s cubic-bezier(.16,1,.3,1) forwards}
.hi{background:linear-gradient(90deg,#8fb4ff,#a8f3ff);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes rise{to{opacity:1;transform:none;filter:none}}
#card{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;text-align:center;pointer-events:none;transition:opacity .35s ease}
#card .big{font-weight:600;font-size:104px;line-height:1.02;letter-spacing:-.045em;max-width:1500px;text-wrap:balance}
#card .mark{font-family:GM,monospace;font-size:24px;letter-spacing:.42em;font-weight:600;color:rgba(255,255,255,.72)}
#card .sub{font-size:34px;letter-spacing:-.02em;color:rgba(255,255,255,.66);font-weight:450}
#card .url{font-family:GM,monospace;font-size:20px;letter-spacing:.06em;color:rgba(255,255,255,.5)}
#cur{position:fixed;left:0;top:0;width:44px;height:44px;margin:-4px 0 0 -6px;pointer-events:none;opacity:0;transition:opacity .35s ease;will-change:transform;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}
#cur svg{display:block;width:44px;height:44px;transform-origin:10px 6px}
#rip{position:fixed;left:0;top:0;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:3px solid rgba(255,255,255,.95);box-shadow:0 0 0 2px rgba(60,110,255,.6);opacity:0;pointer-events:none}
#rip.go{animation:rip .55s cubic-bezier(.23,1,.32,1)}
@keyframes rip{from{opacity:.95;transform:translate(var(--x),var(--y)) scale(.25)}to{opacity:0;transform:translate(var(--x),var(--y)) scale(1.25)}}
</style></head><body>
<div id="bg"></div>
<div id="win"><iframe src="/"></iframe></div>
<div id="scrim"></div>
<div id="cur"><svg viewBox="0 0 24 24"><path d="M5 3l14 8.2-6.2 1.5 3.6 7-2.7 1.4-3.6-7L5 18.6z" fill="#0b1020" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>
<div id="rip"></div>
<div id="card"></div>
<div id="cap"></div>
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
const words = (text, step = 42, start = 0) => {
  let i = 0
  return text.split(/(\\*[^*]+\\*|\\n)/).map((part) => {
    if (part === '\\n') return '<br>'
    const hi = part.startsWith('*')
    return (hi ? part.slice(1, -1) : part).split(/(?<= )/).filter(Boolean)
      .map((w) => '<span class="w' + (hi ? ' hi' : '') + '" style="animation-delay:' + (start + i++ * step) + 'ms">' + w + '</span>').join('')
  }).join('')
}
const S = window.S = {
  cx: 960, cy: 440,
  camState: { x: 640, y: 360, s: 1.16 },
  now: { x: 640, y: 360, s: 1.16, lift: 0 },
  apply(c, opacity, lift = 0) {
    const w = $('win')
    S.now = { ...c, lift }
    w.style.transform = 'translate(' + (S.cx - c.x*c.s) + 'px,' + (S.cy - c.y*c.s + lift) + 'px) scale(' + c.s + ')'
    if (opacity != null) w.style.opacity = opacity
    S.drawCursor()
  },
  cam(x, y, s, ms = 900) {
    const a = { ...S.now }, b = { x, y, s }
    S.camState = b
    return tween(ms, (t) => S.apply({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t, s: a.s + (b.s-a.s)*t }))
  },
  winIn(ms = 1000) { const c = S.camState; return tween(ms, (t) => S.apply({ ...c, s: c.s*(.9 + .1*t) }, t, 90*(1-t)), out) },
  winOut(ms = 600) { const c = S.camState; return tween(ms, (t) => S.apply({ ...c, s: c.s*(1 - .08*t) }, 1 - t, 40*t)) },
  // Captions cross over: the old line drifts up and out while the new one rises word by word.
  cap(text) {
    const el = $('cap')
    const had = el.children.length > 0
    for (const old of el.children) { old.classList.add('leave'); setTimeout(() => old.remove(), 520) }
    if (!text) return
    const line = document.createElement('div')
    line.className = 'line'
    line.innerHTML = words(text, 42, had ? 260 : 0)
    el.append(line)
  },
  card(html) {
    const el = $('card')
    if (!html) { el.style.opacity = 0; return }
    el.innerHTML = html.replace(/\\{\\{(.*?)\\}\\}/gs, (_, t) => words(t, 60))
    el.style.opacity = 1
  },
  // The cursor lives in the app's own coordinates, so it stays on the content while the camera moves.
  pos: { x: 900, y: 520 },
  drawCursor() {
    const c = S.now
    $('cur').style.transform = 'translate(' + (S.cx - c.x*c.s + S.pos.x*c.s) + 'px,' + (S.cy - c.y*c.s + c.lift + S.pos.y*c.s) + 'px)'
  },
  showCursor(x, y) { if (x != null) S.pos = { x, y }; S.drawCursor(); $('cur').style.opacity = 1 },
  hideCursor() { $('cur').style.opacity = 0 },
  cursor(x, y, ms) {
    const a = { ...S.pos }
    const dist = Math.hypot(x - a.x, y - a.y)
    const dur = ms ?? Math.max(600, Math.min(1400, 380 + dist * 1.5))
    const bend = Math.min(18, dist * .04)
    $('cur').style.opacity = 1
    return tween(dur, (t) => { S.pos = { x: a.x + (x-a.x)*t, y: a.y + (y-a.y)*t - Math.sin(t*Math.PI)*bend }; S.drawCursor() }, (t) => t*t*(3 - 2*t))
  },
  click() {
    const r = $('rip'), c = $('cur'), m = c.style.transform.match(/translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/)
    r.style.setProperty('--x', m[1] + 'px'); r.style.setProperty('--y', m[2] + 'px')
    r.classList.remove('go'); void r.offsetWidth; r.classList.add('go')
    // Scale the arrow inside its wrapper: scaling the wrapper would scale its translation too and make the cursor jump.
    c.firstElementChild.animate([{ transform: 'scale(1)' }, { transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' })
  },
}
S.apply(S.camState, 0)
// Samples where the arrow really is on screen, for checking the film for jumps.
window.__track = []
const sample = () => { const r = $('cur').firstElementChild.getBoundingClientRect(); window.__track.push({ t: performance.now(), x: r.x, y: r.y, o: +getComputedStyle($('cur')).opacity }); requestAnimationFrame(sample) }
requestAnimationFrame(sample)
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
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.setDefaultTimeout(8000)
  await page.addInitScript(SLOW_CLOCK)
  // Keep the first-visit guide closed while filming.
  await page.addInitScript(() => { try { localStorage.setItem('crew-recovery:guide-seen:v1', '1') } catch {} })
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
  /** Move the space weather replay to a minute of the storm. */
  const setReplay = (minute) =>
    app.evaluate((x) => {
      const input = document.querySelector('.sw-scrub input')
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(x))
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, minute)
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
  const scrollY = (y, ms) =>
    app.evaluate(
      ([target, dur]) => {
        const scroller = document.scrollingElement
        const start = scroller.scrollTop
        const t0 = performance.now()
        return new Promise((done) => {
          const tick = (now) => {
            const t = Math.min(1, (now - t0) / dur)
            scroller.scrollTop = start + (target - start) * (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
            t < 1 ? requestAnimationFrame(tick) : done()
          }
          requestAnimationFrame(tick)
        })
      },
      [y, ms],
    )
  /** Move the drawn cursor to an element of the app, then click it. */
  const click = async (locator, ms) => {
    const r = await locator.evaluate((el) => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })
    await S('cursor', r.x, r.y, ms ?? null)
    await S('click')
    await real(90 * SLOW)
    await locator.dispatchEvent('click')
  }
  const tab = (name) => app.getByRole('tab', { name })

  await setDay(FILM === 'tour' ? 120 : 30)
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

  if (FILM === 'demo') {
    // Scene times follow the recorded voice-over (see docs/SUBMISSION.md).
    // 0.0  Cold open
    await S('card', '<div class="mark">TEAM EZ AQLIMCZAK</div><div class="big">{{On the way to Mars,\na doctor is *20 minutes* away.}}</div>')
    await at(3.2)
    await S('card', null)
    await at(3.5)

    // 3.5  The product
    bg(S('winIn', 1000))
    await S('cap', '*Crew Recovery.* Health autonomy for deep space.')
    await at(6.9)

    // 6.9  One answer
    bg(S('cam', 500, 250, 1.5, 1100))
    await S('cap', 'Every morning, one answer:\n*am I fit for today?*')
    await at(11.0)

    // 11.0  Sleep debt, then fever
    bg(S('cam', 640, 360, 1.16, 800))
    await S('cap', 'It catches *sleep debt* building…')
    await at(11.3)
    await scrub(44, 0.9)
    await at(12.9)
    await S('cap', '…and the *fever* that follows.')
    await scrub(47, 0.4)
    await at(13.4)
    bg(S('cam', 520, 400, 1.42, 900))
    bg(scrollTo('.action-cards', 900, 150))
    await at(14.6)

    // 14.6  A real solar storm from NASA's records, then the report home
    await app.locator('.sw-mode').nth(1).dispatchEvent('click')
    await setReplay(50)
    bg(scrollTo('#weather-title', 800, 96))
    bg(S('cam', 640, 380, 1.3, 800))
    await S('cap', 'A real solar storm, from *NASA data:*\n*50 minutes* of warning.')
    await at(15.5)
    for (let minute = 55; minute <= 125; minute += 5) {
      await setReplay(minute)
      await real(95 * SLOW)
    }
    await at(17.0)
    await setDay(78)
    await scrollTo(null, 1)
    await app.getByRole('button', { name: 'Ground report' }).dispatchEvent('click')
    bg(S('cam', 640, 350, 1.36, 800))
    await S('cap', 'One complete report to Earth.\n*Every question costs 40 minutes.*')
    await at(19.4)

    // 19.4  Body
    await S('hideCursor')
    await app.getByRole('button', { name: 'Close report' }).dispatchEvent('click')
    await tab('Body').dispatchEvent('click')
    await S('cap', 'Every signal *explains itself.*')
    await S('cam', 330, 330, 1.75, 900)
    await S('showCursor', 300, 250)
    await click(app.locator('.hotspot[aria-label^="Heart"] .dot'), 600)
    await at(21.4)
    await S('hideCursor')
    bg(S('cam', 760, 380, 1.4, 700))
    await at(22.1)

    // 22.1  Patterns
    await setDay(120)
    await tab('Trends').dispatchEvent('click')
    bg(S('cam', 640, 360, 1.34, 800))
    bg(scrollTo('#patterns-title', 900, 110))
    await S('cap', 'It learns what helps *you* recover.\nTested against *false patterns.*')
    await at(23.9)

    // 23.9  Outlook
    await tab('Today').dispatchEvent('click')
    bg(scrollTo('#outlook-title', 800, 150))
    bg(S('cam', 640, 340, 1.3, 800))
    await S('cap', 'And shows where the *slow risks* are heading.')
    await at(26.1)

    // 26.1  End card
    await S('cap', '')
    bg(S('winOut', 500))
    await at(26.5)
    await S('card', '<div class="mark">CREW RECOVERY · TEAM EZ AQLIMCZAK</div><div class="big">{{No server.\n*No link to Earth* needed.}}</div><div class="url">github.com/aquari5/crew-recovery</div>')
    await at(END + 0.2)
  } else {
    // ── Walk-through shown in the app's first-visit guide ──────────────────
    bg(S('winIn', 900))
    await S('cap', '*Today.* Start here each morning.')
    await at(1.4)
    bg(S('cam', 500, 250, 1.5, 1100))
    await at(3.8)
    await S('cap', 'The cards say *what to do* — and who to involve.')
    bg(S('cam', 520, 400, 1.42, 1000))
    bg(scrollTo('.action-cards', 1000, 150))
    await at(7.4)

    await S('cap', '*Timeline.* Drag to revisit any mission day.')
    bg(scrollTo(null, 700))
    bg(S('cam', 640, 560, 1.5, 1000))
    await at(8.6)
    await scrub(78, 1.3)
    await at(10.4)
    await scrub(47, 0.9)
    await at(11.8)
    await S('cap', 'Or press *Story* for the key moments.')
    await S('showCursor', 900, 600)
    await click(app.getByRole('button', { name: 'Story', exact: true }))
    bg(S('cam', 640, 360, 1.16, 900))
    await at(14.8)

    await click(app.getByRole('button', { name: 'Close mission story' }))
    await setDay(120)
    await click(tab('Log'))
    await S('cap', '*Log.* Two minutes: how you feel, what you did, your measurements.')
    bg(S('cam', 640, 360, 1.3, 900))
    await at(16.6)
    bg(scrollY(1150, 3000))
    await at(19.8)
    await S('cap', 'Blood pressure has a *guided mode.*')
    const guided = app.getByRole('button', { name: /Guide me/ })
    await guided.evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await click(guided)
    await at(22.8)

    await click(app.getByRole('button', { name: 'Close guided measurement' }))
    await S('cam', 640, 360, 1.16, 600)
    await click(tab('Body'))
    await S('cap', '*Body.* Select a region to see its signals.')
    await at(24.4)
    await S('cam', 330, 330, 1.75, 900)
    await click(app.locator('.hotspot[aria-label^="Heart"] .dot'), 600)
    await at(26.2)
    await S('cam', 760, 380, 1.4, 800)
    await click(app.locator('.body-indicator summary', { hasText: 'How to measure' }).first())
    await at(28.6)

    await S('hideCursor')
    await tab('Trends').dispatchEvent('click')
    bg(S('cam', 640, 360, 1.34, 900))
    bg(scrollTo('#patterns-title', 1000, 110))
    await S('cap', '*Trends.* See what helps or hurts your recovery.')
    await at(32.2)

    await tab('Today').dispatchEvent('click')
    bg(S('cam', 640, 360, 1.16, 800))
    await S('cap', '*Ground report.* One button writes the message to Earth.')
    await at(33.0)
    await S('showCursor', 760, 420)
    await click(app.getByRole('button', { name: 'Ground report' }))
    bg(S('cam', 640, 350, 1.36, 1000))
    await at(36.6)
    await S('hideCursor')
    await S('cap', '')
    bg(S('winOut', 600))
    await at(37.0)
    await S('card', '<div class="mark">CREW RECOVERY</div><div class="big">{{You are *set.*}}</div>')
    await at(END + 0.2)
  }

  recording = false
  if (process.env.TRACK) {
    // Largest distance the visible cursor travelled between two animation frames, in stage pixels.
    const track = await page.evaluate(() => window.__track)
    let worst = { d: 0 }
    for (let i = 1; i < track.length; i++) {
      const a = track[i - 1], b = track[i]
      if (a.o < 0.5 || b.o < 0.5) continue
      const d = Math.hypot(b.x - a.x, b.y - a.y), dt = b.t - a.t
      if (d / Math.max(dt, 1) > (worst.v ?? 0)) worst = { d: Math.round(d), dt: Math.round(dt), v: d / Math.max(dt, 1), at: (b.t / 1000).toFixed(2) }
    }
    console.log('cursor samples', track.length, 'fastest step', JSON.stringify(worst))
  }
  await grabber
  await browser.close()

  const kept = stamps.filter((s) => s.at < END)
  const list = kept.map((s, i) => `file '${path.join(FRAMES, s.name)}'\nduration ${((kept[i + 1]?.at ?? END) - s.at).toFixed(5)}`).join('\n')
  fs.writeFileSync(path.join(process.cwd(), `list-${FILM}.txt`), `${list}\nfile '${path.join(FRAMES, kept[kept.length - 1].name)}'\n`)
  const encode = FILM === 'tour' ? ['-vf', 'fps=30,scale=1280:720:flags=lanczos,format=yuv420p', '-crf', '24'] : ['-vf', 'fps=60,format=yuv420p', '-crf', '15']
  execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(process.cwd(), `list-${FILM}.txt`), ...encode, '-t', String(END), '-c:v', 'libx264', '-preset', 'slow', '-movflags', '+faststart', OUT], { stdio: 'ignore' })
  console.log(`frames ${kept.length}, film fps ${(kept.length / END).toFixed(1)}, wrote ${OUT}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
