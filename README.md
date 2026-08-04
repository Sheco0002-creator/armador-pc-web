# ArmaPC — sitio para armar tu PC gamer

## Estructura del proyecto

```
armador-pc-web/
├── index.html           → página de inicio
├── configurador.html    → el configurador interactivo (herramienta central)
├── guias.html           → índice de guías (lee data/guides.json)
├── guias/
│   ├── glosario.html    → guía: glosario para principiantes
│   ├── compatibilidad.html → guía: compatibilidad de componentes
│   └── elegir-gpu.html  → guía: cómo elegir tu tarjeta gráfica
├── niveles/
│   ├── entrada.html     → página del nivel Entrada
│   ├── media.html       → página del nivel Media
│   ├── alta.html        → página del nivel Alta
│   └── extrema.html     → página del nivel Extrema
├── css/style.css        → todo el diseño visual
├── js/main.js           → el menú móvil
├── js/moneda.js         → conversor de moneda (tasas en vivo + respaldo)
├── js/nivel.js          → arma las páginas de nivel leyendo el catálogo
├── js/guias.js          → arma el índice de guías
├── js/compatibilidad.js → las reglas que validan si las piezas encajan
├── js/configurador.js   → arma el configurador y corre el verificador
├── data/catalog.json    → catálogo por nivel de presupuesto (páginas de nivel)
├── data/components.json → base de datos de piezas con specs de compatibilidad
├── data/guides.json     → lista de guías (para el índice)
└── README.md            → este archivo
```

El configurador (`configurador.html`) es la herramienta central: el usuario
elige cada pieza y el sistema verifica la compatibilidad en tiempo real
(socket, tipo de RAM, tamaño del gabinete, consumo de la fuente, etc.). Las
piezas que no encajan se deshabilitan solas con una explicación; las que
funcionan pero no son ideales dan un aviso. Puede arrancar desde un nivel
recomendado o desde cero, muestra los precios en la moneda elegida, y al
completar la build permite copiarla.

Las guías (`guias.html` y la carpeta `guias/`) son el contenido educativo
del sitio, clave para el SEO (que Google encuentre la web) y para que Google
AdSense apruebe la página. Agregar una guía nueva es fácil: creas su archivo
HTML en `guias/` y la registras en `data/guides.json`.

Los links del menú a "Sobre" (y las páginas de Contacto y Privacidad del pie)
todavía no existen — son los siguientes en construirse. AdSense las exige.

> ⚠️ Importante: las páginas de nivel usan `fetch()` para leer el catálogo.
> Eso NO funciona abriendo el archivo con doble clic (`file://`) por
> restricciones del navegador — solo funciona servido por un servidor web.
> Para probarlo en tu compu, ver la sección de abajo. En GitHub Pages ya
> funciona sin problema porque ahí sí hay servidor.

## Cómo verlo en tu computadora (sin subir nada a internet todavía)

La página de inicio (`index.html`) la puedes abrir con doble clic y ya.
Pero las páginas de nivel necesitan un servidor local (ver el aviso de
arriba). La forma más simple, si tienes Python instalado:

1. Abre una terminal dentro de la carpeta `armador-pc-web`.
2. Ejecuta: `python3 -m http.server 8000`
3. Abre en tu navegador: `http://localhost:8000`

Ahí sí funciona todo, incluidas las páginas de nivel. Para detener el
servidor, presiona `Ctrl + C` en la terminal.

Si usas VS Code, la extensión "Live Server" hace lo mismo con un clic
("Go Live" abajo a la derecha) y es más cómoda.

## Cómo publicarlo gratis con GitHub Pages

Ya usas GitHub, así que el flujo te va a resultar conocido:

1. Crea un repositorio nuevo en GitHub (por ejemplo `armador-pc-web`).
2. Sube el contenido de esta carpeta a ese repositorio (arrastrando los
   archivos desde la web de GitHub, o con `git push` si prefieres la
   terminal).
3. En el repositorio, ve a **Settings → Pages**.
4. En "Branch", elige `main` y la carpeta `/ (root)`, y guarda.
5. En un par de minutos, tu sitio va a estar disponible en:
   `https://<tu-usuario>.github.io/armador-pc-web/`

Cuando quieras conectar un dominio propio (recomendable antes de pedir
Google AdSense), esa misma pantalla de **Settings → Pages** tiene la opción
de agregar un "Custom domain".

## Próximos pasos

- Construir `configurador.html` (la herramienta interactiva)
- Construir las 4 páginas de nivel (`niveles/entrada.html`, `media.html`,
  `alta.html`, `extrema.html`) usando los datos de `data/catalog.json`
- Construir `guias.html` y las guías individuales
