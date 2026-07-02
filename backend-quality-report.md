# Informe de calidad del backend

Este informe resume los principales hallazgos del backend de `app-reservas` desde la perspectiva de SonarQube y de una revisión estructural de los módulos.

## Hallazgos transversales

- Existe duplicación de autenticación JWT en `auth-service`, `booking-service` y `user-service`.
- Hay secretos embebidos en `docker-compose.yml` para JWT y correo SMTP.
- No hay pruebas automatizadas en los servicios backend, por lo que la cobertura es nula o no medible.
- La lógica de negocio y la integración externa están mezcladas en los routers, lo que eleva complejidad y deuda técnica.

## auth-service

- `src/controllers/auth.controller.js` contiene validación mínima de entrada y maneja registro, login y sincronización en el mismo módulo.
- `register` hace una llamada HTTP acoplada a `user-service` sin timeout explícito ni política de reintento.
- `me` replica la verificación JWT que ya aparece en otros servicios.
- `src/models/user.model.js` es simple, pero no hay normalización de datos ni validaciones adicionales como longitud o formato de nombre.

## booking-service

- `src/routes/booking.routes.js` concentra demasiada lógica en un solo archivo: autenticación local, creación de reservas, cancelación, limpieza de históricos y notificación.
- Existe un middleware duplicado en `src/middleware/verifyToken.js` y además una función local `authMiddleware` no reutilizada.
- Se registran datos de fecha en consola, lo que incrementa ruido y puede exponer información operativa.
- No hay validación de `fecha` ni `servicio` antes de persistir.
- `src/models/Booking.js` está correcto en estructura, pero no compensa la falta de validación en el flujo de entrada.

## notification-service

- `controllers/mail.controller.js` duplica la estructura de envío para reserva y cancelación.
- `services/mailer.js` depende directamente de variables de entorno sin capa de configuración centralizada ni validación de arranque.
- `routes/mail.routes.js` expone endpoints sin autenticación, limitación de tasa ni validación de payload.
- El servicio usa credenciales SMTP embebidas en el compose del proyecto, lo que SonarQube marcará como vulnerabilidad o deuda de seguridad.

## user-service

- `middleware/verifyToken.js` imprime el token y la variable `JWT_SECRET` en consola, lo que es una vulnerabilidad crítica de exposición de secretos.
- `routes/user.routes.js` permite crear usuarios a partir de `_id`, `nombre` y `email` sin esquema fuerte para el alta inicial.
- Aunque `PUT /me/update` valida con Joi, el resto del flujo no mantiene el mismo nivel de validación.
- `models/User.js` tiene buenas restricciones de estructura básica, pero no elimina el problema del logging sensible ni la falta de una capa de servicio.

## Riesgo esperado en StrictGate

- `coverage` fallará por debajo de `80%`.
- `duplicated_lines_density` superará el umbral por la repetición de JWT y la estructura de control repetida.
- `sqale_debt_ratio` aumentará por la concentración de lógica en routers y controladores.
- `cognitive_complexity` crecerá en `booking-service` por la mezcla de responsabilidades.
- `blocker_issues` o `critical_issues` pueden aparecer por el logging de secretos en `user-service`.