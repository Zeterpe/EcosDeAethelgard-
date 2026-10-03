# Activar el modo online (gratis)

Con el modo online tus amigos y tú tenéis cuentas, la partida se guarda en la nube, hay clasificación compartida, duelos, desafío diario, fichas con logros y un **panel del creador** que solo tú puedes usar.

Usa **Firebase** con el plan gratuito **Spark**: no pide tarjeta y nunca cobra. Si algún día se superaran los límites gratuitos (50.000 lecturas y 20.000 escrituras al día, mucho más de lo que gasta un grupo de amigos), el modo online se detiene hasta el día siguiente, sin coste.

Mientras no hagas estos pasos, el juego funciona igual que siempre, sin conexión.

---

## 1. Crear el proyecto de Firebase (5 minutos)

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google.
2. **Crear un proyecto** → nombre, por ejemplo `ecos-de-aethelgard`. Google Analytics no hace falta: puedes desactivarlo.

## 2. Activar las cuentas de usuario

1. En el menú: **Compilación → Authentication → Comenzar**.
2. Pestaña **Método de acceso** → **Correo electrónico/contraseña** → activa el primer interruptor → **Guardar**.
3. (Recomendado) Pestaña **Plantillas** → cambia el idioma a **español**, para que el correo de «He olvidado mi contraseña» llegue en español.
4. (Recomendado) Pestaña **Configuración → Dominios autorizados → Agregar dominio**: añade `zeterpe.github.io` (y `raw.githack.com` si vas a probar ramas).

## 3. Crear la base de datos y pegar las reglas de seguridad

1. **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: una europea, por ejemplo `europe-southwest1` (Madrid). Modo: **producción**.
3. Pestaña **Reglas** → borra lo que haya, pega **todo** el contenido del archivo [`firebase/firestore.rules`](firebase/firestore.rules) de este repositorio → **Publicar**.

Estas reglas son las que protegen el juego: cada jugador solo puede tocar sus datos, y el control total solo lo tiene quien aparezca en la colección `admins` (paso 6).

## 4. Conectar el juego con tu proyecto

1. En Firebase, arriba a la izquierda: rueda ⚙ → **Configuración del proyecto**.
2. En **Tus apps**, pulsa el icono web **`</>`**, ponle un nombre (por ejemplo `Ecos web`) y **Registrar app**. No marques Firebase Hosting.
3. Firebase te muestra un bloque `const firebaseConfig = { ... }`. Copia lo que hay entre las llaves.
4. En GitHub abre [`js/config.js`](js/config.js), pulsa el lápiz ✏️ para editar y cambia `firebase: null,` por tu configuración. Quedará así:

   ```js
   firebase: {
       apiKey: 'AIza…',
       authDomain: 'ecos-de-aethelgard.firebaseapp.com',
       projectId: 'ecos-de-aethelgard',
       storageBucket: 'ecos-de-aethelgard.firebasestorage.app',
       messagingSenderId: '…',
       appId: '…',
   },
   ```

5. Si quieres, escribe también tu correo en `contactEmail`: aparecerá en la política de privacidad.
6. **Commit changes**.

> Estos datos no son secretos: Firebase está pensado para que vayan en la web. La seguridad la ponen las reglas del paso 3.

## 5. Publicar el juego con GitHub Pages (gratis)

1. En el repositorio: **Settings → Pages**.
2. **Source: Deploy from a branch** → rama **`main`**, carpeta **`/ (root)`** → **Save**.
3. En uno o dos minutos el juego estará en:

   **<https://zeterpe.github.io/EcosDeAethelgard-/>**

   Ese es el enlace que tienes que pasar a tus amigos.

## 6. Convertirte en el creador (panel de control)

1. Abre el juego y **crea tu cuenta** como cualquier jugador.
2. Ve a **Cuenta y privacidad → Mi identificador de usuario** y copia ese código (UID).
3. En Firebase: **Firestore Database → Datos → Iniciar colección**.
   - ID de la colección: `admins`
   - ID del documento: **pega tu UID**
   - Añade un campo: nombre `rol`, tipo `string`, valor `creador` → **Guardar**.
4. Cierra sesión y vuelve a entrar en el juego: en el menú aparecerá **Panel del creador**.

Nadie más puede darse ese poder: la colección `admins` no se puede escribir desde el juego, solo desde la consola de Firebase con tu cuenta de Google.

### Qué puedes hacer desde el panel

- **Jugadores**: ver su ficha, quitar o dar logros, reiniciar su récord de Arena, cambiar su nivel de historia, suspender su cuenta (desaparece de las clasificaciones) o borrar todos sus datos.
- **Logros especiales**: inventa logros propios (por ejemplo «Campeón del torneo») y dáselos a un jugador o a todos. Les llega un aviso en el momento.
- **Aviso para todos**: un mensaje que todos oyen al entrar (torneos, novedades…).
- **Desafío diario de hoy** y **Duelos recientes**: revisar y borrar lo que quieras.

Los cambios llegan en directo: si quitas un logro a alguien que está jugando, se le actualiza al momento.

---

## Probar antes de publicar

Los cambios nuevos llegan primero en una rama (un pull request). Para probar una rama sin tocar el juego publicado, puedes usar este enlace, cambiando el nombre de la rama:

```
https://raw.githack.com/Zeterpe/EcosDeAethelgard-/NOMBRE-DE-LA-RAMA/index.html
```

Cuando te guste, fusiona el pull request en `main` y GitHub Pages actualizará el juego publicado en un par de minutos.

## Privacidad

- El juego incluye su política de privacidad (al crear la cuenta hay que aceptarla) y, en **Cuenta y privacidad**, cada jugador puede descargar todos sus datos o borrar su cuenta al momento.
- El correo de cada jugador nunca se muestra a los demás ni se guarda en la base de datos del juego: solo lo usa el sistema de cuentas de Firebase.
- Si algún día quieres borrar del todo el acceso de alguien (no solo sus datos), hazlo en **Authentication → Usuarios** en la consola de Firebase.
