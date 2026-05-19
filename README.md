# Laundri-Sync

Sistema de lavandería boutique para huéspedes. MVP diseñado para gestionar hasta 60 usuarios en Martínez, Argentina.

## Stack

- **Frontend**: Next.js 16 + Tailwind CSS v4
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **Despliegue**: Vercel / Netlify

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratuita)
- Cuenta en [Vercel](https://vercel.com) (gratuita)

## Configuración

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** > pegar el contenido de `database/init.sql` > ejecutar
3. Opcional: insertar códigos QR iniciales:
   ```sql
   INSERT INTO bags (qr_id) VALUES
     ('ABC12345'), ('DEF67890'), ('GHI13579'), ('JKL24680');
   ```
4. Ir a **Project Settings** > **API** y copiar:
   - `Project URL`
   - `anon public key`
   - `service_role key` (esta es secreta, usarla solo desde el servidor)

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completar:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secreta) |
| `ADMIN_PASSWORD` | Contraseña para el panel /admin |

### 3. Desarrollo

```bash
npm install
npm run dev
```

## Despliegue en Vercel

```bash
npm i -g vercel
vercel
```

O desde la UI:
1. Conectar repositorio
2. Agregar las 4 variables de entorno
3. Desplegar

## Despliegue en Netlify

1. Conectar repositorio
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Agregar variables de entorno
5. Desplegar

## Estructura

```
src/
  app/
    page.tsx              # Landing page
    layout.tsx            # Root layout + PWA manifest
    q/[qr_id]/page.tsx    # Acceso por QR (huésped)
    admin/
      layout.tsx          # Admin layout + login
      page.tsx            # Dashboard + Kanban
      print-qrs/page.tsx  # Generación de QR
  lib/
    supabase.ts           # Cliente Supabase
    types.ts              # Tipos TypeScript
    utils.ts              # Utilidades (fechas, IDs)
database/
  init.sql                # Esquema de base de datos
```

## Flujo de uso

1. **Admin**: genera QR físicos desde `/admin/print-qrs`
2. **Huésped**: escanea QR → `lavanderia.com.ar/q/XYZ`
3. **Vinculación**: ingresa habitación + apellido → se vincula a la bolsa
4. **Pedido**: selecciona cantidad de prendas y tipo de servicio
5. **Admin**: ve órdenes en dashboard Kanban, cambia estados
6. **Check-out**: admin libera la bolsa para reutilización

## Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing page |
| `/q/[qr_id]` | Público | Acceso huésped por QR |
| `/admin` | Admin | Dashboard (requiere password) |
| `/admin/print-qrs` | Admin | Generar QR imprimibles |
