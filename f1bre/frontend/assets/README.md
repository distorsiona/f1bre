# Imágenes de F1BRE

Las imágenes existentes se copiaron del frontend Flutter proporcionado por el usuario, sin generarlas ni modificarlas. Los colores de la interfaz son burdeo y verde militar; las fotografías y logotipos conservan sus colores originales.

Puedes añadir o reemplazar archivos en estas carpetas y recargar el navegador. La aplicación usa únicamente imágenes locales.

| Uso | Ruta y ejemplo |
| --- | --- |
| Retrato en listas e inicio | `drivers/<apellido>.png`, por ejemplo `drivers/norris.png` |
| Retrato de perfil | `drivers/<apellido>F.png`, por ejemplo `drivers/norrisF.png`; si no existe, usa el retrato de la lista |
| Logo de equipo | `teams/<equipo>.png`, por ejemplo `teams/mclaren.png` |
| Coche en perfil de equipo | `cars/<equipo>.png`, por ejemplo `cars/mercedes.png` |
| Foto de carrera en Home | `races/<circuito>.jpg` o `.png`, por ejemplo `races/monza.jpg`; ver `races/README.md` |

Los nombres de archivo no llevan espacios ni tildes. Para pilotos se usa el apellido que devuelve OpenF1, convertido a minúsculas: `verstappen`, `norris`, `piastri`, `leclerc`, `hamilton`, `russell`, `antonelli`, etc. Para equipos se usan: `mclaren`, `ferrari`, `mercedes`, `redbull`, `astonmartin`, `alpine`, `williams`, `haas`, `sauber`, `racingbulls`.

Los retratos en las listas se muestran recortados visualmente desde la parte superior, como en el frontend original. PNG con transparencia funciona bien. Los perfiles tienen un espacio más alto. Los logos y coches usan ajuste de imagen completa, sin estirarlos. No se reescriben los archivos originales.

Si falta una imagen, se muestran iniciales, el nombre del equipo o un aviso de imagen pendiente. Los datos deportivos siguen cargando normalmente. Las imágenes no cambian automáticamente al seleccionar una temporada; puedes actualizar el material local cuando lo necesites.

Los perfiles editoriales utilizan `drivers/apellidoF.png`: imagen vertical del piloto con su bandera integrada. Se muestra completa, sin recorte. Si falta ese archivo, se intenta `apellido.png`; no se asigna una bandera arbitraria.
