# WATERS — experiencia 3D

Sitio interactivo en 3D (Three.js + WebGL) con navegación por "rooms" a distintas profundidades del océano:

| Room | Profundidad | Qué hay |
|---|---|---|
| Inicio | Superficie | Gota líquida 3D, olas que reaccionan al toque |
| 101 | −20 m | 3 monolitos (Claridad · Corriente · Profundidad) |
| Marketing Strategy | −38 m | Embudo 3D de 4 anillos (Superficie → Abismo) |
| Studio | −50 m | Carrusel 3D de servicios |
| Lab | −60 m | Medusa de partículas que sigue el cursor |
| Contacto | Superficie | Atardecer + formulario conectado al backend |

Navegación: menú, scroll del mouse, flechas del teclado, swipe en móvil y enlaces directos (`/#101`, `/#marketing-strategy`, `/#studio`, `/#lab`, `/#contacto`).

## Estructura

```
index.html        ← todo el frontend (HTML + CSS + JS + shaders)
img/              ← fotos de cada room (WebP optimizado) + og.jpg para compartir
api/contact.js    ← backend: función serverless del formulario (Vercel)
vercel.json       ← headers de seguridad
package.json
```

No hay build ni dependencias que instalar: Three.js y GSAP cargan por CDN.

## Dónde montarla: GitHub + Vercel

- **GitHub** guarda el código (versiones, historial).
- **Vercel** lo publica y corre el backend (`/api/contact`). GitHub Pages solo sirve archivos estáticos, así que el formulario no funcionaría ahí.

### Pasos (10 minutos)

1. Crea un repo nuevo en GitHub (ej. `waters`) y sube estos archivos:
   ```bash
   git init && git add . && git commit -m "WATERS v1"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/waters.git
   git push -u origin main
   ```
2. En vercel.com → **Add New → Project** → importa el repo → **Deploy** (sin tocar nada: Framework = Other).
3. Conecta el email del formulario (gratis con Resend):
   - Crea cuenta en resend.com → API Keys → crea una.
   - En Vercel → Project → **Settings → Environment Variables**:
     - `RESEND_API_KEY` = tu key
     - `CONTACT_TO` = el email que recibe los mensajes
     - `CONTACT_FROM` = `WATERS <hola@tudominio.com>` (dominio verificado en Resend; para pruebas puedes omitirla y usa `onboarding@resend.dev`)
   - **Redeploy**.
   - Sin estas variables, el formulario igual responde y los mensajes quedan en **Vercel → Logs**.
4. Dominio propio: Vercel → Settings → **Domains** → añade `tudominio.com` y sigue los DNS que te indica.

Cada `git push` a `main` vuelve a publicar automáticamente.

## Personalizar

En `index.html`, busca:
- `CONFIG` → email e Instagram.
- `DETAILS` → todo el texto de los paneles de detalle (101, estrategia, servicios, lab).
- Las secciones `<section class="room" …>` → los textos de cada room.
- `PAL` → la paleta de colores de la escena 3D.

## Rendimiento

- Escritorio: bloom (resplandor) activado, ~260×260 vértices en el océano.
- Móvil: sin bloom, menos partículas y menos geometría, cámara ajustada a pantallas verticales.
- Respeta `prefers-reduced-motion` (sin parallax).
