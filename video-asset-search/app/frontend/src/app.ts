/**
 * {{ORGANIZATION_NAME}} Asset Search — main UI
 * WASM query embedding → Node cosine similarity → clip delivery
 */
import { readMountedAppPaths } from './app-paths'
const { apiBasePath, basePath } = readMountedAppPaths()

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shot {
  id: string
  source_filename: string
  source_folder: string | null
  timecode_start: number
  timecode_end: number
  shot_type: string | null
  people_in_frame: string | null
  product_in_frame: string | null
  talking_direction: string | null
  shooting_style: string | null
  concept_action_type: string | null
  description: string | null
  clip_path: string | null
  clip_url: string | null
  source_url: string | null
  tc_display: string
  score?: number
}

interface Status {
  total_shots: number
  total_videos: number
  processing_count: number
  last_processed_at: string | null
}

// ─── State ────────────────────────────────────────────────────────────────────

let modelState: 'loading' | 'ready' | 'error' = 'loading'
let extractor: ((text: string, opts: object) => Promise<{ data: Float32Array }>) | null = null
let shots: Shot[] = []
let query = ''
let isSearching = false
let activeModal: 'detail' | 'player' | null = null
let activeShot: Shot | null = null
let status: Status = { total_shots: 0, total_videos: 0, processing_count: 0, last_processed_at: null }
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let knownShotIds = new Set<string>()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString()
const esc = (s: unknown) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const tag = (v: string | null) => v
  ? `<span class="tag">${esc(v.replace(/_/g,' '))}</span>`
  : ''

function copyToClipboard(text: string, btn: HTMLElement, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent
    btn.textContent = 'Copied!'
    btn.classList.add('copied')
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied') }, 2000)
  }).catch(() => { btn.textContent = 'Failed' })
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchStatus() {
  try {
    const r = await fetch(`${apiBasePath}/status`)
    if (r.ok) { status = await r.json(); renderStatus() }
  } catch {}
}

async function fetchBrowse() {
  try {
    const r = await fetch(`${apiBasePath}/shots?limit=200`)
    if (r.ok) {
      const data = await r.json()
      const newShots: Shot[] = data.shots
      const freshIds = new Set(newShots.map((s: Shot) => s.id))
      const hasNew = newShots.some((s: Shot) => !knownShotIds.has(s.id))
      shots = newShots
      newShots.forEach((s: Shot) => knownShotIds.add(s.id))
      if (!query) renderGrid(hasNew)
    }
  } catch {}
}

async function runSearch(q: string) {
  if (!extractor) return
  isSearching = true
  renderSearchState()
  try {
    const out = await extractor(q, { pooling: 'mean', normalize: true })
    const vector = Array.from(out.data)
    const r = await fetch(`${apiBasePath}/search-vector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector, limit: 200, threshold: 0.65, query }),
    })
    if (r.ok) { shots = await r.json() }
    else { shots = [] }
  } catch { shots = [] }
  isSearching = false
  renderGrid(false)
}

// ─── Status header ────────────────────────────────────────────────────────────

function renderStatus() {
  const el = document.getElementById('status-bar')
  if (!el) return
  const processing = status.processing_count > 0
    ? `<span class="processing-badge">${status.processing_count} processing</span>`
    : ''
  el.innerHTML =
    `<span class="stat">${fmt(status.total_shots)} <span class="stat-label">shots</span></span>` +
    `<span class="stat-sep">·</span>` +
    `<span class="stat">${fmt(status.total_videos)} <span class="stat-label">videos</span></span>` +
    processing
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function renderSearchState() {
  const input = document.getElementById('search-input') as HTMLInputElement
  const hint  = document.getElementById('search-hint')
  if (!input || !hint) return

  if (modelState === 'loading') {
    input.placeholder = 'Loading search engine — happens once per browser…'
    input.disabled = true
    hint.textContent = 'Browse is available now. Search will be ready in a moment.'
    hint.className = 'search-hint loading'
  } else if (modelState === 'error') {
    input.placeholder = 'Search unavailable'
    input.disabled = true
    hint.textContent = 'Could not load the search engine. Try refreshing.'
    hint.className = 'search-hint error'
  } else {
    input.disabled = false
    input.placeholder = 'Search clips — describe what you're looking for'
    if (isSearching) {
      hint.textContent = 'Searching…'
      hint.className = 'search-hint searching'
    } else if (query && shots.length === 0 && !isSearching) {
      hint.textContent = ''
      hint.className = 'search-hint'
    } else {
      hint.textContent = query
        ? `Showing ${fmt(shots.length)} highly relevant match${shots.length !== 1 ? 'es' : ''}`
        : ''
      hint.className = 'search-hint'
    }
  }
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

function renderGrid(animate = false) {
  renderSearchState()
  const grid   = document.getElementById('grid')!
  const empty  = document.getElementById('empty-state')!
  const isQuery = !!query && !isSearching

  if (!shots.length && !isSearching) {
    grid.style.display = 'none'
    empty.style.display = 'flex'
    empty.innerHTML = isQuery
      ? `<p class="empty-title">No results above confidence threshold</p>
         <p class="empty-sub">Try broadening your query, or use more general terms like "product demo" or "ring closeup"</p>`
      : `<p class="empty-title">No shots in the library yet</p>
         <p class="empty-sub">Process videos through the pipeline to populate the asset library</p>`
    return
  }

  empty.style.display = 'none'
  grid.style.display = 'grid'

  const existing = new Map<string, HTMLElement>()
  grid.querySelectorAll('[data-id]').forEach(el => {
    existing.set((el as HTMLElement).dataset.id!, el as HTMLElement)
  })

  // Build new order
  const fragment = document.createDocumentFragment()
  shots.forEach(shot => {
    let card = existing.get(shot.id)
    if (!card) {
      card = createCard(shot, isQuery)
      if (animate) card.classList.add('card-new')
    } else {
      updateCardScore(card, shot, isQuery)
    }
    fragment.appendChild(card)
  })

  grid.innerHTML = ''
  grid.appendChild(fragment)
  setupVideoObserver()
}

function createCard(shot: Shot, showScore: boolean): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card'
  card.dataset.id = shot.id
  card.innerHTML = cardHTML(shot, showScore)
  card.addEventListener('click', () => openDetail(shot))

  const video = card.querySelector('.card-video') as HTMLVideoElement | null
  if (video) {
    video.addEventListener('mouseenter', () => {
      if (video.src && video.paused) video.play().catch(() => {})
    })
    video.addEventListener('mouseleave', () => {
      if (!video.paused) video.pause()
    })
  }

  return card
}

function updateCardScore(card: HTMLElement, shot: Shot, showScore: boolean) {
  const badge = card.querySelector('.score-badge') as HTMLElement | null
  if (badge) {
    badge.style.display = showScore && shot.score != null ? 'block' : 'none'
    if (shot.score != null) badge.textContent = shot.score.toFixed(3)
  }
}

const prefixUrl = (url: string | null): string =>
  url ? `${basePath === '/' ? '' : basePath}${url}` : ''

function cardHTML(shot: Shot, showScore: boolean): string {
  const mediaUrl = prefixUrl(shot.clip_url ?? shot.source_url)
  const score = showScore && shot.score != null
    ? `<span class="score-badge">${shot.score.toFixed(3)}</span>` : ''
  const tags = [shot.shot_type, shot.shooting_style, shot.product_in_frame,
                shot.people_in_frame, shot.concept_action_type]
    .filter(Boolean).map(tag).join('')

  return `
    <div class="card-preview">
      <video class="card-video" data-src="${esc(mediaUrl)}" data-start="${shot.timecode_start}"
             data-end="${shot.timecode_end}" muted loop playsinline preload="metadata">
      </video>
      ${score}
      <button class="audio-btn" title="Toggle audio" onclick="event.stopPropagation(); toggleAudio(this)">🔇</button>
    </div>
    <div class="card-meta">
      <div class="card-filename">${esc(shot.source_filename)}</div>
      <div class="card-tc">${esc(shot.tc_display)}</div>
      ${shot.source_folder ? `<div class="card-folder">${esc(shot.source_folder)}</div>` : ''}
      <div class="card-tags">${tags}</div>
    </div>`
}

// ─── IntersectionObserver for video autoplay ──────────────────────────────────

let observer: IntersectionObserver | null = null

function setupVideoObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target as HTMLVideoElement
      if (entry.isIntersecting) {
        // Set src so the browser has the URL ready for when hover triggers play().
        // Does not call play() — hover-to-play handles that.
        if (!video.src && video.dataset.src) {
          const start = parseFloat(video.dataset.start ?? '0')
          video.src = video.dataset.src
          video.addEventListener('loadedmetadata', () => {
            video.currentTime = start
          }, { once: true })
          video.addEventListener('timeupdate', loopHandler)
        }
      } else {
        if (!video.paused) video.pause()
      }
    })
  }, { threshold: 0.3 })

  document.querySelectorAll('.card-video').forEach(v => observer!.observe(v))
}

function loopHandler(this: HTMLVideoElement) {
  const end = parseFloat(this.dataset.end ?? '9999')
  const start = parseFloat(this.dataset.start ?? '0')
  if (this.currentTime >= end - 0.1) this.currentTime = start
}

;(window as Window & { toggleAudio: (b: HTMLElement) => void }).toggleAudio = (btn: HTMLElement) => {
  const video = btn.closest('.card-preview')?.querySelector('video') as HTMLVideoElement
  if (!video) return
  video.muted = !video.muted
  btn.textContent = video.muted ? '🔇' : '🔊'
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function openDetail(shot: Shot) {
  activeShot = shot
  activeModal = 'detail'

  const modal = document.getElementById('detail-modal')!
  const mediaUrl = prefixUrl(shot.clip_url ?? shot.source_url)
  const tags = [
    { label: 'Shot type', val: shot.shot_type },
    { label: 'People', val: shot.people_in_frame },
    { label: 'Product', val: shot.product_in_frame },
    { label: 'Talking direction', val: shot.talking_direction },
    { label: 'Style', val: shot.shooting_style },
    { label: 'Concept', val: shot.concept_action_type },
  ].filter(t => t.val)

  modal.innerHTML = `
    <div class="modal-backdrop" id="detail-backdrop"></div>
    <div class="modal-panel">
      <button class="modal-close" id="detail-close">✕</button>
      <div class="modal-body">
        <div class="modal-preview">
          <video id="detail-video" src="${esc(mediaUrl)}" muted loop playsinline autoplay
                 data-start="${shot.timecode_start}" data-end="${shot.timecode_end}">
          </video>
          <button class="audio-btn modal-audio-btn" onclick="
            const v = document.getElementById('detail-video');
            v.muted=!v.muted; this.textContent=v.muted?'🔇':'🔊'">🔇</button>
        </div>
        <div class="modal-info">
          <div class="modal-filename">${esc(shot.source_filename)}</div>
          <div class="modal-tc">${esc(shot.tc_display)}</div>
          ${shot.source_folder ? `<div class="modal-folder">${esc(shot.source_folder)}</div>` : ''}
          <div class="modal-tags-list">
            ${tags.map(t => `<div class="tag-row"><span class="tag-label">${esc(t.label)}</span><span class="tag">${esc(t.val!.replace(/_/g,' '))}</span></div>`).join('')}
          </div>
          ${shot.description ? `<div class="modal-description">${esc(shot.description)}</div>` : ''}
          <div class="modal-actions">
            ${shot.clip_url ? `<a class="action-btn" href="${esc(prefixUrl(shot.clip_url))}" download="${esc(shot.clip_url!.split('/').pop()!)}">↓ Download</a>` : '<button class="action-btn disabled" disabled title="Clip not yet cut">↓ Download</button>'}
            <button class="action-btn" id="copy-link-btn">🔗 Copy link</button>
            <button class="action-btn" id="copy-tc-btn">⏱ Copy timecode</button>
            ${shot.source_url ? `<button class="action-btn" id="open-player-btn">▶ Source video</button>` : ''}
          </div>
        </div>
      </div>
    </div>`

  modal.style.display = 'flex'
  document.body.style.overflow = 'hidden'

  // Seek to shot start and explicitly play (autoplay attribute alone isn't always honoured
  // on dynamically-inserted elements in Chrome)
  const dv = document.getElementById('detail-video') as HTMLVideoElement
  dv.addEventListener('loadedmetadata', () => {
    dv.currentTime = shot.timecode_start
    dv.play().catch(() => {})
  }, { once: true })
  dv.addEventListener('timeupdate', loopHandler)

  // Actions
  document.getElementById('detail-close')!.onclick = closeDetail
  document.getElementById('detail-backdrop')!.onclick = closeDetail

  document.getElementById('copy-link-btn')!.onclick = function() {
    const url = `${location.origin}${basePath === '/' ? '' : basePath}?clip=${shot.id}`
    copyToClipboard(url, this as HTMLElement, 'Copy link')
  }
  document.getElementById('copy-tc-btn')!.onclick = function() {
    copyToClipboard(shot.tc_display, this as HTMLElement, 'Copy timecode')
  }
  document.getElementById('open-player-btn')?.addEventListener('click', () => {
    closeDetail(); openPlayer(shot)
  })
}

function closeDetail() {
  const modal = document.getElementById('detail-modal')!
  const dv = document.getElementById('detail-video') as HTMLVideoElement | null
  dv?.removeEventListener('timeupdate', loopHandler)
  dv?.pause()
  modal.style.display = 'none'
  modal.innerHTML = ''
  document.body.style.overflow = ''
  activeModal = null; activeShot = null
}

// ─── Source video player ──────────────────────────────────────────────────────

function openPlayer(shot: Shot) {
  if (!shot.source_url) return
  activeModal = 'player'; activeShot = shot

  const modal = document.getElementById('player-modal')!
  modal.innerHTML = `
    <div class="modal-backdrop" id="player-backdrop"></div>
    <div class="player-panel">
      <div class="player-header">
        <span class="player-title">${esc(shot.source_filename)}</span>
        <button class="modal-close" id="player-close">✕</button>
      </div>
      <div class="player-video-wrap">
        <video id="source-video" src="${esc(prefixUrl(shot.source_url))}" playsinline
               style="width:100%;display:block;background:#000">
        </video>
      </div>
      <div class="player-controls">
        <button class="ctrl-btn" id="ctrl-play">▶</button>
        <div class="progress-wrap" id="progress-wrap">
          <div class="progress-bg"></div>
          <div class="shot-range" id="shot-range"></div>
          <div class="progress-fill" id="progress-fill"></div>
          <div class="progress-handle" id="progress-handle"></div>
        </div>
        <span class="time-display" id="time-display">0:00</span>
        <button class="ctrl-btn" id="ctrl-mute">🔇</button>
      </div>
      <div class="player-tc-label">Shot: ${esc(shot.tc_display)} (highlighted in timeline)</div>
    </div>`

  modal.style.display = 'flex'
  document.body.style.overflow = 'hidden'

  document.getElementById('player-close')!.onclick = closePlayer
  document.getElementById('player-backdrop')!.onclick = closePlayer

  const sv = document.getElementById('source-video') as HTMLVideoElement
  const playBtn = document.getElementById('ctrl-play')!
  const muteBtn = document.getElementById('ctrl-mute')!
  const fill    = document.getElementById('progress-fill')!
  const handle  = document.getElementById('progress-handle')!
  const range   = document.getElementById('shot-range')!
  const timeEl  = document.getElementById('time-display')!
  const wrap    = document.getElementById('progress-wrap')!

  sv.addEventListener('loadedmetadata', () => {
    sv.currentTime = shot.timecode_start
    sv.play().catch(() => {})
    playBtn.textContent = '⏸'

    const dur = sv.duration
    if (dur > 0) {
      const startPct = (shot.timecode_start / dur) * 100
      const endPct   = (shot.timecode_end   / dur) * 100
      range.style.left  = `${startPct}%`
      range.style.width = `${endPct - startPct}%`
    }
  })

  sv.addEventListener('timeupdate', () => {
    if (!sv.duration) return
    const pct = (sv.currentTime / sv.duration) * 100
    fill.style.width   = `${pct}%`
    handle.style.left  = `${pct}%`
    const m = Math.floor(sv.currentTime / 60)
    const s = Math.floor(sv.currentTime % 60)
    timeEl.textContent = `${m}:${String(s).padStart(2,'0')}`
  })

  sv.addEventListener('play',  () => { playBtn.textContent = '⏸' })
  sv.addEventListener('pause', () => { playBtn.textContent = '▶' })

  playBtn.onclick = () => sv.paused ? sv.play() : sv.pause()
  muteBtn.onclick = () => { sv.muted = !sv.muted; muteBtn.textContent = sv.muted ? '🔇' : '🔊' }

  wrap.addEventListener('click', (e) => {
    const rect = wrap.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    if (sv.duration) sv.currentTime = pct * sv.duration
  })

  document.addEventListener('keydown', playerKeyHandler)
}

function playerKeyHandler(e: KeyboardEvent) {
  if (activeModal !== 'player') return
  if (e.key === 'Escape') { closePlayer(); return }
  const sv = document.getElementById('source-video') as HTMLVideoElement | null
  if (!sv) return
  if (e.key === ' ' || e.key === 'k') { e.preventDefault(); sv.paused ? sv.play() : sv.pause() }
  if (e.key === 'ArrowLeft')  sv.currentTime -= 5
  if (e.key === 'ArrowRight') sv.currentTime += 5
}

function closePlayer() {
  const sv = document.getElementById('source-video') as HTMLVideoElement | null
  sv?.pause()
  document.removeEventListener('keydown', playerKeyHandler)
  const modal = document.getElementById('player-modal')!
  modal.style.display = 'none'; modal.innerHTML = ''
  document.body.style.overflow = ''
  activeModal = null; activeShot = null
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeModal === 'detail') closeDetail()
})

// ─── Deep link ────────────────────────────────────────────────────────────────

async function handleDeepLink() {
  const params = new URLSearchParams(location.search)
  const clipId = params.get('clip')
  if (!clipId) return
  try {
    const r = await fetch(`${apiBasePath}/shots/${clipId}`)
    if (r.ok) { const shot = await r.json(); openDetail(shot) }
  } catch {}
}

// ─── Search wiring ────────────────────────────────────────────────────────────

const searchInput = document.getElementById('search-input') as HTMLInputElement

searchInput.addEventListener('input', () => {
  query = searchInput.value.trim()
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!query) { fetchBrowse(); return }
  if (modelState !== 'ready') return
  debounceTimer = setTimeout(() => runSearch(query), 400)
})

// ─── Model loading ────────────────────────────────────────────────────────────

async function loadModel() {
  modelState = 'loading'; renderSearchState()
  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2') as {
      pipeline: Function; env: Record<string, unknown>
    }
    ;(env as Record<string, unknown>).allowLocalModels = false
    ;(env as Record<string, unknown>).useBrowserCache  = true

    extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
      quantized: false,
    }) as typeof extractor

    modelState = 'ready'; renderSearchState()

    // If there was already a query typed while loading, run it now
    if (query) runSearch(query)
  } catch (e) {
    modelState = 'error'; renderSearchState()
    console.error('Model load failed:', e)
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

fetchStatus()
fetchBrowse()
handleDeepLink()
loadModel()
setInterval(() => { fetchStatus(); if (!query) fetchBrowse() }, 10_000)
