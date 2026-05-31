# Foton México — GR Centro-Sur App

Sistema de gestión comercial para el Gerente Regional Centro-Sur de Foton México (LDR Solutions S.A. de C.V.).

## Contexto del proyecto

**Usuario principal:** Israel Esperanza — Gerente Regional Centro-Sur  
**Empresa:** LDR Solutions S.A. de C.V. (distribuidor exclusivo Foton México)  
**Región:** Centro-Sur (Tula, SLP, Uruapan, Puebla, León, Querétaro, Cancún/Mérida, Guadalajara)  
**Portafolio:** S3 MT · S5 · S6 · S8 · S12 AMT (ligeros y medianos, segmento MDT/LDT)  
**Equipo:** Israel Esperanza (GR Centro-Sur) · Andres Arrangoiz (GR)

---

## Módulos actuales

### 1. `public/field-app.html` — Foton Field App
App móvil de campo (single HTML file). Tres secciones navegables via tab bar:

**Tab 1 — Guía de Visita**
- Checklist pre-visita (48h antes): BP Tracker, inventario, acuerdos previos, pipeline
- Selector de tipo de visita: Inauguración / Operativa / Intervención / Capacitación  
- Agenda en campo: timeline de 3h con bloques de tiempo
- Mapa de llenado de minuta: qué capturar en cada campo
- Checklist post-visita: cierre operativo y cadencia inter-visita
- Estado de 8 dealers: perfil, % avance de cuota, foco de visita

**Tab 2 — Agenda Operativa**
- 15 puntos operativos con equipo de ventas (numerados 1-15)
- 10 puntos de Agenda Gerencial (G1-G10) para reunión con dueño/director
- Cada punto: checkbox de revisado, campo de comentarios, campos de datos específicos, cámara de fotos
- Filtros: Todos / Pendientes / Revisados / Con foto
- Barra de progreso en tiempo real (25 puntos total)
- Tarjeta del dealer activo visible en todo momento
- Botón "Pasar datos a minuta →" que transfiere todo automáticamente

**Tab 3 — Minuta de Visita**
- 6 pasos: General → Agenda → Pipeline → Indicadores → Acuerdos → Cierre
- Prellenado automático desde selector de dealer y Agenda Operativa
- Tabla de indicadores S2-S12: BP 2026, Wholesale YTD, % avance (auto-calculado), Retail YTD, Inventario, B.O.
- Pipeline de prospectos con modelo, % avance y comentarios
- Hasta 5 acuerdos con responsable y fecha compromiso
- Captura de fotos desde cámara del celular
- Firma digital con el dedo
- Generación de PDF: replica el formato oficial Foton con logo, tablas, fotos y firma

### 2. `public/bp-tracker.html` — BP Tracker *(pendiente de agregar)*
Dashboard de Business Plan por distribuidor.
- BP anual por modelo (S3/S5/S6/S8/S12) vs facturado YTD
- Semáforo de avance mensual
- Insights automáticos: modelos en riesgo, ritmo necesario para cerrar el año
- Captura manual de facturado por mes

---

## Stack actual (frontend-only)
```
HTML + CSS + JS vanilla
jsPDF (generación de PDF en cliente)
Sin backend — datos en memoria del browser
```

## Stack objetivo (con backend)
```
Frontend:  HTML/CSS/JS vanilla (mismo código, sin frameworks)
Backend:   Supabase (PostgreSQL + Auth + Storage)
Deploy:    Netlify (dominio único para ambas apps)
Repo:      GitHub — IsEsperanza2306/foton-app
```

---

## Distribuidores activos (Centro-Sur)

| ID | Nombre | Plaza | Grupo | Contacto | Status |
|----|--------|-------|-------|----------|--------|
| gcm | Grupo Carrocero Milenio | Tula, Hgo. | GCM | Karla Santillán | Nuevo |
| tang | Autos Y Camiones Asia Central | San Luis Potosí | Tangamanga | Erick Elizalde | Estratégico |
| bavi | Burk Automotriz | Uruapan, Mich. | BAVI | Samir Daud | Activo |
| astur | Autos Emcg | Puebla | Asturcar | Por definir | En riesgo |
| orient | Camiones Orientales De Leon | León, Gto. | Plascencia | Por definir | Activo |
| prem | Camiones Premium Del Centro | Querétaro | Premium | Por definir | Seguimiento |
| pen | Vehiculos Comerciales Peninsula | Cancún/Mérida | Enerkom | Por definir | Seguimiento |
| xian | Xian Motors | Guadalajara | Xian | Por definir | Seguimiento |

---

## Tablas Supabase a crear

```sql
-- 1. Distribuidores
distribuidores (id, nombre, plaza, grupo, contacto, segmento, status, regional_id)

-- 2. Business Plan anual
bp_anual (id, distribuidor_id, anio, modelo, unidades_bp, monto_bp)

-- 3. Facturado YTD
facturado_ytd (id, distribuidor_id, anio, mes, modelo, unidades_facturadas, updated_at)

-- 4. Visitas / Minutas
visitas (id, distribuidor_id, fecha, tipo_visita, regional, status, created_at)

-- 5. Agenda items de cada visita
visita_agenda (id, visita_id, item_id, done, comentario, datos_json)

-- 6. Acuerdos por visita
visita_acuerdos (id, visita_id, texto, responsable, fecha_compromiso, cumplido)

-- 7. Fotos por visita
visita_fotos (id, visita_id, agenda_item_id, storage_path, created_at)

-- 8. Usuarios / Regionales
usuarios (id, nombre, email, rol, region)
```

---

## Lo que falta construir (roadmap Claude Code)

### Fase 1 — Backend básico
- [ ] Crear tablas Supabase (migrations en `/supabase/migrations/`)
- [ ] Conectar field-app.html a Supabase (supabase-js CDN)
- [ ] Guardar/cargar minutas desde Supabase
- [ ] Subir fotos a Supabase Storage
- [ ] Guardar facturado en `facturado_ytd`

### Fase 2 — BP Tracker conectado
- [ ] Leer `bp_anual` y `facturado_ytd` desde Supabase
- [ ] Field App: precargar tabla de indicadores desde Supabase al seleccionar dealer
- [ ] BP Tracker: escribir facturado a Supabase en lugar de localStorage

### Fase 3 — Auth y multiusuario
- [ ] Login con Supabase Auth (email/password)
- [ ] Israel ve sus 8 dealers
- [ ] Andres Arrangoiz ve sus dealers
- [ ] RLS (Row Level Security) por regional

### Fase 4 — Deploy
- [ ] Netlify config (`netlify.toml`)
- [ ] Dominio: foton-app.netlify.app o personalizado
- [ ] Variables de entorno: SUPABASE_URL, SUPABASE_ANON_KEY

---

## Credenciales y contexto técnico

- **Supabase project Foton:** *agregar project_id aquí*
- **Supabase project Alabol (referencia):** `rgnunjngtsgqgvplawfr`
- **GitHub:** `IsEsperanza2306`
- **Stack preferido:** HTML/CSS/JS vanilla + Supabase CDN (sin npm, sin build tools)
- **Deploy:** Netlify drag-and-drop o CLI

---

## Notas de diseño

- Identidad visual: azul `#0C447C` (header), `#185FA5` (primario), blanco `#FFFFFF`, `#F7F7FB` (fondo)
- Tipografía: Inter + Inter Tight (Google Fonts)
- Logo Foton: embebido en base64 en el HTML (fondo transparente, blanco)
- Mobile-first: optimizado para iPhone en campo
- Sin frameworks CSS — todo vanilla con CSS custom properties

## Comando de inicio para Claude Code

```bash
git clone https://github.com/IsEsperanza2306/foton-app
cd foton-app
# Abrir con Claude Code y continuar desde aquí
```
