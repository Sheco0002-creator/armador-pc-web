# Imágenes de las tarjetas de nivel

Las cuatro imágenes las aportó el propietario del sitio (agosto de 2026).
No provienen de un banco de imágenes: son renders de producto de fabricante
(se reconocen marcas ASUS ROG y Corsair en varias de ellas).

**Antes de publicar, verificar que se tiene derecho a usarlas.** Los renders
de prensa de fabricante suelen cederse para reseñas y prensa, no para uso
promocional en un sitio comercial con publicidad. Si no hay permiso, hay que
reemplazarlas por fotos propias o por imágenes con licencia comercial
explícita (Pexels y Unsplash sirven).

| Archivo | Nivel | Qué muestra |
|---|---|---|
| `entrada.jpg` | Entrada | Gabinete negro, 3 ventiladores RGB frontales, disipador de aire |
| `media.jpg` | Media | Gabinete blanco Corsair, refrigeración líquida, radiador de 3 ventiladores |
| `alta.jpg` | Alta | Gabinete blanco ROG con iluminación naranja, refrigeración líquida |
| `extrema.jpg` | Extrema | Gabinete angular ROG, tubería rígida, iluminación morada y roja |

## Procesado

Los archivos servidos están redimensionados a 760 px de ancho y comprimidos
(JPEG progresivo, calidad 82): 8,5 MB en total pasaron a 375 KB. Los
archivos tal como se recibieron están en `originales/` — **esa carpeta no la
sirve ninguna página**, está solo para poder regenerar los recortes. Si
pesan demasiado para el repositorio, se pueden borrar sin afectar al sitio.

Para regenerar tras cambiar un original:

```
python -c "
from PIL import Image
for n in ['entrada','media','alta','extrema']:
    im = Image.open('originales/%s-original.jpg' % n).convert('RGB')
    w,h = im.size
    im.resize((760, round(h*760/w)), Image.LANCZOS).save(
        '%s.jpg' % n, 'JPEG', quality=82, optimize=True, progressive=True)
"
```

Las imágenes se muestran con `object-fit: contain` sobre una placa negra,
porque sus proporciones van de 0,95 a 1,50 y con `cover` se recortarían los
gabinetes por los lados. El fondo negro puro de los archivos se funde con la
placa, así que no hacen falta ni degradados ni recortes de fondo.
