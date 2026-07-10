# CodexView — Token Usage Dashboard para OpenCode

Dashboard estilo GitHub Contribution Grid que muestra el uso de tokens de **OpenCode** en los últimos 12 meses.

## 🖥 Demo (Vercel — sin instalación)

**[https://token-codex.vercel.app](https://token-codex.vercel.app)**  

Abre el link y ya. El frontend muestra una pantalla de espera hasta que el servidor local esté corriendo.

---

## ⚙️ Servidor Local (para ver tus datos reales)

El frontend necesita un servidor local en tu PC que lea la base de datos de OpenCode y exponga los datos vía HTTP.

### Requisitos

- **Node.js 18+** (descargar en [nodejs.org](https://nodejs.org))
- **OpenCode Desktop** instalado y usado al menos una vez (para que exista la base de datos)

### Instalación

```bash
# 1. Clonar el repo
git clone <url-del-repo> token-codex-view
cd token-codex-view

# 2. Instalar dependencias del servidor local
cd local-server
npm install
```

### Inicio manual

```bash
# Desde la carpeta local-server/
node src/index.js
```

Deberías ver:

```
[token-codex] Local server running on http://127.0.0.1:8765
[token-codex] DB: C:\Users\tuuser\.local\share\opencode\opencode.db
```

### Inicio automático (plugin de OpenCode)

Para que el servidor arranque solo cuando abres OpenCode:

1. Asegúrate de que la ruta en `~/.config/opencode/plugins/codexview-server.js` apunte a tu carpeta `local-server/`
2. Verifica que `~/.config/opencode/opencode.json` incluya el plugin:

```json
"plugin": [
  "./plugins/codexview-server.js"
]
```

3. Reinicia OpenCode. El servidor arrancará solo.

### Verificar que funciona

```bash
curl http://127.0.0.1:8765/api/health
```

Respuesta esperada:

```json
{ "status": "ok", "opencode": "running", "db": "accessible" }
```

---

## 📊 Vistas del Dashboard

| Vista | Descripción |
|-------|------------|
| **Daily** | Cuadrícula SVG estilo GitHub (12 meses, 5 niveles de intensidad) |
| **Weekly** | Barras verticales con Recharts (últimas 12 semanas) |
| **Cumulative** | Línea de crecimiento acumulado con Recharts |

---

## 🏗 Estructura del proyecto

```
token-codex-view/
├── local-server/        ← Servidor local (Express + better-sqlite3)
│   ├── src/index.js     ← Endpoints: /api/health, /api/usage/*
│   ├── src/db.js        ← Conexión read-only a opencode.db
│   └── package.json
├── web/                 ← Frontend Next.js (deploy en Vercel)
│   ├── app/page.tsx     ─ Página principal con tabs
│   ├── components/      ─ Contribution grid, charts, header, offline
│   └── package.json
├── scripts/             ← Scripts de inicio rápido
└── README.md
```

## 🚀 Deploy (solo web/)

El frontend está deployado en Vercel automáticamente. Para modificarlo:

```bash
cd web
npm install
npm run dev        # Desarrollo local en :3000
npm run build      # Build para producción
```

El local server nunca se deploya — solo corre en tu PC.
