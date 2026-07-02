# 📆 ReservasEC

**ReservasEC** es una plataforma fullstack de gestión de reservas desarrollada con una arquitectura de microservicios. Permite a los usuarios registrarse, iniciar sesión, gestionar su perfil, crear y cancelar reservas, y recibir notificaciones. El sistema está dockerizado para facilitar el despliegue local.

## 🚀 Tecnologías principales

- **Frontend:** Next.js + Tailwind CSS
- **Backend (Microservicios):**
  - Auth Service (Node.js + Express)
  - Booking Service (Node.js + Express)
  - User Service (Node.js + Express)
  - Notification Service (Node.js + Express + Nodemailer)
- **Base de datos:** MongoDB
- **Autenticación:** JSON Web Tokens (JWT)
- **Contenedores:** Docker + Docker Compose

---

## 📁 Estructura de carpetas

```plaintext
/reservas-ec
├── frontend/             # Next.js App
├── auth-service/         # Servicio de autenticación
├── user-service/         # Servicio de usuarios
├── booking-service/      # Servicio de reservas
├── notification-service/ # Servicio de notificaciones por email
└── docker-compose.yml    # Orquestación de todos los servicios
```

---

## ⚙️ Configuración del entorno

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/reservas-ec.git
cd reservas-ec
```

### 2. Variables de entorno

🔐 Frontend (frontend/.env.production.local)

```bash
NEXT_PUBLIC_API_URL=/api/auth
NEXT_PUBLIC_BOOKING_URL=/api/bookings
NEXT_PUBLIC_USER_URL=/api/users
```

🔐 Backend .env (cada microservicio)
Ejemplo para auth-service:

```bash
PORT=4000
MONGO_URI=mongodb://mongo:27017/auth-db
JWT_SECRET=supersecretkey
```

Repite para los demás servicios cambiando PORT, MONGO_URI y usando el mismo JWT_SECRET.

### 3. 🐳 Uso con Docker

1. Construir los contenedores

```bash
docker-compose build
```

3. Levantar los servicios

```bash
docker-compose up
```

La app estará disponible en http://localhost:3000

## ✅ Funcionalidades principales

- Registro e inicio de sesión de usuarios
- Perfil editable
- Creación y cancelación de reservas
- Historial de reservas activas y canceladas
- Límite de 5 reservas canceladas visibles
- Notificaciones por email (reserva y cancelación)
- Gestión de microservicios independientes

---

## 🤖 Bot de Telegram — Notificaciones de Commits

El bot **@Fenntobot** notifica automáticamente al grupo de Telegram en cada `push` o `pull_request` al repositorio.

### Configuración de Secrets en GitHub

Para que el workflow funcione, debes agregar estos dos **secrets** en tu repositorio:

1. Ir a: `GitHub → Settings → Secrets and variables → Actions → New repository secret`

| Secret Name           | Valor                                      |
|-----------------------|--------------------------------------------|
| `TELEGRAM_BOT_TOKEN`  | Token del bot (obtenido de @BotFather)     |
| `TELEGRAM_CHAT_ID`    | ID numérico del grupo de Telegram          |

> ⚠️ **Nunca expongas el token del bot ni el Chat ID directamente en el código fuente.**

### Cómo obtener el Chat ID del grupo

1. Agregar el bot al grupo de Telegram.
2. Enviar cualquier mensaje en el grupo.
3. Consultar:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

4. Buscar el campo `"id"` dentro de `"chat"` en la respuesta JSON.

### Información incluida en cada notificación

- 🚀 Tipo de evento (push o pull request)
- 📌 Repositorio
- 🌿 Rama afectada
- 👤 Autor del commit
- 🔖 Hash del commit (7 caracteres)
- 💬 Mensaje del commit
- 📄 Archivos modificados (hasta 20)
- 🔗 Enlace directo al commit en GitHub

### Workflow

El archivo del workflow está en: [`.github/workflows/telegram-notify.yml`](./.github/workflows/telegram-notify.yml)

Se ejecuta automáticamente en:
- `push` a cualquier rama
- `pull_request` a `main` o `develop`

---

## 🔎 Calidad de código con SonarQube

Este repositorio incluye una configuración local para analizar únicamente el backend con SonarQube Community Edition usando la imagen Docker que ya tienes en WSL Ubuntu: `sonarqube:9.9-community`.

### 1. Levantar SonarQube localmente

Desde WSL Ubuntu o desde una terminal con Docker disponible:

```bash
docker-compose -f docker-compose.sonar.yml up -d
```

El servidor quedará disponible en `http://localhost:9090`.

### 2. Ejecutar el análisis manualmente

El análisis toma como entrada el archivo `sonar-project.properties` ubicado en la raíz del repositorio.

Si tienes instalado Sonar Scanner en tu entorno, ejecuta:

```bash
sonar-scanner -Dsonar.host.url=http://localhost:9090 -Dsonar.login=TU_TOKEN
```

Si prefieres usar Docker para el scanner, apunta el contenedor al mismo servidor local y monta el repositorio como volumen.

### 3. StrictGate

La definición del Quality Gate está documentada en `qualitygate.json`. El criterio es estricto y falla cuando aparecen problemas bloqueantes, deuda técnica alta, duplicación excesiva, cobertura baja o complejidad fuera de rango.

### 4. Informe de problemas por módulo

El detalle de hallazgos por servicio está en `backend-quality-report.md`.

### 5. Evidencia del Quality Gate fallido

El proyecto queda preparado para que el análisis falle con la configuración actual del backend. La evidencia esperada es la ejecución contra SonarQube local con StrictGate en estado `FAILED`.

---

## Notas de seguridad

El archivo `docker-compose.yml` actual todavía contiene credenciales embebidas para los servicios de notificación y autenticación. SonarQube las detectará como deuda/vulnerabilidad y conviene migrarlas a variables de entorno o a un gestor de secretos.
