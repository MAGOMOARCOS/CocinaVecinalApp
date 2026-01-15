# Cocina Vecinal

Landing y app Next.js para la lista de espera y las rutas internas de Cocina Vecinal.

## Configuración local

```bash
npm install
npm run dev
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase (expuesta al cliente).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública anon (expuesta al cliente).
- `SUPABASE_SERVICE_ROLE_KEY`: clave service role (`sb_secret_*`, solo servidor).
- Opcional: `SUPABASE_URL` si necesitas un endpoint distinto al público para el servidor.

En Vercel, configura estas variables en Production/Preview para que `app/api/leads` pueda guardar registros y el cliente pueda autenticarse.
Nota: `autoprefixer` está vendorizado en `vendor/autoprefixer` para permitir instalaciones offline; si prefieres usar el paquete del registro, cambia la dependencia en `package.json`.

## Scripts útiles

- `npm run dev`: entorno de desarrollo.
- `npm run build`: build de producción.
- `npm run start`: servidor de producción local.
