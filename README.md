# CodexView — Token Usage Dashboard para OpenCode

Dashboard estilo GitHub Contribution Grid que muestra el uso de tokens de **OpenCode**.

## Demo (Vercel — sin instalación)

**[https://token-codex.vercel.app](https://token-codex.vercel.app)**

Abrí el link y ya. El frontend muestra una pantalla de espera hasta que el servidor local esté corriendo en tu PC.

---

## ⚙️ Instalación en un equipo nuevo

### Requisitos

- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **OpenCode Desktop** instalado y usado al menos una vez (para que exista la base de datos)

### 1. Clonar el repositorio

```bash
git clone <url-del-repo> token-codex-view
cd token-codex-view
```

### 2. Instalar dependencias del servidor local

```bash
cd local-server
npm install
```

### 3. Iniciar el servidor

```bash
node src/index.js
```

Deberías ver:
```
[token-codex] Local server running on http://127.0.0.1:8765
[token-codex] DB: C:\Users\tuuser\.local\share\opencode\opencode.db
```

### 4. Abrir el Dashboard

Andá a **[https://token-codex.vercel.app](https://token-codex.vercel.app)** desde el mismo equipo.

> ⚠️ La página detecta automáticamente si el servidor está corriendo. Si ves "Could not load", esperá unos segundos o verificá que el servidor local esté activo.

---

## 🔌 Plugin de OpenCode (inicio automático)

Para que el servidor arranque y se cierre solo con OpenCode:

### 1. Copiar el plugin

Creá `~/.config/opencode/plugins/codexview-server.js` con el siguiente contenido, ajustando `PROJECT_DIR` a la ruta de tu `local-server/`:

```javascript
import { spawn, spawnSync } from "child_process";
import { join } from "path";

const SERVER_PORT = 8765;
const PROJECT_DIR = "C:/ruta/completa/a/token-codex-view/local-server";
const SERVER_SCRIPT = join(PROJECT_DIR, "src", "index.js");
const HEALTH_URL = `http://127.0.0.1:${SERVER_PORT}/api/health`;

let serverProcess = null;

function waitForHealth(retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      fetch(HEALTH_URL)
        .then((r) => r.json())
        .then((body) => {
          if (body.status === "ok") resolve();
          else if (attempts < retries) setTimeout(check, delay);
          else reject(new Error("Health check failed"));
        })
        .catch(() => {
          if (attempts < retries) setTimeout(check, delay);
          else reject(new Error("Server not reachable"));
        });
    };
    check();
  });
}

async function startServer() {
  if (serverProcess) return;
  serverProcess = spawn("node", [SERVER_SCRIPT], {
    cwd: PROJECT_DIR,
    stdio: "ignore",
    detached: false,
    env: { ...process.env, OPENCODE_SERVER_WATCHDOG: "1" },
  });
  serverProcess.on("exit", () => { serverProcess = null; });
  serverProcess.on("error", (err) => {
    console.error("[CodexView] Failed to start server:", err.message);
    serverProcess = null;
  });
  try {
    await waitForHealth();
    console.log(`[CodexView] Server running on :${SERVER_PORT}`);
  } catch {
    console.error("[CodexView] Server did not start in time");
  }
}

function stopServer() {
  if (!serverProcess) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"], {
        stdio: "ignore",
      });
    } else {
      serverProcess.kill("SIGTERM");
    }
  } catch {}
  serverProcess = null;
}

process.on("SIGINT", () => { stopServer(); process.exit(0); });
process.on("SIGTERM", () => { stopServer(); process.exit(0); });
process.on("exit", stopServer);

const plugin = async () => {
  await startServer();
  return {};
};

export default plugin;
```

### 2. Registrar el plugin en OpenCode

Agregalo en `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "./plugins/codexview-server.js"
  ]
}
```

### 3. Reiniciar OpenCode

El servidor arranca solo al abrir OpenCode y se cierra al cerrarlo.

---

## 📊 Vistas del Dashboard

| Vista | Descripción |
|-------|------------|
| **Daily** | Cuadrícula SVG estilo GitHub con filtro por año. Scroll solo con "All" |
| **Weekly** | Barras verticales con Recharts (últimas 12 semanas) |
| **Monthly** | Barras por mes con acumulado |
| **Cumulative** | Línea de crecimiento acumulado con Recharts |

Debajo de la vista Daily aparecen dos columnas con métricas de actividad:
- **Datos de actividad**: modo rápido, razonamiento, herramientas usadas, tareas totales
- **Complementos más usados**: MCP, Skill, Agentes

---

## 🏗 Estructura del proyecto

```
token-codex-view/
├── local-server/          ← Servidor local (Express + better-sqlite3)
│   ├── src/index.js       ← Endpoints: /api/health, /api/usage/*
│   ├── src/db.js          ← Conexión read-only a opencode.db
│   └── package.json
├── web/                   ← Frontend Next.js (deploy en Vercel)
│   ├── app/page.tsx       ← Página principal con tabs + métricas
│   ├── components/        ← Contribution grid, charts, header, metrics
│   └── package.json
├── scripts/
└── README.md
```

## 🚀 Deploy (solo web/)

```bash
cd web
npm install
npm run dev        # Desarrollo local en :3000
npm run build      # Build para producción
```

---

## 🔧 Troubleshooting

**"Could not load monthly data" / "Could not load" en Activity Metrics**
→ El servidor local no está corriendo o falta algun endpoint nuevo. Reinicialo con `node src/index.js` desde `local-server/`.

**El servidor no se cierra al cerrar OpenCode**
→ Verificá que `detached: false` en el plugin. Si el proceso hijo persiste, terminalo manualmente con `taskkill /f /im node.exe` (esto mata todos los procesos Node).

**La página de Vercel no carga datos**
→ El frontend en Vercel solo funciona si el servidor local está corriendo en tu PC. Si estás en un equipo distinto, usá el desarrollo local (`npm run dev` en `web/`).

**Error "no such column" en el servidor**
→ La base de datos de OpenCode cambió de schema. Actualizá el servidor local con `git pull`.
