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

<<<<<<< HEAD
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
sonar-scanner -Dsonar.host.url=http://localhost:9001 -Dsonar.token=<SONAR_TOKEN>
```

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
| `SONAR_HOST_URL` | URL del servidor SonarQube, por ejemplo `http://localhost:9001` si usas runner self-hosted o una URL publica accesible para GitHub Actions |

Si SonarQube solo corre en tu PC como `localhost`, usa un runner self-hosted en esa misma maquina o publica temporalmente la instancia con una URL segura. Un runner hospedado por GitHub no puede acceder a tu `localhost`.

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

1. SonarQube mostrando el proyecto `reservas-ec` con el Quality Gate `StrictGate` fallido. La consigna menciona `orders-service`, pero en este repositorio el servicio equivalente es `booking-service`.
2. Grupo de Telegram mostrando una notificacion automatica generada por un commit en `main` o `develop`.

No subas tokens, Chat IDs privados, capturas que muestren secretos, archivos `.env` ni credenciales reales. Usa `.env.example` como plantilla local.
=======
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
<<<<<<< HEAD
- `pull_request` a `main` o `develop`
=======
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

### 2.1 Secrets del workflow

El workflow `.github/workflows/sonarqube.yml` usa estos secrets de GitHub Actions:

| Secret | Uso |
|---|---|
| `SONAR_TOKEN` | Token generado en SonarQube para el usuario que ejecuta el análisis |
| `SONAR_HOST_URL` | URL del servidor SonarQube local, en este caso `http://127.0.0.1:9090` |

> No se debe guardar el token en el repositorio. Debe configurarse en `GitHub → Settings → Secrets and variables → Actions`.

Si haces la prueba local con `sonar-scanner`, puedes usar directamente:

```bash
sonar-scanner -Dsonar.host.url=http://127.0.0.1:9090 -Dsonar.login=TU_TOKEN
```

### 3. StrictGate

La definición del Quality Gate está documentada en `qualitygate.json`. El criterio es estricto y falla cuando aparecen problemas bloqueantes, deuda técnica alta, duplicación excesiva, cobertura baja o complejidad fuera de rango.

### 4. Informe de problemas por módulo

El detalle de hallazgos por servicio está en `backend-quality-report.md`.

### 5. Evidencia del Quality Gate fallido

El proyecto queda preparado para que el análisis falle con la configuración actual del backend. La evidencia esperada es la ejecución contra SonarQube local con StrictGate en estado `FAILED`.

---

## Notas de seguridad

El archivo `docker-compose.yml` actual todavía contiene credenciales embebidas para los servicios de notificación y autenticación. SonarQube las detectará como deuda/vulnerabilidad y conviene migrarlas a variables de entorno o a un gestor de secretos.
>>>>>>> d8afdbae13808f5b0bec758dd6c24b525e3070d3
>>>>>>> c425dbfc93db2ce3aa6e800ea3539034af6b337b
