# JMates — Mates y momentos

Landing page de **JMates**, una tienda de mates estilo uruguayo, yerbas y accesorios
de Mendoza, Argentina. Página de una sola pantalla (single-file) con catálogo,
armador de kits y pedidos directos por WhatsApp.

🧉 **Demo:** abrí `index.html` en el navegador (o publicalo con GitHub Pages).

## Características

- **Catálogo** filtrable por categoría (mates, yerbas, bombillas, combos), con foto por producto.
- **Armá tu kit** — elegís mate + bombilla + yerba y se arma el pedido para WhatsApp.
- **Pedidos por WhatsApp** — cada producto y kit genera un mensaje listo para enviar.
- **Hero animado** — la "ronda" con íconos en órbita y vapor que sube (respeta `prefers-reduced-motion`).
- **Barra de progreso** de scroll, menú mobile, FAQ y secciones de envíos/nosotros.
- Accesible: foco visible por teclado, buen contraste y animaciones desactivables.

## Estructura

```
index.html        Página completa (HTML + Tailwind CDN + JS vanilla)
image-slot.js     Componente <image-slot> (fallback arrastrable para fotos)
images/           Fotos de los productos
```

## Configuración

En el bloque `CONFIGURACIÓN` dentro de `index.html`:

- `WHATSAPP_NUMBER` — reemplazá por el número real (formato `549` + área sin 0 + número sin 15).
- `PRODUCTS` — editá nombres, descripciones, precios y `image:` de cada producto.
  Para cambiar una foto, reemplazá el archivo en `images/` manteniendo el nombre.

## Tecnologías

- [Tailwind CSS](https://tailwindcss.com) (vía CDN), JavaScript vanilla, HTML único.
- Tipografías: Fraunces, Work Sans, JetBrains Mono (Google Fonts).

## Créditos

- Íconos de interfaz: [Lucide](https://lucide.dev) (MIT).
- Ícono del mate: [OpenMoji](https://openmoji.org) 🧉 U+1F9C9, estilo *black/line* (CC BY-SA 4.0).
- Fotos de producto: [Wikimedia Commons](https://commons.wikimedia.org) (de muestra — reemplazables por fotos propias).
