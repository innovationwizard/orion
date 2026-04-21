# Funcionalidades Pendientes — Orion

**Fecha:** 2026-04-20
**Contexto:** Resumen para reunión con gerencia comercial

---

## 1. Activación del Módulo de Reservas para Asesores

El módulo está activo con **12 asesores habilitados** (10 asesores + 2 gerencia). Migración 055 (2026-04-20) limpió la base: 32 registros inactivos desactivados, duplicados por acentuación resueltos, entidades organizacionales excluidas. Trigger de prevención de duplicados instalado.

- **Adopción baja** — De los 12 con cuenta, solo 4 ingresaron en abril (José Gutiérrez, Paula Hernández, Rony Ramírez, Eder Veliz). Los otros 8 no han vuelto desde marzo. Podría requerir seguimiento o recapacitación.

---

## 2. Control de Pagos y Enganche

- **Seguimiento de cuotas de enganche** — Hoy Patty lleva 350+ clientes en un Excel de control de pagos. Falta un módulo para registrar pagos mensuales de enganche, marcar cuotas vencidas y generar alertas de mora (actualmente "al ojo humano, 3 cuotas vencidas").
- **Matching automático de depósitos bancarios** — Contabilidad envía depósitos sin identificar ("pendientes de identificar") y Patty los cruza manualmente con clientes. Se necesita un módulo de conciliación.
- **Alertas de pagos vencidos** — Existe la vista `delinquent_accounts` en analítica pero no está expuesta en la interfaz administrativa.

---

## 3. Documentos Legales y Expediente

- **Carta de Reserva** — Carta de confirmación de reserva. Cartas de Pago y Autorización (Buró) ya existen; esta es la tercera que genera Patty por cada venta.
- **Estado de Cuenta** — Patty genera estados de cuenta cruzando Odoo + cotización + datos del apartamento en un Excel aparte. Proceso manual pesado por solicitud.
- **Tracking de estado de PCV** — Patty lleva un Excel personal del estado de cada Promesa de Compraventa: en proceso → enviada a firma legal → legalizada → enviada a firma cliente → archivada. No hay equivalente en el sistema.
- **Checklist de documentos por reserva** — 5 documentos requeridos antes de procesar la promesa: DPI, RTU, Recibo de Servicios, Cotización Firmada, Carta de Reserva. Falta un dashboard que muestre completitud por reserva con urgencia por antigüedad.

---

## 4. Integración con Pipedrive

- **Jalar datos directo de Pipedrive** — Antonio exporta del tablero "General" a Excel y trabaja los datos manualmente. Los IDs de tablero y columna están identificados para conectar vía API.
- **Validación de calidad de datos** — Los asesores teclean precio, enganche y reserva en Pipedrive con ~0% de confiabilidad. El sistema debería validar contra fuentes autorizadas.
- **Visualización de pipeline** — Etapas del pipeline (lead → cita agendada → cita confirmada → visitó → decisión → reserva) visibles dentro de Orion.

---

## 5. Gestión de Asesores y Disciplina CRM

- **Dashboard de rendimiento por asesor** — Métricas semanales: citas agendadas vs efectivas, tasa de conversión, valor de pipeline, tasa de cierre. Hoy Antonio lo lleva manual.
- **Gestión de cartera** — Cada asesor debería manejar 70–100 tratos activos. Algunos tienen 400–800. Falta monitoreo de tamaño de cartera con alertas.
- **Pronóstico semanal de cierres** — Tracking de "posibles cierres" por asesor por semana, con campos obligatorios (perfil completo, fecha de visita, siguiente acción).
- **Indicador de completitud de perfil de cliente** — Score visual que muestre qué datos faltan. Bloquear ciertas acciones si el perfil está incompleto.
- **Registro obligatorio de todos los tratos** — "Si se vende, se ingresa. Si no se vende, también" (Antonio). Hoy solo se registran los que el asesor cree que cerrarán.
- **Visibilidad gerencial sin depender del asesor** — Que Antonio pueda ver el contexto completo de cualquier trato sin tener que llamar al asesor.

---

## 6. Turnos y Disponibilidad de Asesores

- **Programación de turnos/rotación** — Quién está de turno, quién descansa. Hoy se maneja en un documento compartido por WhatsApp.
- **Solicitud y aprobación de vacaciones** — El asesor solicita en la app; al aprobarla, deja de aparecer como disponible.

---

## 7. Bancos y Precalificación

- **Tracking de precalificación bancaria** — Estado de precalificación FHA/banco por cliente. Múltiples menciones en reuniones de ventas.
- **Configuración por banco** — Página para configurar reglas por banco: plazos aceptados, años máximos, rangos de tasa. Antonio tiene un Excel con esta información.
- **Financiamiento en múltiplos de Q100** — Regla de negocio conocida que el cotizador debe respetar, ajustando vía enganche.

---

---

## 9. Proceso de Reserva y Ventas

- **Creación automática de registro de venta** — Al confirmar una reserva, debería crearse el registro en `sales` automáticamente y disparar el cálculo de comisiones. Hoy Patty lo ingresa manual en ambos sistemas.
- **Exportación CSV para conciliación contable** — Patty necesita esto para cruce de depósitos bancarios.
- **Búsqueda/filtro de historial de reservas** — La vista admin muestra cola de pendientes pero no hay búsqueda integral con filtros por estado, asesor, proyecto y rango de fechas.

---

## 10. Reportes y Analítica

- **Métricas de embudo de conversión** — Leads → visitas → visitas efectivas → reservas. Antonio lo lleva manual por asesor por semana.
- **Reporte mensual de cierre automatizado** — Proceso de cierre de mes (verde = firmado, rojo = desistido) con cálculo previo de comisiones.
- **Ranking/leaderboard de asesores** — Unidades vendidas, visitas efectivas, tasa de cierre, salud de cartera.
- **Reporte de estado de cliente para gerencia** — Lookup de cualquier cliente con contexto completo.
- **Módulo de análisis competitivo** — Antonio mantiene análisis zona por zona en hojas de cálculo. Datos estructurados permitirían análisis de tendencias.

---

## 11. Notificaciones

- **Notificaciones in-app** — Hoy todo se comunica por WhatsApp. Notificaciones para: nuevas reservas, recordatorios de documentos, actividades vencidas, cambios de precio.

---

## 12. Onboarding de Nuevos Proyectos

- **UI administrativa para alta de proyectos** — Cobán sale el próximo mes, Zona Once a mediados de año. Santa Elena se cargó exitosamente vía migración pero falta una interfaz de autoservicio para que gerencia pueda dar de alta proyectos nuevos sin intervención técnica.

---

## 13. Operaciones Especiales

- **Workflow de traslados (Benestare)** — Formalizar el proceso de "traslado" (cancelar venta original + crear nueva preservando historial de pagos).
- **Descongelamiento masivo de Torre E** — Acción única de admin para liberar 42 unidades de FROZEN → AVAILABLE cuando Torre E salga a la venta.
- **Asignación de parqueos** — Evitar doble asignación del mismo número de parqueo entre unidades (Benestare asigna por número).

---

*Total: ~40 funcionalidades pendientes organizadas en 13 categorías.*
