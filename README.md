# ReservasEC

ReservasEC es una plataforma fullstack de gestion de reservas desarrollada con una arquitectura de microservicios. Permite a los usuarios registrarse, iniciar sesion, gestionar su perfil, crear y cancelar reservas, y recibir notificaciones. El sistema esta dockerizado para facilitar el despliegue local.

## Tecnologias principales

- Frontend: Next.js + Tailwind CSS
- Backend:
  - Auth Service: Node.js + Express
  - Booking Service: Node.js + Express
  - User Service: Node.js + Express
  - Notification Service: Node.js + Express + Nodemailer
- Base de datos: MongoDB
- Autenticacion: JSON Web Tokens
- Contenedores: Docker + Docker Compose

## Estructura de carpetas

```text
reservas-ec/
├── frontend/
├── auth-service/
├── user-service/
├── booking-service/
├── notification-service/
├── docker-compose.yml
├── docker-compose.sonarqube.yml
├── qualitygate.json
└── sonar-project.properties
```

> El análisis de SonarQube cubre todo el proyecto: backend y frontend. Para que el workflow corra en GitHub Actions, `SONAR_HOST_URL` debe ser una URL accesible desde Internet o un túnel público. `localhost` solo sirve para pruebas manuales locales.

## Configuracion del entorno

### Variables de entorno

Copia `.env.example` como `.env` y reemplaza los valores locales:

```bash
cp .env.example .env
```

No subas archivos `.env` ni credenciales reales al repositorio.

### Uso con Docker

Construir los contenedores:

```bash
docker compose build
```

Levantar los servicios:

```bash
docker compose up
```

La app estara disponible en `http://localhost:3000`.

## Funcionalidades principales

- Registro e inicio de sesion de usuarios
- Perfil editable
- Creacion y cancelacion de reservas
- Historial de reservas activas y canceladas
- Limite de 5 reservas canceladas visibles
- Notificaciones por email de reserva y cancelacion
- Gestion de microservicios independientes

## Quality Gate con SonarQube

Este repositorio incluye la configuracion solicitada para ejecutar analisis estatico con SonarQube Community Edition y bloquear integraciones cuando no se cumpla el Quality Gate `StrictGate`.

### Levantar SonarQube local

```bash
docker compose -f docker-compose.sonarqube.yml up -d
```

Luego ingresa a `http://localhost:9001`. El compose usa el puerto `9001` por defecto para evitar conflictos con otras instancias locales de SonarQube. Si quieres otro puerto, define `SONARQUBE_PORT` antes de levantar el servicio. En una instalacion nueva, SonarQube solicita iniciar sesion con `admin/admin` y cambiar la contrasena. Despues crea un token de analisis desde:

```text
My Account > Security > Generate Tokens
```

### Crear el Quality Gate StrictGate

El archivo `qualitygate.json` documenta la configuracion exigida por el taller. Tambien se incluye un script para crearla por API en una instancia local:

```powershell
.\tools\sonarqube\create-strictgate.ps1 -SonarUrl "http://localhost:9001" -Token "<SONAR_TOKEN>"
```

Umbrales configurados:

| Metrica | Condicion de fallo |
| --- | --- |
| Blocker Issues | mayor que 0 |
| Critical Issues | mayor que 0 |
| Major Issues | mayor que 5 |
| Security Hotspots Reviewed | menor que 100% |
| Coverage | menor que 80% |
| Duplicated Lines (%) | mayor que 3% |
| Technical Debt Ratio | mayor que 2.5% |
| Cyclomatic Complexity total | mayor que 50 |
| Cognitive Complexity total | mayor que 30 |

### Analisis manual

Con `sonar-scanner` instalado en tu maquina:

```bash
sonar-scanner -Dsonar.host.url=http://localhost:9001 -Dsonar.login=<SONAR_TOKEN>
```

Ese puerto y host solo aplican para pruebas manuales locales.

La configuracion base vive en `sonar-project.properties` y contiene `sonar.qualitygate.wait=true`, por lo que el analisis espera el resultado del Quality Gate.

### Pipeline GitHub Actions

El workflow esta en `.github/workflows/sonarqube.yml` y se ejecuta en:

- `push` a `main`
- `push` a `develop`
- `pull_request`

Configura estos secretos en GitHub:

| Secreto | Uso |
| --- | --- |
| `SONAR_TOKEN` | Token generado en SonarQube para ejecutar analisis |

> ⚠️ No subas el valor real del token al repositorio. En GitHub ve a **Settings → Secrets and variables → Actions** y crea el secreto `SONAR_TOKEN` con el token que generaste en SonarQube (ej. `sqp_...`).

El workflow de GitHub Actions levanta SonarQube (`sonarqube:lts-community`) y PostgreSQL como service containers dentro del runner y ejecuta el analisis contra `http://localhost:9000`. No necesitas exponer SonarQube con una URL publica para el pipeline.

## Notificaciones Telegram

El workflow `.github/workflows/telegram-notify.yml` envia una notificacion automatica por cada `push` a `main` o `develop`.

### Crear bot y obtener Chat ID

1. En Telegram, abre `@BotFather` y ejecuta `/newbot`.
2. Guarda el HTTP token del bot sin subirlo al repositorio.
3. Crea el grupo del equipo e invita al bot.
4. Envia un mensaje al grupo.
5. Consulta el Chat ID con:

```text
https://api.telegram.org/bot<TOKEN>/getUpdates
```

### Secretos de GitHub

Configura estos secretos:

| Secreto | Uso |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token HTTP entregado por BotFather |
| `TELEGRAM_CHAT_ID` | Identificador del grupo donde se enviaran los mensajes |

La notificacion incluye autor, rama, enlace al commit y lista de archivos modificados. El resultado de SonarQube queda enlazado al workflow de Quality Gate.

## Roles del equipo

| Rol | Responsable |
| --- | --- |
| Lider de calidad | Configura SonarQube, importa `StrictGate` y valida los umbrales |
| DevOps | Mantiene los workflows de GitHub Actions y secretos de CI/Telegram |
| Desarrolladores | Corrigen issues, duplicacion, cobertura y deuda tecnica reportados por SonarQube |

## Evidencia funcional requerida

Para completar la entrega academica, adjunta estas capturas despues de configurar tus secretos reales:

1. SonarQube mostrando el proyecto `app-reservas` con el Quality Gate `StrictGate` fallido. La consigna menciona `orders-service`, pero en este repositorio el servicio equivalente es `booking-service`.
2. Grupo de Telegram mostrando una notificacion automatica generada por un commit en `main` o `develop`.

No subas tokens, Chat IDs privados, capturas que muestren secretos, archivos `.env` ni credenciales reales. Usa `.env.example` como plantilla local.
