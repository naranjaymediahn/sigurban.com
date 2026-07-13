# SULAFBC

Sitio Nuxt 3 para SULAFBC con:

- home bilingüe `ES/EN`
- menú desktop sticky con cambio visual al hacer scroll
- blog/recetas administrables
- productos relacionados por post
- slider de productos administrable por separado
- panel admin con roles `superadmin` y `editor`
- explorador de imágenes desde `/admin`
- soporte híbrido de imágenes: `public/` local o FTP/cPanel
- SEO automático para posts basado en título, extracto / primer párrafo e imagen destacada

## Requisitos

- Node.js 20+
- `npm install`
- archivo `.env` con MySQL y SMTP

`sulafbc` ya acepta dos formatos de base de datos:

- `DATABASE_URL=mysql://USER:PASS@HOST:3306/DB`
- o las variables separadas `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASS`, `MYSQL_DB`

Si el proyecto se despliega en Vercel, se recomienda usar `DATABASE_URL`, igual que en `sula-mundial`.

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Producción

Usa siempre el build de Nitro, no `nuxt preview` como proceso principal.

```bash
npm run build
npm start
```

`npm start` ahora ejecuta:

```bash
node --env-file=.env .output/server/index.mjs
```

Eso evita errores de arranque como el de `#internal/nuxt/paths` y asegura que el runtime lea el `.env` correctamente.

## Admin

El primer acceso `superadmin` queda sembrado automáticamente en la base cuando se ejecutan las APIs admin/blog/productos y la conexión MySQL es válida.

- rol `superadmin`: administra formularios, productos, usuarios y blog
- rol `superadmin`: administra formularios, productos, slider, usuarios, configuración y blog
- rol `editor`: alimenta el blog/recetas

Los usuarios `editor` se crean desde `/admin` con una cuenta `superadmin`.

Si MySQL no está disponible o responde `Access denied`, el panel entra en `fallbackMode` usando `data/fallback-admin.json` para no bloquear el trabajo editorial.

Para diagnóstico rápido existe:

- `GET /api/admin/db-test`

Ese endpoint devuelve si la app está leyendo `DATABASE_URL` o `runtimeConfig` y el error exacto de MySQL sin depender del login.

## Recetas

- Las recetas del home salen de posts publicados con categoría `Recetas`.
- Cada receta puede tener:
  - imagen destacada
  - producto relacionado
  - URL externa opcional

Si una receta tiene `URL externa`, el card del home/blog puede abrir directamente una página externa como `Sazón Sula`.

## Blog

Cada post soporta:

- título y extracto en español e inglés
- contenido enriquecido en español e inglés
- imagen destacada
- producto relacionado
- URL externa opcional para recetas
- estado `Publicado/Borrador`

## Imágenes y FTP

El selector de imágenes de `/admin` puede navegar carpetas y seleccionar archivos existentes.

- En desarrollo local usa `public/images/...`
- Si existen variables FTP, navega y sube al servidor remoto

Variables esperadas para FTP/cPanel:

```env
FTP_HOST=ftp.sulafbc.com
FTP_PORT=21
FTP_USER=web_email@sulafbc.com
FTP_PASS=...
FTP_BASE_DIR=/public_html
FTP_SECURE=true
```

Con eso el admin puede explorar carpetas del hosting y guardar la ruta pública resultante en posts, productos y slider.

## Configuración de correo

Las credenciales SMTP siguen en `.env`. Desde `/admin` se puede editar:

- copias `CC`
- mensaje adicional para correo interno
- mensaje editable de respuesta automática al usuario

Si esos campos se dejan vacíos, el sitio usa la plantilla por defecto.

## SEO automático

Al guardar un post, se generan automáticamente:

- `seo_title_es`
- `seo_title_en`
- `seo_description_es`
- `seo_description_en`
- `seo_image`

La descripción toma primero el extracto y, si está vacío, usa el primer párrafo del contenido.
