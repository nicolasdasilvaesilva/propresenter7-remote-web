# ProPresenter 7 Remote Web

🇧🇷 [Português](README.md) | 🇺🇸 English | 🇪🇸 [Español](README.es.md)

**Professional, complete and free** web remote control for **ProPresenter 7** — **two screens in one app**: one for **iPad/tablet/phone** and another for **desktop computer**, with the look of the official panel. Runs services and live events over the local Wi-Fi network, with nothing to install on the operator's device. Comes with **skills for Claude Code and Google Antigravity** (AI-guided install, update and support).

**Summary:** a Node.js server (**zero dependencies**, default port **3000**) runs **on the ProPresenter computer**, starts by itself when Windows boots, and serves both screens of the app. The operator just opens `http://COMPUTER-IP:3000` — the app **detects on its own** whether it's a phone/tablet or a computer and opens the right screen.

> Tested with **ProPresenter 21.4.2** (OpenAPI v1) — including against a real ProPresenter in a church production, live.

## ✨ Why use it

* **Two screens, one backend:** the same installation serves whoever operates from the iPad/phone during the service and whoever prefers the computer with the official ProPresenter panel look — no duplicated server, no duplicated configuration.
* **Real live PGM:** the desktop monitor shows the slide lyrics **crisp** (rendered in HTML, not a blurry thumbnail) over the right background — looping video/image when there is one, or a clean black background for text-only slides — exactly like the official panel, without duplicating text.
* **Drag to reorder, with your finger OR the mouse:** on both desktop and phone/tablet, hold the playlist item and drag it to position — no arrows, no popup, the fastest way possible.
* **Real media transport:** play, pause, skip back/forward 10 seconds and watch the real-time progress bar for videos, media and the announcement track — not just MP3.
* **Honest VU meter:** only "bounces" when real audio is actually playing (video with sound or MP3); a static image never makes it move for no reason.
* **Multilingual:** Portuguese, English and Spanish, with automatic detection and manual selection per device.
* **Installs as an app** (PWA) on desktop and phone, with its own icon — never copies the ProPresenter logo.
* **Starts on its own with Windows**, updates itself with backup, and rolls itself back if something fails.

## Table of Contents
1. [Quick Start](#-quick-start)
2. [Update, Check, Stop and Uninstall](#-update-check-stop-and-uninstall)
3. [Configuration](#️-configuration)
4. [Features](#-features)
5. [AI Skills (Claude Code and Antigravity)](#-ai-skills-claude-code-and-antigravity)
6. [Security](#-security)
7. [ProPresenter API Endpoints Used](#-propresenter-api-endpoints-used)
8. [Actual ProPresenter Behavior](#️-actual-propresenter-behavior-2142)
9. [Troubleshooting](#-troubleshooting)
10. [File Structure](#-file-structure)
11. [Development](#-development)
12. [Versions](#-versions) · [Authors](#-authors--credits) · [License](#-license)

---

## 🚀 Quick Start

### Environments
* **Production:** the **ProPresenter computer itself** (e.g. `10.0.21.145`). The server runs there, on port **3000**.
* **Development:** any other computer. The install/update scripts run **on the computer where the app is installed**.

### Requirements
Windows 10/11 · **Node.js 18+** (the installer tries to install it with `winget`) · **Git** (`winget install --id Git.Git`) · ProPresenter 7 with the **network API enabled** (Preferences › Network, port 50820).

### Installation (PowerShell as **Administrator** on the ProPresenter computer)
```powershell
git clone https://github.com/nicolasdasilvaesilva/propresenter7-remote-web.git C:\ProPresenter-Remote
powershell -ExecutionPolicy Bypass -File C:\ProPresenter-Remote\scripts\Instalar-Servico.ps1
```
The script:
1. ensures Node.js is present and writes `config.json` (detects ProPresenter on the same computer and uses `127.0.0.1`);
2. creates the **`ProPresenter-Remote`** scheduled task — as Administrator it runs as `SYSTEM` **at Windows startup, no login required, for every user**, with no window, restarting up to 5 times if it crashes;
3. removes the old launcher (the *Startup* folder) for every user;
4. creates the `ProPresenter Remote (TCP 3000)` firewall rule (Private and Domain networks);
   *(the default install location is always `C:\ProPresenter-Remote`: if the script is run from another folder, it **moves the installation there on its own** — clones from the same GitHub repo, carries the `config.json` over and continues from the new location; the old folder is not deleted)*
5. takes over the port (stops an older copy of the server), starts up and **verifies everything**, printing the addresses for the iPad and for the computer.

Options: `-Destino C:\OtherFolder` (different location) · `-NaoMover` (installs in place) · `-Porta 3000` (server port) · `-ProHost 10.0.21.145 -ProPorta 50820` (ProPresenter on another computer) · `-SemFirewall` · `-SemIniciar`.

**Already have the old version (in another folder)?** Inside it (as Administrator): `git pull origin main` then `powershell -ExecutionPolicy Bypass -File .\scripts\Instalar-Servico.ps1`. The installer **moves it to `C:\ProPresenter-Remote`**, stops the old server and takes over the port; the old folder can then be deleted. Then run `Instalar-Skill.bat`.

> Without Administrator it still works, but the task only starts **after that user logs in** to Windows (and the firewall may need to be opened by hand).

### On the iPad, tablet or phone
1. Connect to the **same network** as the ProPresenter computer.
2. Open `http://10.0.21.145:3000` (the installer prints the right address(es)) — the app **detects on its own** that it's a touch device and opens the mobile screen.
3. **iPad/iPhone (Safari):** Share `⎋` › **Add to Home Screen**. **Android (Chrome):** menu `⋮` › **Install app / Add to home screen**.

### On the computer (desk operator)
Open the **same address** (`http://10.0.21.145:3000`) in a desktop browser — the app detects it's not a touch device and opens the **Desktop screen** on its own, with the look of the official ProPresenter panel. No need to type `/desktop/`. To open the mobile screen on a computer anyway (for testing), add `?mobile=1` at the end of the address. The **Install App** button in the app's own menu (or the browser's install icon, over HTTPS) turns the Desktop screen into its own app, with a desktop icon.

### Default port
The server uses port **3000**. For a different port: `Instalar-Servico.ps1 -Porta 3100` (the script writes it to `config.json` and adjusts the firewall) or set `PORT`. Devices then open `http://IP:3100`.

---

## 🔁 Update, Check, Stop and Uninstall

| Shortcut (2 clicks) | Script | What it does |
|---|---|---|
| `Atualizar-Controle-Remoto.bat` | `scripts\Atualizar.ps1` | Updates from GitHub with **backup**, stops only our server, restarts, **verifies** and **rolls back on its own** to the previous version if it fails |
| `Verificar-Controle-Remoto.bat` | `scripts\Verificar.ps1` | Checks Node, files, server, version, ProPresenter, proxy, task, firewall and network profile; shows the addresses |
| `Parar-Controle-Remoto.bat` | `scripts\Parar-Servidor.ps1` | Stops **only** the remote control (never other Node programs) |
| `Configurar-Inicio-Automatico.bat` | `scripts\Instalar-Servico.ps1` | Installs/reapplies automatic startup |
| `Desinstalar-Inicio-Automatico.bat` | `scripts\Desinstalar-Servico.ps1` | Removes the task, the old launcher and the firewall rule (keeps files and `config.json`) |
| `Iniciar-Controle-Remoto.bat` | — | Runs in the foreground with the logs window (manual test) |

Run the `.bat` files **as Administrator** (right click › *Run as administrator*) when the install serves every user.

### How the update avoids stale cache
* The server computes a **file version (hash)** — including both screens, mobile and desktop — and puts it in `index.html`'s `?v=` and in the service worker's cache name **on every request**. There is no version number to bump by hand.
* New version ⇒ the browser downloads `app.js`/`app-desktop.js`/`style.css` again; the service worker deletes the old caches.
* The check **fails** if the served page doesn't carry the current version.
* **On devices:** close the app and reopen it (or reload twice). Last resort: remove the Home Screen icon, clear the site's data and add it again.
* If the update fails at any step, the script **restores the previous version** and brings the old server back up. Backups live in `..\ProPresenter-Remote-backups\` (keeps 3).

Logs: `logs\server.log` and `logs\server-erro.log` (the previous one is kept as `*.anterior.log`).

---

## ⚙️ Configuration

`config.json` (in the app folder, **outside Git**, generated by the installer):
```json
{ "port": 3000, "proHost": "127.0.0.1", "proPort": 50820 }
```
* **Priority:** environment variable (`PORT`, `PRO_HOST`, `PRO_PORT`) › `config.json` › default (3000 / `10.0.21.145` / 50820).
* Changing the **ProPresenter IP/port** through the app's gear icon (on both screens) **writes** to `config.json` — survives restarts and updates. (`set-pro-host` only accepts a local-network IP or computer name.)
* Server endpoints: `GET /api/server-info` (`proHost`, `proPort`, `port`, `version`, `ips`) and `GET /api/version` (`version`, `startedAt`, `pid`, `node`).

---

## 🌟 Features

### 🖥️ Two screens, one app
* **Mobile/Tablet** (`/`, phone or iPad): a single column with a live preview, `<<`/`>>` arrows and the playlist list; on wider screens (tablet), it becomes two columns with the full slide grid alongside.
* **Desktop** (`/desktop/`, computer): a look rebuilt from scratch to resemble the official ProPresenter panel (colors, icons and layout are **our own originals**, without copying any file from Renewed Vision) — library, playlist, media/ProContent, PGM monitor, Audio/Stage/Timers/Messages/Props/Video Inputs/Capture/Macros tabs, all in panels **resizable via visible dividers**.
* **Detection is automatic**: the app checks whether the device has touch (it doesn't just trust the browser's name — an iPad on Safari identifies itself as "Macintosh", but has touch) and sends it to the right screen on its own. `?mobile=1` forces the mobile screen even on a computer, for testing.
* Same backend, same install, same update — choosing a screen requires nothing extra.

### 📖 Presentations, lyrics and playlist
* **PGM monitor (Desktop) always 16:9**, sized exactly to the available space, at any position of the dividers.
* **Always-crisp lyrics:** when a slide has text only, the lyrics are drawn in HTML (large, crisp, black background) — never a small, stretched, blurry thumbnail. When there's a looping media behind it (video/image), the app shows both together: the background video **and** the crisp lyrics on top, without duplicating any text.
* **Drag to reorder** the presentation playlist, with your finger **or** the mouse (hold the `⠿` icon and drag) — on both screens, mobile and desktop. Reordering the **Media/ProContent playlist is not possible**: the official ProPresenter API only allows reading it, and the app never pretends to save an order that won't persist.
* **Keyboard navigation** on desktop: `←`/`→`/`↑`/`↓` arrows, `PageUp`/`PageDown` and spacebar move forward/back through the slide or live media, no click needed.
* **No "jumping back":** after your tap, the app ignores ProPresenter's stale responses for a short moment, so the highlight doesn't snap back to the previous slide/song on its own.
* Playlists **inside folders** show up (with the folder name); headers/placeholders don't try to open slides.
* **Note:** tapping a song in the playlist (mobile) or a specific slide in the grid (desktop) **puts it live**.

### 🎬 Media / ProContent and video transport
* Visual grid with real thumbnails, real-time sync (any device, or ProPresenter itself, changing the active media updates the list and grid with the **LIVE** badge).
* **Real play, pause, skip back 10s and forward 10s** on the video/media on screen, with a **real progress bar** (current position / duration) — not decoration, it's the real playback position read from the API. The same bar also exists for the **Announcement** layer and for **Audio** (MP3).
* **Honest VU meter** next to the monitor (Desktop): only reacts when real audio is actually playing (video with sound or MP3) — a static image (PNG/JPEG) never makes it move, because there's no sound at all.
* **Clear by layer** strip (Audio, Messages, Props, Announcements, Slide, Media, Video Input) right next to the monitor, with a **clear all** button.

### 🔍 Global search and add to playlist
* Instant search across more than **4,500** locally indexed songs/presentations.
* **Mobile:** popup with a magnifier, result list and lyric preview. **Desktop:** the same popup, with "+ Add to Playlist" and "Open".
* Writes **only to the chosen playlist**, without going live. If the playlist isn't found, it warns and **changes nothing**.

### 🎨 Looks · 🧹 Clear · 🎯 Macros
* **Real Look switching**, with the active Look's name always in sync — even if it changes from outside the app (by a Macro, another control, or directly in ProPresenter), the label updates itself within a few seconds.
* **Macros** show up as a list (just like the official panel): each one's full name (not just a number) and the **icons of the real actions** that macro triggers (switch Look, clear layer, change stage layout, activate a prop) — straight from the API, never made up.
* **Clear** menu by layer and **Clear All**.

### 💬 On-screen messages (identical to the official panel)
Template selector (`✓`), text with `{TOKENS}`, `Value:` fields, `Enter` sends, **Show/Clear**. Saves the tokens (`PUT`) and fires it (`POST …/trigger`). Timer/clock tokens are preserved.

### 🛠️ Tools
* **Stage Display:** changes the layout of each confidence-monitor screen, or several at once ("Change Platform Confidence Monitors"). Each screen has the **"Change together"** marker (iPad/NDI are independent by default). Swaps go through a **queue with verification** (ProPresenter ignores back-to-back swaps) and the app reports which screen failed. It also sends/clears the **stage message**.
* **Timers** (start/pause/reset/+1/+5 min), **Video Inputs**, **Props** (with an ACTIVE indicator) and **Capture** (record/stop) — all with real data from the API, no "fake" tab anywhere.

### 🌍 Languages
Portuguese, English and Spanish on both screens: detects the device's language on its own the first time, and each person can pick their own in Settings (the choice stays on that device only).

### 📱 PWA and installation
* **Own, original icon** (never the ProPresenter logo — a copyright matter this project takes seriously).
* **Mobile:** system-specific install modal (iPad/iPhone, Android). Over **plain HTTP** (local network via `IP:3000`) the browser **won't register a service worker or offer "Install app"** — on iOS use *Add to Home Screen* (works as a full-screen app). The app works normally without installing.
* **Desktop:** **Install App** button in the menu (disappears on its own once installed, and doesn't show up again if the app is already running as a separate program).
* Bigger buttons on touch screens; `Space`/arrows don't advance the slide with a popup open; `Esc` closes popups. Invisible scrollbar on both screens.

---

## 🧠 AI Skills (Claude Code and Antigravity)

Two `SKILL.md`-format skills, for **Claude Code** and for **Google Antigravity**:

| Skill | What for |
|---|---|
| `propresenter-remote-install` | **Install, update, verify, repair and uninstall** (automatic startup with Windows, update without stale cache, rollback) |
| `propresenter-expert` | API, interface, architecture and the **confirmed quirks of a real ProPresenter** |

**Install the skills** (2 clicks on `Instalar-Skill.bat`, or from the command line):
```bat
Instalar-Skill.bat              :: Claude Code and Antigravity
Instalar-Skill.bat claude       :: Claude Code only   (%USERPROFILE%\.claude\skills)
Instalar-Skill.bat antigravity  :: Antigravity only   (%USERPROFILE%\.gemini\config\skills)
```
Then close and reopen the assistant. Inside this repository, Claude Code also reads **`CLAUDE.md`** (project rules). To ask an assistant on the ProPresenter computer to install everything, paste the text from `PROMPT-PARA-ANTIGRAVITY.txt` (works for both).

---

## 🔒 Security

* The app is served by its own server (same origin): **no open CORS**; writes coming from another origin get **403**.
* `set-pro-host` only accepts a local-network IP / computer name and validates the port; request body size is limited.
* **Known limitation:** over plain HTTP there is no authentication — any device on the local network can open the remote control, and `GET` commands from another site open on the network would still be accepted. Only a password/HTTPS would fix this; use a trusted Wi-Fi network.

---

## 📡 ProPresenter API Endpoints Used
`GET /version` · `GET /v1/looks`, `/v1/look/current`, `/v1/look/{id}/trigger` · `GET /v1/macros`, `/v1/macro/{id}/trigger` · `GET /v1/playlists`, `/v1/playlist/{id}`, `/v1/playlist/{id}/{i}/trigger`, **`PUT /v1/playlist/{id}`** (add a song and reorder) · `GET /v1/presentation/{uuid}`, `/thumbnail/{i}`, `/{i}/trigger`, `/v1/presentation/slide_index`, `/v1/trigger/next|previous` · `GET /v1/libraries`, `/v1/library/{id}` · `GET /v1/media/playlists`, `/v1/media/playlist/{id}`, `/{media}/trigger`, `/v1/media/playlist/active`, `/v1/media/{uuid}/thumbnail` · `GET /v1/audio/playlists`, `/v1/audio/playlist/{id}`, `/{track}/trigger`, `/v1/trigger/audio/{next|previous}` · **`GET/PUT /v1/transport/{presentation|announcement|audio}/{current|time}`, `GET /v1/transport/{…}/{play|pause}`** (real play/pause/forward/back and progress bar) · `GET/PUT /v1/message*`, `POST /v1/message/{id}/trigger`, `GET /v1/message/{id}/clear` · `GET /v1/clear/layer/{layer}`, `/v1/clear/group/{id}/trigger` · `GET /v1/stage/screens`, `/v1/stage/layouts`, `/v1/stage/screen/{id}/layout[/{layout}]`, `GET|PUT|DELETE /v1/stage/message`, `GET /v1/status/screens` · `GET /v1/timers/current`, `/v1/timer/{id}/{start|stop|reset|increment/{s}}` · `GET /v1/video_inputs`, `/{id}/trigger` · `GET /v1/props`, `/v1/prop/{id}/trigger|clear` · `GET /v1/capture/status`, **`GET /v1/capture/{start|stop}`**.

---

## ⚠️ Actual ProPresenter Behavior (21.4.2)
Measured against a production ProPresenter (the official spec diverges from it, or is silent, on several points):
1. **Reading the Stage layout by index swaps screens 1 and 2** → the app always uses the screen's **UUID** instead.
2. **Back-to-back layout swaps (<~100 ms) are ignored** (responds 204 but doesn't apply) → a ≥400 ms queue + verification + retry.
3. **Playlists:** `field_type:"playlist"` and children in `children` (the spec says `type`/`playlists`); the app accepts both.
4. `GET /v1/presentation/{uuid}` comes wrapped in `{presentation:{…}}`; `slide_index` does **not** carry the slide total and returns `{presentation_index:null}` when nothing is live.
5. **404 is normal** when nothing is live: only 502/503 or a network failure means "offline".
6. **Capture** is `GET` (not POST); paused audio still carries `name` (use `is_playing`).
7. **`/v1/transport/{layer}/time` exists and is undocumented anywhere** — `GET` reads the current playback position in seconds, `PUT` (with a number in JSON) changes it. It only works for the 3 layers the 404 error itself reveals: `presentation` (covers both slide **and** media/video — internally the same layer), `announcement` and `audio`. There's no bookmark/marker endpoint (that's only in the ProPresenter editor) nor one to reorder slides inside a single presentation (only the whole playlist).
8. **A static image (PNG/JPEG) also shows up in `/v1/transport/presentation/current` with a residual "duration"** (e.g. `0.33`s) — not audio at all, it's internal metadata; the app ignores durations under 1.5s when deciding whether real media is actually playing.
9. `/v1/status/screens` lists the **names** of the configured screens (audience/stage), but **there is no endpoint that returns an image of what's being shown** on a specific screen — only each screen's NDI feed would solve that, out of scope for the REST API.

---

## 🩺 Troubleshooting
Run **`Verificar-Controle-Remoto.bat`**: it tells you what's wrong.

| Symptom | Likely cause | What to do |
|---|---|---|
| iPad/computer won't open the page | Server stopped, firewall, Windows network set to **Public**, PC's IP changed | Verify; run `Configurar-Inicio-Automatico.bat` as Admin; switch the network to **Private**; reserve a fixed IP on the router |
| It opens, but the dot stays red | ProPresenter closed / API off / wrong IP or port | Open ProPresenter; Preferences › Network; adjust in the app's gear icon |
| Wrong screen opened (mobile on a PC, or vice versa) | Browser's touch detection | Use `?mobile=1` at the end of the address to force the mobile screen on a computer; on a hybrid tablet, the mobile screen is the expected one (it has touch) |
| Shows an old version | Device cache | Close/reopen the app; reload twice; remove the icon and add it again |
| `Port 3000 is already in use` | Another copy or another program | `Parar-Controle-Remoto.bat`; check who's using it: `Get-NetTCPConnection -LocalPort 3000` |
| Doesn't start after a Windows restart | Installed without Administrator (only starts after login) | `Configurar-Inicio-Automatico.bat` as Administrator |
| Update "rolled back" | The new version didn't start up/verify | Read `logs\server-erro.log`; backup in `..\ProPresenter-Remote-backups` |
| "There are local changes" when updating | A tracked file was edited | `git status`; `Atualizar.ps1 -Forcar` stashes them |

---

## 📁 File Structure
```text
├── server.js                         # HTTP server, /api/v1 proxy, routes / (mobile) and /desktop/, config.json, file versioning
├── config.json                       # (generated) IP/port — outside Git
├── CLAUDE.md                         # Project rules for Claude Code
├── Configurar-Inicio-Automatico.bat  # Installs/reapplies automatic startup (Run as Administrator)
├── Atualizar-Controle-Remoto.bat     # Updates, restarts, verifies, rolls back on failure
├── Verificar-Controle-Remoto.bat     # Checks everything and shows the addresses
├── Parar-Controle-Remoto.bat         # Stops only the remote control
├── Desinstalar-Inicio-Automatico.bat # Removes automatic startup
├── Iniciar-Controle-Remoto.bat       # Foreground (test)
├── Iniciar-Segundo-Plano.vbs         # Starts invisibly (used by the scheduled task)
├── Instalar-Skill.bat                # Installs the skills (Claude Code and/or Antigravity)
├── 1-Instalar-NodeJS.bat             # Node.js LTS installer
├── PROMPT-PARA-ANTIGRAVITY.txt       # Prompt for an assistant to install everything
├── COMO-INSTALAR.txt                 # Quick guide
├── MEMORIA_PROJETO.md · PAUSA-*.md   # Project's technical log
├── scripts/                          # PowerShell: Instalar-Servico, Atualizar, Verificar, Parar-Servidor,
│                                     #   Desinstalar-Servico, Iniciar-Servidor, Firewall, _comum
├── public/                           # MOBILE/TABLET screen (root "/")
│   ├── index.html · manifest.json · service-worker.js
│   ├── css/style.css                 # ProPresenter-style dark theme
│   ├── js/app.js                     # Logic: API, polling, playlist drag, Stage, messages, PWA…
│   ├── js/i18n.js                    # pt-BR/en/es dictionary, shared by both screens
│   └── img/                          # Original icons (192/512, apple-touch, logo, favicon)
├── public-desktop/                   # DESKTOP screen ("/desktop/"), official panel look
│   ├── index.html · manifest.json
│   ├── css/style.css                 # Pill toolbar, 16:9 PGM monitor, clear-strip, VU meter…
│   └── js/app-desktop.js             # Own logic: composited PGM, media transport, macros, Look…
└── skills/
    ├── propresenter-expert/SKILL.md
    └── propresenter-remote-install/SKILL.md
```

---

## 🧪 Development
```powershell
node server.js                                                      # http://localhost:3000 (PRO_HOST / PRO_PORT point at ProPresenter)
node --check server.js
node --check public\js\app.js; node --check public-desktop\js\app-desktop.js  # syntax check for both screens (no automated tests)
```
* No `npm install` (only Node's native modules). Node **18+** (uses `fetch`).
* When testing against a real ProPresenter, start with reads only; **nothing that changes what's live** unless the screens are free.
* File versioning is automatic — don't edit version numbers by hand.
* `.ps1` scripts in UTF-8 **with BOM**; JSON written by PowerShell **without BOM**.

---

## 📦 Versions
* **v1.5.6** — "Enviar Aviso" skin: a "Log out" button in the header, and the installable PWA finally fixed for good (Cloudflare was caching the JS/CSS files at its edge for up to 4h and ignoring the server's `Cache-Control`, causing inconsistent install/update behavior — now uses `no-store`, which Cloudflare actually honors, plus a version bump on the files to flush what was already cached). Also new on all three screens (mobile, desktop, and Enviar Aviso): when a message leaves the screen on its own — whether the template's configured display time runs out, or it's cleared directly in ProPresenter — the app notices and resets the button on its own, no need to tap "Clear".
* **v1.5.5** — public access to "Enviar Aviso" over the internet (4G, no church Wi-Fi needed): an isolated server (`mensagens-publico.js`), its own username/password login, an admin panel to create/edit/remove users without needing a terminal, and a full guide to run it on a separate Linux box with a Cloudflare tunnel. Same backend, zero changes to the local app.
* **v1.5.4** — the on-screen message showed `${uuid}` instead of the typed value (e.g. `${05b2fedf-...}` instead of "CRUZE") when sent from mobile, desktop, or the "Enviar Aviso" skin — sending straight from ProPresenter itself worked fine. Cause: when resending the message, we stripped each variable's `uuid` and only sent its name; ProPresenter stores the text referencing the variable by UUID, not by name, so without it, it couldn't match the new value to the right spot. Fixed in all three (mobile/desktop/mensagens) and confirmed live.
* **v1.5.3** — new `/mensagens/` skin, to send a message to the screen without being the trained operator (ushers, parking-lot security) — installable on their own phone, shows every message template already configured in ProPresenter, and asks for confirmation before actually sending.
* **v1.5.2** — the (mobile) PGM only showed "what's really live" when the playlist type open on the device (Media or Presentation) matched what was actually live in ProPresenter; browsing a song playlist while a video from Media was playing (or the other way around) left the PGM showing nothing. Now the PGM always follows what's really live, in any combination, without switching the playlist/folder the operator is browsing.
* **v1.5.1** — Macros, Looks, Stage, Audio, Messages, Props and Video Inputs could also get stuck empty on Desktop if ProPresenter didn't respond in time when connecting (found in production: Macros empty even with ProPresenter on); now they all recover on their own, just like playlist/library/media. Also fixed the file-version calculation, which never detected changes to the Desktop JS (it looked for `app.js`, the right file is `app-desktop.js`) — could leave the browser stuck on a much older version even after the server was updated. On mobile, the Look also got the same automatic recovery.
* **v1.5.0** — fixed playlist drag-and-drop on mobile: dropping near a neighboring song made the card jump to the wrong position (confirmed on a real iPad); solved by compensating for the layout shift on every swap. The sample content stuck on the desktop screen (fake playlist/media) when ProPresenter hadn't responded yet at connection time is gone; playlist, library and media now load on their own as soon as they appear in ProPresenter, no app restart needed (mobile and desktop).
* **v1.4.0** — Blackout, Clear Groups and real skip (±seconds, actual) for video/audio, video countdown timer — all through the official ProPresenter API.
* **v1.3.1** — PGM lyrics always crisp (HTML) and never duplicated/left over behind it; black background matching mobile.
* **v1.3.0** — real transport (play/pause/skip 10s/progress bar) for media and announcements; honest VU meter; touch/mouse drag-and-drop on mobile; Macros as a list with real names and actions; redesigned desktop menu as a pill, matching mobile; fixed clear-strip next to the monitor.
* **v1.2.0** — **Desktop** version (official panel look), support for **3 languages** on both screens, playlist reordering (arrows), automatic desktop/mobile detection.
* **v1.1.1** — installer takes over the port and stops the old server.
* **v1.1.0** — automatic startup with Windows, safe update with rollback, automatic file versioning, `config.json`, new skills; fixes to Stage (UUID + queue), the "jump back", playlists in folders, capture, audio and security.
* **v1.0.0** — first version.

Releases: <https://github.com/nicolasdasilvaesilva/propresenter7-remote-web/releases>

---

## 👥 Authors & Credits
* **Author and developer:** **Nicolas da Silva e Silva**
* **Feature designer:** **Marcelo Rocha**

---

## 📄 License
Distributed under the **MIT License** with **mandatory attribution to the original authors**.

Use, copying, modification, merging and distribution of this software is permitted, **provided that the following credits are always explicitly cited**:
* **Author and developer:** Nicolas da Silva e Silva
* **Feature designer:** Marcelo Rocha

For the full legal text, see the [`LICENSE`](./LICENSE) file.
