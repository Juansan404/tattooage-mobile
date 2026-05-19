# TattooAge Mobile — Roadmap

## Estado actual (Mayo 2026)

### Implementado
- Feed tipo Instagram con likes optimistas y doble tap
- Explorar: grid 3 columnas + chips de estilo + búsqueda de usuarios
- Perfiles públicos y propio (seguidores, seguidos, publicaciones)
- Sistema de seguidores con modal de lista tappable
- Publicaciones guardadas (ribbon icon, pantalla `/guardados`, backend)
- Menú de perfil: Ver guardados / Cerrar sesión
- Mensajes directos (DMs) con chat en tiempo real via WebSocket STOMP
- Solicitudes de cita: formulario con selector de artista, imagen de referencia (URL / galería / guardadas)
- Notificaciones: pantalla + servicio + tipos
- Portfolio: subida de publicaciones (solo ARTISTA)
- Editar perfil
- Sistema de comentarios con modal
- Citas: agenda y detalle

---

## Pendientes a corto plazo

| Feature | Prioridad | Notas |
|---|---|---|
| ~~Migración SQL `publicaciones_guardadas`~~ | ~~Alta~~ | ✅ Creada automáticamente por Hibernate al desplegar |
| Subida de imágenes a Cloudinary (sustituir base64) | Media | Evita sobrecargar la BD con base64 grandes |
| Portfolio: editar y eliminar publicación propia | Media | Solo ARTISTA sobre sus propias publicaciones |
| Modo ARTISTA: estadísticas básicas | Baja | Nº likes totales, seguidores, visitas de perfil |

---

## Feature principal: AR Tattoo Try-On

Sistema de realidad aumentada para probar tatuajes en tiempo real desde la cámara del móvil.

### Flujo completo

```
[1] UPLOAD         [2] EXTRACCIÓN      [3] AJUSTE        [4] CÁMARA AR       [5] GUARDAR
Sube imagen    →   API elimina     →   Sliders para  →   Overlay sobre   →   Galería +
de tatuaje        el fondo            refinar borde      cámara en vivo      sección app
(image-picker)    (Remove.bg API)     (threshold,        (drag/pinch/        (media-library
                                      suavizado)          rotate)             + backend)
```

### Librerías a instalar

```bash
npx expo install expo-camera expo-media-library react-native-gesture-handler
```

| Librería | Para qué |
|---|---|
| `expo-camera` | Feed de cámara en vivo + captura de frame |
| `expo-media-library` | Guardar resultado en galería del dispositivo |
| `react-native-gesture-handler` | Drag, pinch-to-zoom y rotación del tatuaje |

### Extracción del tatuaje

- El usuario sube una foto del tatuaje desde la galería (`expo-image-picker`)
- El backend hace de proxy hacia **Remove.bg API** (no expone la key en cliente)
- Remove.bg devuelve PNG con fondo transparente
- Se muestra una pantalla de ajuste fino con sliders:
  - **Umbral de opacidad** — elimina semitransparencias residuales
  - **Suavizado de bordes** — anti-aliasing del contorno
  - **Recorte manual** — tocar zonas a borrar

**Endpoint backend (proxy):**
```
POST /api/ar/extraer   →   Remove.bg API   →   devuelve PNG base64
```

### Pantalla AR (cámara en vivo)

```
┌─────────────────────────────┐
│                             │
│   [CÁMARA EN VIVO]          │
│                             │
│      ╔═══════╗              │
│      ║ tattoo║  ← overlay   │
│      ╚═══════╝    draggable │
│                   pinch     │
│                   rotate    │
│                             │
│  [↩ Voltear]  [📸 Capturar] │
└─────────────────────────────┘
```

- Tatuaje PNG (fondo transparente) flotando sobre el feed de cámara
- `react-native-gesture-handler`: drag + pinch-to-zoom + rotación libre
- Slider de opacidad para simular efecto semitransparente
- Botón voltear cámara (frontal/trasera)
- Botón capturar: combina frame + overlay y guarda

### Nueva sección: "Mis pruebas"

- Acceso desde el menú del perfil (junto a "Ver guardados")
- Grid de imágenes resultado
- Cada prueba muestra el tatuaje original usado
- Opción de re-probar con un tatuaje ya extraído

### Backend — nuevas entidades

```
TatuajeExtraido
  id            SERIAL PK
  id_usuario    FK → usuarios
  imagen_orig   TEXT (base64 o URL original)
  imagen_ext    TEXT (PNG base64 con fondo transparente)
  creado_en     TIMESTAMPTZ

PruebaTatuaje
  id              SERIAL PK
  id_usuario      FK → usuarios
  id_tatuaje_ext  FK → tatuajes_extraidos
  imagen_result   TEXT (foto final combinada)
  creado_en       TIMESTAMPTZ
```

**Endpoints:**
```
POST /api/ar/extraer                          → extrae tatuaje via Remove.bg
GET  /api/ar/tatuajes/{idUsuario}             → lista de tatuajes extraídos del usuario
POST /api/ar/pruebas                          → guarda resultado de prueba
GET  /api/ar/pruebas/{idUsuario}              → lista de pruebas guardadas
```

---

## Fases de implementación AR

### Fase 1 — Backend + extracción
- [ ] Configurar API key de Remove.bg en variables de entorno Cloud Run
- [ ] Entidades `TatuajeExtraido` + `PruebaTatuaje`, repositorios y endpoints
- [ ] Migraciones SQL para las nuevas tablas
- [ ] Pantalla `/ar/extraer`: upload de imagen + llamada al proxy + preview resultado

### Fase 2 — Ajuste de parámetros
- [ ] Pantalla `/ar/ajuste`: preview del PNG extraído con sliders
- [ ] Slider umbral de opacidad (filtrar píxeles semitransparentes)
- [ ] Slider suavizado de bordes
- [ ] Botón "borrar zona" (touch para marcar píxeles a eliminar)
- [ ] Guardar tatuaje extraído en backend

### Fase 3 — Cámara AR
- [ ] Instalar `expo-camera`, `expo-media-library`, `react-native-gesture-handler`
- [ ] Pantalla `/ar/camara`: feed de cámara en vivo
- [ ] Overlay del PNG del tatuaje con gestos (drag, pinch, rotate)
- [ ] Slider de opacidad del overlay
- [ ] Botón voltear cámara
- [ ] Captura y composición del frame final

### Fase 4 — Guardado y sección "Mis pruebas"
- [ ] Guardar imagen resultado en galería del dispositivo (`expo-media-library`)
- [ ] POST al backend para persistir la prueba
- [ ] Pantalla `/ar/pruebas`: grid de resultados guardados
- [ ] Acceso desde menú de perfil
- [ ] Opción de re-probar con tatuaje extraído previo
