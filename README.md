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

## 🔍 SonarQube — Quality Gates

### Levantar SonarQube localmente (Docker)

```bash
docker run -d --name sonarqube \
  -p 9000:9000 \
  sonarqube:community
```

Acceder en: http://localhost:9000 (usuario/contraseña por defecto: `admin/admin`)

### Ejecutar análisis manualmente

```bash
# Instalar sonar-scanner globalmente
npm install -g sonar-scanner

# Desde la raíz del proyecto
sonar-scanner \
  -Dsonar.projectKey=reservas-ec \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=<TU_TOKEN_SONAR>
```

### Quality Gate — StrictGate

El Quality Gate personalizado `StrictGate` está definido en [`qualitygate.json`](./qualitygate.json) con los siguientes umbrales:

| Métrica                       | Condición       | Umbral |
|-------------------------------|-----------------|--------|
| Blocker Issues                | mayor que       | 0      |
| Critical Issues               | mayor que       | 0      |
| Major Issues                  | mayor que       | 5      |
| Security Hotspots Reviewed    | menor que       | 100%   |
| Coverage                      | menor que       | 80%    |
| Duplicated Lines (%)          | mayor que       | 3%     |
| Technical Debt Ratio          | mayor que       | 2.5%   |
| Cyclomatic Complexity (total) | mayor que       | 50     |
| Cognitive Complexity (total)  | mayor que       | 30     |

> Para importar en SonarQube: **Administration → Quality Gates → Create** con nombre `StrictGate` y agregar cada condición según el archivo `qualitygate.json`.

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

a