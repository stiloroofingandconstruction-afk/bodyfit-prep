# @bodyfit/domain

Logica de dominio de BodyFit Prep.

## Reglas

1. **Sin React, sin almacenamiento, sin red, sin DOM.** El `tsconfig` de este
   paquete no incluye `DOM` en `lib`: si alguien escribe `window` o
   `localStorage`, no compila. Esa es la garantia, no una convencion.
2. **Sin dependencias.** Ni una. Todo lo que hay aqui es TypeScript puro.
3. **Determinista.** Las mismas entradas dan las mismas salidas. Nada de
   `Date.now()` ni `Math.random()` dentro de un calculo: la fecha se pasa como
   argumento.
4. **Los pesos van en kilogramos y las longitudes en centimetros.** La unidad
   que ve el usuario es presentacion y vive fuera de aqui.

## Donde se ejecuta

| Entorno | Como |
|---|---|
| App (navegador) | Vite lo empaqueta desde el fuente |
| Pruebas (Node) | esbuild lo empaqueta al vuelo |
| Edge Functions (Deno) | importa los `.ts` directamente, sin compilar |
| Dashboard del coach | el mismo paquete |

Que el mismo codigo calcule los macros en el telefono y en el servidor es lo
que garantiza que nunca discrepen.

## Uso

```ts
import { solvePortions } from '@bodyfit/domain/solver';
import { suggestProgression } from '@bodyfit/domain/training';
import { COLLECTION_KEYS } from '@bodyfit/domain/collections';
```

Importar por submodulo, no desde el barril: asi cada pantalla se lleva solo lo
que usa.
