# ProPresenter 7 Remote Web

🇧🇷 [Português](README.md) | 🇺🇸 [English](README.en.md) | 🇪🇸 Español

Control remoto web **profesional, completo y gratuito** para **ProPresenter 7** — **dos pantallas en una sola app**: una para **iPad/tablet/celular** y otra para **computadora**, con el aspecto del panel oficial. Opera cultos y eventos en vivo por la red Wi-Fi local, sin instalar nada en el dispositivo de quien opera. Incluye **skills para Claude Code y para Google Antigravity** (instalación, actualización y soporte guiados por IA).

**Resumen:** un servidor Node.js (**sin ninguna dependencia**, puerto predeterminado **3000**) corre **en la computadora del ProPresenter**, arranca solo cuando Windows enciende y sirve las dos pantallas de la app. El operador solo abre `http://IP-DE-LA-COMPUTADORA:3000` — la app **reconoce sola** si es un celular/tablet o una computadora y abre la pantalla correcta.

> Probado con **ProPresenter 21.4.2** (API OpenAPI v1) — incluso contra el ProPresenter real de una iglesia en producción, en vivo.

## ✨ Por qué usarlo

* **Dos pantallas, un solo backend:** la misma instalación atiende a quien opera desde el iPad/celular durante el culto y a quien prefiere la computadora con el aspecto del panel oficial de ProPresenter — sin duplicar servidor, sin duplicar configuración.
* **PGM en vivo de verdad:** el monitor del escritorio muestra la letra del slide **nítida** (renderizada en HTML, no una miniatura borrosa) sobre el fondo correcto — video/imagen en bucle cuando existe, o fondo negro limpio cuando es solo texto — exactamente como en el panel oficial, sin duplicar texto.
* **Arrastrar para reordenar, con el dedo O el mouse:** tanto en escritorio como en celular/tablet, mantén presionado el ítem de la playlist y arrástralo a la posición — sin flechitas, sin popup, de la forma más rápida posible.
* **Transporte de medios de verdad:** reproducir, pausar, retroceder/avanzar 10 segundos y ver la barra de progreso en tiempo real de videos, medios y el locutor de anuncios — no solo del MP3.
* **VU meter honesto:** solo "se mueve" cuando hay audio de verdad reproduciéndose (video con sonido o MP3); una imagen estática nunca lo hace moverse sin motivo.
* **Multilingüe:** Português, English y Español, con detección automática y selección manual por dispositivo.
* **Se instala como app** (PWA) en la computadora y en el celular, con ícono propio — nunca copia el logotipo de ProPresenter.
* **Arranca solo con Windows**, se actualiza solo con respaldo y vuelve atrás solo si algo falla.

## Índice
1. [Inicio Rápido](#-inicio-rápido)
2. [Actualizar, Verificar, Detener y Desinstalar](#-actualizar-verificar-detener-y-desinstalar)
3. [Configuración](#️-configuración)
4. [Funcionalidades](#-funcionalidades)
5. [Skills de IA (Claude Code y Antigravity)](#-skills-de-ia-claude-code-y-antigravity)
6. [Seguridad](#-seguridad)
7. [Endpoints de la API de ProPresenter Usados](#-endpoints-de-la-api-de-propresenter-usados)
8. [Comportamientos del ProPresenter Real](#️-comportamientos-del-propresenter-real-2142)
9. [Solución de Problemas](#-solución-de-problemas)
10. [Estructura de Archivos](#-estructura-de-archivos)
11. [Desarrollo](#-desarrollo)
12. [Versiones](#-versiones) · [Autores](#-autores-y-créditos) · [Licencia](#-licencia)

---

## 🚀 Inicio Rápido

### Entornos
* **Producción:** la **propia computadora del ProPresenter** (ej.: `10.0.21.145`). El servidor corre allí, en el puerto **3000**.
* **Desarrollo:** cualquier otra computadora. Los scripts de instalación/actualización corren **en la computadora donde la app está instalada**.

### Requisitos
Windows 10/11 · **Node.js 18+** (el instalador intenta instalarlo con `winget`) · **Git** (`winget install --id Git.Git`) · ProPresenter 7 con la **API de red activada** (Preferencias › Red, puerto 50820).

### Instalación (PowerShell como **Administrador** en la computadora del ProPresenter)
```powershell
git clone https://github.com/nicolasdasilvaesilva/propresenter7-remote-web.git C:\ProPresenter-Remote
powershell -ExecutionPolicy Bypass -File C:\ProPresenter-Remote\scripts\Instalar-Servico.ps1
```
El script:
1. garantiza el Node.js y escribe el `config.json` (detecta el ProPresenter en la misma computadora y usa `127.0.0.1`);
2. crea la tarea programada **`ProPresenter-Remote`** — como Administrador corre como `SYSTEM` **al encender Windows, sin necesitar login, para todos los usuarios**, sin ventana y reiniciando hasta 5 veces si se cae;
3. elimina el iniciador antiguo (carpeta *Inicio*) de todos los usuarios;
4. crea la regla de firewall `ProPresenter Remote (TCP 3000)` (redes Privada y de Dominio);
   *(la ubicación predeterminada de la instalación siempre es `C:\ProPresenter-Remote`: si el script se ejecuta desde otra carpeta, **mueve la instalación allí solo** — clona del mismo GitHub, lleva el `config.json` y continúa desde la nueva ubicación; la carpeta antigua no se elimina)*
5. toma el puerto (cierra una copia antigua del servidor), inicia y **verifica todo**, mostrando las direcciones para el iPad y para la computadora.

Opciones: `-Destino C:\OtraCarpeta` (otra ubicación) · `-NaoMover` (instala donde está) · `-Porta 3000` (puerto del servidor) · `-ProHost 10.0.21.145 -ProPorta 50820` (ProPresenter en otra computadora) · `-SemFirewall` · `-SemIniciar`.

**¿Ya tienes la versión antigua (en otra carpeta)?** Dentro de ella (como Administrador): `git pull origin main` y `powershell -ExecutionPolicy Bypass -File .\scripts\Instalar-Servico.ps1`. El instalador **mueve a `C:\ProPresenter-Remote`**, cierra el servidor antiguo y toma el puerto; después la carpeta antigua puede eliminarse. Luego ejecuta `Instalar-Skill.bat`.

> Sin Administrador funciona, pero la tarea solo arranca **después de que ese usuario inicia sesión** en Windows (y puede que haya que abrir el firewall a mano).

### En el iPad, tablet o celular
1. Conéctate a la **misma red** que la computadora del ProPresenter.
2. Abre `http://10.0.21.145:3000` (el instalador imprime la(s) dirección(es) correcta(s)) — la app **detecta sola** que es un dispositivo táctil y abre la pantalla móvil.
3. **iPad/iPhone (Safari):** Compartir `⎋` › **Agregar a pantalla de inicio**. **Android (Chrome):** menú `⋮` › **Instalar aplicación / Agregar a pantalla de inicio**.

### En la computadora (operador de mesa)
Abre la **misma dirección** (`http://10.0.21.145:3000`) en un navegador de computadora — la app detecta que no es un dispositivo táctil y abre sola la **pantalla Desktop**, con el aspecto del panel oficial de ProPresenter. No hace falta escribir `/desktop/`. Para abrir la pantalla móvil en una computadora de todos modos (prueba), usa `?mobile=1` al final de la dirección. El botón **Instalar App** del propio menú (o el ícono de instalar del navegador, con HTTPS) convierte la pantalla Desktop en una app propia, con ícono en el escritorio.

### Puerto predeterminado
El servidor usa el puerto **3000**. Para otro puerto: `Instalar-Servico.ps1 -Porta 3100` (el script lo escribe en `config.json` y ajusta el firewall) o define `PORT`. Los dispositivos pasan a abrir `http://IP:3100`.

---

## 🔁 Actualizar, Verificar, Detener y Desinstalar

| Atajo (2 clics) | Script | Qué hace |
|---|---|---|
| `Atualizar-Controle-Remoto.bat` | `scripts\Atualizar.ps1` | Actualiza desde GitHub con **respaldo**, detiene solo nuestro servidor, reinicia, **verifica** y **vuelve atrás sola** a la versión anterior si falla |
| `Verificar-Controle-Remoto.bat` | `scripts\Verificar.ps1` | Verifica Node, archivos, servidor, versión, ProPresenter, proxy, tarea, firewall y perfil de red; muestra las direcciones |
| `Parar-Controle-Remoto.bat` | `scripts\Parar-Servidor.ps1` | Detiene **solo** el control remoto (nunca otros programas Node) |
| `Configurar-Inicio-Automatico.bat` | `scripts\Instalar-Servico.ps1` | Instala/reaplica el inicio automático |
| `Desinstalar-Inicio-Automatico.bat` | `scripts\Desinstalar-Servico.ps1` | Elimina la tarea, el iniciador antiguo y la regla de firewall (mantiene archivos y `config.json`) |
| `Iniciar-Controle-Remoto.bat` | — | Corre en primer plano con la ventana de logs (prueba manual) |

Ejecuta los `.bat` **como Administrador** (clic derecho › *Ejecutar como administrador*) cuando la instalación sea para todos los usuarios.

### Cómo la actualización evita el caché antiguo
* El servidor calcula la **versión de los archivos (hash)** — incluyendo las dos pantallas, móvil y escritorio — y la coloca en el `?v=` del `index.html` y en el nombre del caché del service worker **en cada solicitud**. No hay ningún número para incrementar a mano.
* Versión nueva ⇒ el navegador descarga `app.js`/`app-desktop.js`/`style.css` de nuevo; el service worker borra los cachés antiguos.
* La verificación **falla** si la página servida no trae la versión actual.
* **En los dispositivos:** cierra la app y ábrela de nuevo (o recarga 2 veces). Último recurso: quitar el ícono de la pantalla de inicio, borrar los datos del sitio y agregarlo de nuevo.
* Si la actualización falla en cualquier paso, el script **restaura la versión anterior** y levanta el servidor antiguo. Los respaldos quedan en `..\ProPresenter-Remote-backups\` (mantiene 3).

Logs: `logs\server.log` y `logs\server-erro.log` (el anterior queda como `*.anterior.log`).

---

## ⚙️ Configuración

`config.json` (en la carpeta de la app, **fuera de Git**, generado por el instalador):
```json
{ "port": 3000, "proHost": "127.0.0.1", "proPort": 50820 }
```
* **Prioridad:** variable de entorno (`PORT`, `PRO_HOST`, `PRO_PORT`) › `config.json` › predeterminado (3000 / `10.0.21.145` / 50820).
* Cambiar el **IP/puerto del ProPresenter** desde el ícono de engranaje de la app (en las dos pantallas) **escribe** en el `config.json` — sobrevive a reinicios y actualizaciones. (`set-pro-host` solo acepta IP de la red local o nombre de computadora.)
* Endpoints del servidor: `GET /api/server-info` (`proHost`, `proPort`, `port`, `version`, `ips`) y `GET /api/version` (`version`, `startedAt`, `pid`, `node`).

---

## 🌟 Funcionalidades

### 🖥️ Dos pantallas, una sola app
* **Mobile/Tablet** (`/`, celular o iPad): una columna con vista previa en vivo, flechas `<<`/`>>` y la lista de la playlist; en pantallas más anchas (tablet), se convierte en dos columnas con la grilla de todos los slides al lado.
* **Desktop** (`/desktop/`, computadora): aspecto rediseñado desde cero para recordar el panel oficial de ProPresenter (colores, íconos y diseño **originales nuestros**, sin copiar ningún archivo de Renewed Vision) — biblioteca, playlist, medios/ProContent, monitor PGM, pestañas de Audio/Escenario/Temporizadores/Mensajes/Props/Entradas de Video/Captura/Macros, todo en paneles **redimensionables por divisores visibles**.
* **La detección es automática**: la app verifica si el dispositivo tiene táctil (no confía solo en el nombre del navegador — un iPad en Safari se identifica como "Macintosh", pero tiene táctil) y lo manda a la pantalla correcta sola. `?mobile=1` fuerza la pantalla móvil incluso en una computadora, para pruebas.
* Mismo backend, misma instalación, misma actualización — elegir una pantalla no exige nada extra.

### 📖 Presentaciones, letras y playlist
* **Monitor PGM (Desktop) siempre 16:9**, del tamaño exacto del espacio disponible, en cualquier posición de los divisores.
* **Letra siempre nítida:** cuando el slide solo tiene texto, la letra se dibuja en HTML (grande, nítida, fondo negro) — nunca una miniatura pequeña estirada y borrosa. Cuando hay un medio en bucle detrás (video/imagen), la app muestra ambos juntos: el video de fondo **y** la letra nítida encima, sin duplicar ningún texto.
* **Arrastrar para reordenar** la playlist de presentación, con el dedo **o** el mouse (mantén el ícono `⠿` y arrastra) — en las dos pantallas, móvil y escritorio. Reordenar la playlist de **Medios/ProContent no es posible**: la API oficial de ProPresenter solo permite leerla, y la app nunca finge guardar un orden que no va a persistir.
* **Navegación por teclado** en escritorio: flechas `←`/`→`/`↑`/`↓`, `PageUp`/`PageDown` y espacio avanzan/retroceden el slide o el medio en vivo, sin necesidad de hacer clic.
* **Sin "salto":** después de tu toque, la app ignora por unos instantes las respuestas antiguas del ProPresenter, así el resaltado no vuelve solo al slide/canción anterior.
* Las playlists **dentro de carpetas** aparecen (con el nombre de la carpeta); encabezados/placeholders no intentan abrir slides.
* **Atención:** tocar una canción de la playlist (móvil) o un slide específico de la grilla (escritorio) **la pone en vivo**.

### 🎬 Medios / ProContent y transporte de video
* Grilla visual con miniaturas reales, sincronización en tiempo real (cualquier dispositivo, o el propio ProPresenter, que cambie el medio activo actualiza la lista y la grilla con la etiqueta **EN VIVO**).
* **Reproducir, pausar, retroceder 10s y avanzar 10s de verdad** en el video/medio en exhibición, con **barra de progreso real** (posición actual / duración) — no es decoración, es la posición de reproducción real leída de la API. La misma barra también existe para la capa de **Anuncios** y para el **Audio** (MP3).
* **VU meter honesto** al lado del monitor (Desktop): solo reacciona cuando hay audio de verdad reproduciéndose (video con sonido o MP3) — una imagen estática (PNG/JPEG) nunca lo hace moverse, porque no tiene sonido alguno.
* Franja para **limpiar por capa** (Audio, Mensajes, Props, Anuncios, Slide, Medios, Entrada de Video) justo al lado del monitor, con un botón de **limpiar todo**.

### 🔍 Búsqueda global y agregar a la playlist
* Búsqueda instantánea entre más de **4.500** canciones/presentaciones indexadas localmente.
* **Móvil:** popup con lupa, lista de resultados y vista previa de la letra. **Escritorio:** el mismo popup, con "+ Agregar a la Playlist" y "Abrir".
* Escribe **solo en la playlist elegida**, sin poner en vivo. Si la playlist no se encuentra, avisa y **no cambia nada**.

### 🎨 Looks · 🧹 Clear · 🎯 Macros
* **Cambio de Looks de verdad**, con el nombre del Look activo siempre sincronizado — incluso si cambia desde afuera de la app (por un Macro, por otro control, o directo en ProPresenter), la etiqueta se actualiza sola en pocos segundos.
* **Macros** aparecen como lista (igual que el panel oficial): nombre completo de cada uno (no solo un número) y los **íconos de las acciones reales** que ese macro dispara (cambiar Look, limpiar capa, cambiar diseño de escenario, activar prop) — directo de la API, nunca inventado.
* Menú **Clear** por capa y **Clear All**.

### 💬 Mensajes en pantalla (idéntico al panel oficial)
Selector de plantilla (`✓`), texto con `{TOKENS}`, campos `Value:`, `Enter` envía, **Show/Clear**. Guarda los tokens (`PUT`) y dispara (`POST …/trigger`). Los tokens de temporizador/reloj se preservan.

### 🛠️ Herramientas
* **Stage Display:** cambia el diseño de cada pantalla de retorno o de varias a la vez ("Cambiar Retornos de Plataforma"). Cada pantalla tiene el marcador **"Cambiar en conjunto"** (iPad/NDI son independientes por defecto). Los cambios entran en una **cola con verificación** (ProPresenter ignora cambios pegados) y la app avisa qué pantalla falló. También envía/limpia el **mensaje de escenario**.
* **Temporizadores** (iniciar/pausar/reiniciar/+1/+5 min), **Entradas de video**, **Props** (con indicador ACTIVO) y **Captura** (grabar/detener) — todo con datos reales de la API, sin ninguna pestaña "de mentira".

### 🌍 Idiomas
Português, English y Español en las dos pantallas: detecta sola el idioma del dispositivo la primera vez, y cada persona puede elegir el suyo en Configuración (la elección queda solo en ese dispositivo).

### 📱 PWA e instalación
* **Ícono propio, original** (nunca el logotipo de ProPresenter — cuestión de derechos de autor, tomada en serio en este proyecto).
* **Móvil:** modal de instalación por sistema (iPad/iPhone, Android). En **HTTP puro** (red local por `IP:3000`) el navegador **no registra service worker ni ofrece "Instalar aplicación"** — en iOS usa *Agregar a pantalla de inicio* (funciona como app a pantalla completa). La app funciona normalmente sin instalar.
* **Escritorio:** botón **Instalar App** en el menú (desaparece solo apenas se instala, y no vuelve a aparecer si la app ya está corriendo como programa separado).
* Botones más grandes en pantallas táctiles; `Espacio`/flechas no pasan de slide con un popup abierto; `Esc` cierra los popups. Barra de desplazamiento invisible en las dos pantallas.

---

## 🧠 Skills de IA (Claude Code y Antigravity)

Dos skills en formato `SKILL.md`, para **Claude Code** y para **Google Antigravity**:

| Skill | Para qué |
|---|---|
| `propresenter-remote-install` | **Instalar, actualizar, verificar, reparar y desinstalar** (inicio automático con Windows, actualización sin caché antiguo, vuelta atrás) |
| `propresenter-expert` | API, interfaz, arquitectura y las **trampas confirmadas en el ProPresenter real** |

**Instalar las skills** (2 clics en `Instalar-Skill.bat`, o desde la línea de comandos):
```bat
Instalar-Skill.bat              :: Claude Code y Antigravity
Instalar-Skill.bat claude       :: solo Claude Code   (%USERPROFILE%\.claude\skills)
Instalar-Skill.bat antigravity  :: solo Antigravity   (%USERPROFILE%\.gemini\config\skills)
```
Después cierra y abre el asistente de nuevo. Dentro de este repositorio, Claude Code también lee el **`CLAUDE.md`** (reglas del proyecto). Para pedirle la instalación a un asistente en la computadora del ProPresenter, pega el texto de `PROMPT-PARA-ANTIGRAVITY.txt` (sirve para los dos).

---

## 🔒 Seguridad
* La app es servida por su propio servidor (mismo origen): **sin CORS abierto**; escrituras venidas de otro origen reciben **403**.
* `set-pro-host` solo acepta IP de la red local / nombre de computadora y valida el puerto; el cuerpo de las solicitudes está limitado.
* **Límite conocido:** en HTTP puro no hay autenticación — cualquier dispositivo de la red local abre el control remoto, y comandos `GET` de otro sitio abierto en la red igual serían aceptados. Solo contraseña/HTTPS resolverían esto; usa una red Wi-Fi de confianza.

---

## 📡 Endpoints de la API de ProPresenter Usados
`GET /version` · `GET /v1/looks`, `/v1/look/current`, `/v1/look/{id}/trigger` · `GET /v1/macros`, `/v1/macro/{id}/trigger` · `GET /v1/playlists`, `/v1/playlist/{id}`, `/v1/playlist/{id}/{i}/trigger`, **`PUT /v1/playlist/{id}`** (agregar canción y reordenar) · `GET /v1/presentation/{uuid}`, `/thumbnail/{i}`, `/{i}/trigger`, `/v1/presentation/slide_index`, `/v1/trigger/next|previous` · `GET /v1/libraries`, `/v1/library/{id}` · `GET /v1/media/playlists`, `/v1/media/playlist/{id}`, `/{media}/trigger`, `/v1/media/playlist/active`, `/v1/media/{uuid}/thumbnail` · `GET /v1/audio/playlists`, `/v1/audio/playlist/{id}`, `/{track}/trigger`, `/v1/trigger/audio/{next|previous}` · **`GET/PUT /v1/transport/{presentation|announcement|audio}/{current|time}`, `GET /v1/transport/{…}/{play|pause}`** (reproducir/pausar/avanzar/retroceder y barra de progreso reales) · `GET/PUT /v1/message*`, `POST /v1/message/{id}/trigger`, `GET /v1/message/{id}/clear` · `GET /v1/clear/layer/{layer}`, `/v1/clear/group/{id}/trigger` · `GET /v1/stage/screens`, `/v1/stage/layouts`, `/v1/stage/screen/{id}/layout[/{layout}]`, `GET|PUT|DELETE /v1/stage/message`, `GET /v1/status/screens` · `GET /v1/timers/current`, `/v1/timer/{id}/{start|stop|reset|increment/{s}}` · `GET /v1/video_inputs`, `/{id}/trigger` · `GET /v1/props`, `/v1/prop/{id}/trigger|clear` · `GET /v1/capture/status`, **`GET /v1/capture/{start|stop}`**.

---

## ⚠️ Comportamientos del ProPresenter Real (21.4.2)
Medidos en el ProPresenter de producción (la especificación oficial diverge o es omisa en varios puntos):
1. **Leer el diseño del Stage por índice intercambia las pantallas 1 y 2** → la app usa siempre el **UUID** de la pantalla.
2. **Cambios de diseño pegados (<~100 ms) son ignorados** (responde 204 pero no aplica) → cola ≥400 ms + verificación + reintento.
3. **Playlists:** `field_type:"playlist"` y elementos hijos en `children` (la especificación dice `type`/`playlists`); la app acepta ambos.
4. `GET /v1/presentation/{uuid}` viene envuelto en `{presentation:{…}}`; `slide_index` **no** trae el total de slides y devuelve `{presentation_index:null}` sin nada en vivo.
5. **404 es normal** cuando no hay nada en vivo: solo 502/503 o falla de red significa "sin conexión".
6. **Captura** es `GET` (no POST); audio pausado igual trae `name` (usa `is_playing`).
7. **`/v1/transport/{capa}/time` existe y no está documentado en ningún lugar** — `GET` lee la posición actual de reproducción en segundos, `PUT` (con un número en JSON) cambia la posición. Solo funciona para las 3 capas que el propio error 404 revela: `presentation` (cubre slide **y** medio/video, es la misma capa internamente), `announcement` y `audio`. No existe endpoint de marcador/bookmark (eso es solo del editor de ProPresenter) ni de reordenar slides dentro de una presentación (solo la playlist entera).
8. **Una imagen estática (PNG/JPEG) también aparece en `/v1/transport/presentation/current` con una "duración" residual** (ej.: `0.33`s) — no es audio ninguno, es metadato interno; la app ignora duraciones menores a 1,5s para decidir si hay medio real reproduciéndose.
9. `/v1/status/screens` lista los **nombres** de las pantallas configuradas (audiencia/escenario), pero **no existe ningún endpoint que devuelva una imagen de lo que se está mostrando** en una pantalla específica — solo el feed NDI de cada una resolvería eso, fuera del alcance de la API REST.

---

## 🩺 Solución de Problemas
Ejecuta **`Verificar-Controle-Remoto.bat`**: te dice qué está mal.

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| iPad/computadora no abre la página | Servidor detenido, firewall, red de Windows como **Pública**, IP de la PC cambió | Verificar; ejecutar `Configurar-Inicio-Automatico.bat` como Admin; cambiar la red a **Privada**; reservar IP fija en el router |
| Abre, pero el punto queda rojo | ProPresenter cerrado / API apagada / IP o puerto incorrectos | Abrir ProPresenter; Preferencias › Red; ajustar en el ícono de engranaje de la app |
| Abrió la pantalla equivocada (móvil en una PC, o al revés) | Detección táctil del navegador | Usa `?mobile=1` al final de la dirección para forzar la pantalla móvil en una computadora; en una tablet híbrida, la pantalla móvil es la esperada (tiene táctil) |
| Aparece versión antigua | Caché del dispositivo | Cerrar/abrir la app; recargar 2×; quitar el ícono y agregarlo de nuevo |
| `El puerto 3000 ya está en uso` | Otra copia u otro programa | `Parar-Controle-Remoto.bat`; ver quién lo usa: `Get-NetTCPConnection -LocalPort 3000` |
| No arranca después de reiniciar Windows | Instalado sin Administrador (solo arranca después del login) | `Configurar-Inicio-Automatico.bat` como Administrador |
| La actualización "volvió atrás" | La versión nueva no arrancó/verificó | Leer `logs\server-erro.log`; respaldo en `..\ProPresenter-Remote-backups` |
| "Hay cambios locales" al actualizar | Un archivo versionado fue editado | `git status`; `Atualizar.ps1 -Forcar` los guarda en stash |

---

## 📁 Estructura de Archivos
```text
├── server.js                         # Servidor HTTP, proxy /api/v1, enruta / (móvil) y /desktop/, config.json, versión de los archivos
├── config.json                       # (generado) IP/puerto — fuera de Git
├── CLAUDE.md                         # Reglas del proyecto para Claude Code
├── Configurar-Inicio-Automatico.bat  # Instala/reaplica el inicio automático (Ejecutar como Administrador)
├── Atualizar-Controle-Remoto.bat     # Actualiza, reinicia, verifica, vuelve atrás si falla
├── Verificar-Controle-Remoto.bat     # Verifica todo y muestra las direcciones
├── Parar-Controle-Remoto.bat         # Detiene solo el control remoto
├── Desinstalar-Inicio-Automatico.bat # Elimina el inicio automático
├── Iniciar-Controle-Remoto.bat       # Primer plano (prueba)
├── Iniciar-Segundo-Plano.vbs         # Inicia invisible (usado por la tarea programada)
├── Instalar-Skill.bat                # Instala las skills (Claude Code y/o Antigravity)
├── 1-Instalar-NodeJS.bat             # Instalador de Node.js LTS
├── PROMPT-PARA-ANTIGRAVITY.txt       # Prompt para que un asistente instale todo
├── COMO-INSTALAR.txt                 # Guía rápida
├── MEMORIA_PROJETO.md · PAUSA-*.md   # Registro técnico del proyecto
├── scripts/                          # PowerShell: Instalar-Servico, Atualizar, Verificar, Parar-Servidor,
│                                     #   Desinstalar-Servico, Iniciar-Servidor, Firewall, _comum
├── public/                           # Pantalla MÓVIL/TABLET (raíz "/")
│   ├── index.html · manifest.json · service-worker.js
│   ├── css/style.css                 # Tema oscuro estilo ProPresenter
│   ├── js/app.js                     # Lógica: API, polling, arrastrar playlist, Stage, mensajes, PWA…
│   ├── js/i18n.js                    # Diccionario pt-BR/en/es, compartido por las dos pantallas
│   └── img/                          # Íconos originales (192/512, apple-touch, logo, favicon)
├── public-desktop/                   # Pantalla DESKTOP ("/desktop/"), aspecto del panel oficial
│   ├── index.html · manifest.json
│   ├── css/style.css                 # Barra de herramientas en píldora, monitor PGM 16:9, clear-strip, VU meter…
│   └── js/app-desktop.js             # Lógica propia: PGM compuesto, transporte de medios, macros, Look…
└── skills/
    ├── propresenter-expert/SKILL.md
    └── propresenter-remote-install/SKILL.md
```

---

## 🧪 Desarrollo
```powershell
node server.js                                                      # http://localhost:3000 (PRO_HOST / PRO_PORT apuntan al ProPresenter)
node --check server.js
node --check public\js\app.js; node --check public-desktop\js\app-desktop.js  # sintaxis de las dos pantallas (sin pruebas automatizadas)
```
* Sin `npm install` (solo módulos nativos de Node). Node **18+** (usa `fetch`).
* Al probar contra el ProPresenter real, comienza solo con lecturas; **nada que cambie lo que está en vivo** sin las pantallas libres.
* La versión de los archivos es automática — no edites números de versión.
* Scripts `.ps1` en UTF-8 **con BOM**; JSON escrito por PowerShell **sin BOM**.

---

## 📦 Versiones
* **v1.5.6** — pantalla "Enviar Aviso": botón "Salir" en el encabezado, y la PWA instalable corregida de una vez por todas (Cloudflare guardaba los archivos JS/CSS en caché hasta por 4h e ignoraba el `Cache-Control` del servidor, causando instalación/actualización inconsistente — ahora usa `no-store`, que Cloudflare sí respeta, más una nueva versión de los archivos para forzar lo que ya estaba en caché). También nuevo en las tres pantallas (mobile, desktop y Enviar Aviso): cuando un mensaje sale de la pantalla solo — ya sea porque se agota el tiempo configurado en la plantilla, o porque se limpia directo en ProPresenter — la app lo nota y resetea el botón sola, sin necesitar tocar "Limpiar".
* **v1.5.5** — acceso público a "Enviar Aviso" por internet (4G, sin necesitar el Wi-Fi de la iglesia): servidor aislado (`mensagens-publico.js`), login propio por usuario/contraseña, panel admin para crear/editar/eliminar usuarios sin necesitar terminal, y guía completa para correrlo en una máquina Linux separada con túnel de Cloudflare. Mismo backend, cero cambios en la app local.
* **v1.5.4** — el mensaje en pantalla salía con `${uuid}` en lugar del valor escrito (ej.: `${05b2fedf-...}` en vez de "CRUZE") al enviar desde móvil, desktop o la piel "Enviar Aviso" — enviando directo desde ProPresenter funcionaba perfecto. Causa: al reenviar el mensaje, quitábamos el `uuid` de cada variable y mandábamos solo el nombre; ProPresenter guarda el texto referenciando la variable por UUID, no por nombre, así que sin él no podía asociar el valor nuevo con el lugar correcto. Corregido en los tres (móvil/desktop/mensajes) y confirmado en vivo.
* **v1.5.3** — nueva piel `/mensagens/`, para enviar un aviso a la pantalla sin ser el operador entrenado (ujieres, seguridad del estacionamiento) — instalable en su propio celular, muestra todos los modelos de mensaje ya configurados en ProPresenter y pide confirmación antes de enviar de verdad.
* **v1.5.2** — el PGM (móvil) solo mostraba "lo que está realmente en vivo" cuando el tipo de playlist abierto en el dispositivo (Medios o Presentación) coincidía con lo que estaba realmente en vivo en ProPresenter; navegando en una playlist de canciones mientras un video de Medios se reproducía (o al revés), el PGM se quedaba sin mostrar nada. Ahora el PGM siempre sigue lo que está realmente en vivo, en cualquier combinación, sin cambiar la playlist/carpeta que el operador está navegando.
* **v1.5.1** — Macros, Looks, Escenario, Audio, Mensajes, Props y Entradas de Video también se quedaban atascados vacíos en Desktop si ProPresenter no respondía a tiempo de la conexión (hallado en producción: Macros vacío incluso con ProPresenter encendido); ahora todos se recuperan solos, igual que playlist/biblioteca/medios. Corregido también el cálculo de la versión de los archivos, que nunca detectaba cambios en el JS del Desktop (buscaba `app.js`, el archivo correcto es `app-desktop.js`) — podía dejar el navegador atascado en una versión mucho más antigua incluso después de actualizar el servidor. En móvil, el Look también ganó la misma recuperación automática.
* **v1.5.0** — corregido el arrastrar y soltar de la playlist en móvil: al soltar cerca de una canción vecina, la tarjeta saltaba a la posición equivocada (confirmado en un iPad real); resuelto compensando el desplazamiento de diseño en cada cambio. Desapareció el contenido de ejemplo que quedaba atascado en la pantalla del escritorio (playlist/medios ficticios) cuando ProPresenter todavía no había respondido al momento de la conexión; ahora playlist, biblioteca y medios se cargan solos apenas aparecen en ProPresenter, sin necesitar reiniciar la app (móvil y escritorio).
* **v1.4.0** — Blackout, Grupos de Limpieza y skip nativo (±segundos de verdad) de video/audio, temporizador regresivo de video — todo vía la API oficial de ProPresenter.
* **v1.3.1** — letra del PGM siempre nítida (HTML) y sin duplicar/sobrar texto detrás; fondo negro igual que en móvil.
* **v1.3.0** — transporte real (reproducir/pausar/avanzar-retroceder 10s/barra de progreso) de medios y anuncios; VU meter honesto; arrastrar y soltar por táctil/mouse en móvil; Macros en lista con nombre y acciones reales; menú del escritorio rediseñado en píldora igual que móvil; clear-strip fijo al lado del monitor.
* **v1.2.0** — versión **Desktop** (aspecto del panel oficial), soporte para **3 idiomas** en las dos pantallas, reordenar playlist (flechas), auto-detección desktop/móvil.
* **v1.1.1** — el instalador toma el puerto y cierra el servidor antiguo.
* **v1.1.0** — inicio automático con Windows, actualización segura con vuelta atrás, versión automática de los archivos, `config.json`, skills nuevas; correcciones del Stage (UUID + cola), del "salto", playlists en carpetas, captura, audio y seguridad.
* **v1.0.0** — primera versión.

Releases: <https://github.com/nicolasdasilvaesilva/propresenter7-remote-web/releases>

---

## 👥 Autores y Créditos
* **Autor y desarrollador:** **Nicolas da Silva e Silva**
* **Diseñador de funciones:** **Marcelo Rocha**

---

## 📄 Licencia
Distribuido bajo la **Licencia MIT** con **atribución obligatoria de los créditos a los autores originales**.

Se permite el uso, copia, modificación, fusión y distribución de este software, **siempre que se mantenga obligatoriamente la cita expresa de los autores**:
* **Autor y desarrollador:** Nicolas da Silva e Silva
* **Diseñador de funciones:** Marcelo Rocha

Para el término legal completo, consulta el archivo [`LICENSE`](./LICENSE).
