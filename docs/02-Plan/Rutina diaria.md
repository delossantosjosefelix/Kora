---
tags: [plan, git]
---
# Rutina diaria

## Al empezar
1. Abre el [[Plan diario]] y lee el objetivo del día y su criterio de listo.
2. Crea la nota del día con el comando de notas diarias de Obsidian.
3. Prepara la rama:

```powershell
git switch main
git pull
git switch -c dia-NN-nombre-corto
```

## Durante el día
1. Primero la API y su prueba con Postman o Thunder Client, después la pantalla.
2. Haz commit cada vez que algo funcione:

```powershell
git add .
git commit -m "dia NN: qué se hizo"
```

## Al cerrar
1. Verifica el criterio de listo.
2. Sube la rama:

```powershell
git push -u origin dia-NN-nombre-corto
```

3. Si el criterio se cumplió, únela a main:

```powershell
git switch main
git merge dia-NN-nombre-corto
git push
```

4. Si el día quedó incompleto, deja la rama sin unir y sigue en ella mañana.
5. Anota en la nota del día qué quedó pendiente.

## Reglas de Git
- La rama main siempre debe funcionar.
- Nunca se suben .env, node_modules, imágenes reales de uploads, copias de seguridad ni volcados con datos reales.
- Antes de un cambio riesgoso, haz commit o crea una etiqueta como punto de retorno.
- Git guarda el código. Los datos reales se respaldan con la función de copias de seguridad del sistema.
