/* =============================================
   ECOS DE AETHELGARD — config.js
   Configuración del modo online (gratuito, con Firebase).

   Mientras «firebase» sea null, el juego funciona sin conexión
   (los perfiles se guardan solo en el navegador).

   Para activar cuentas, partidas en la nube, clasificación,
   duelos y el panel del creador, sigue CONFIGURAR_ONLINE.md
   y pega aquí la configuración de tu proyecto de Firebase.
   Estos datos son públicos por diseño: la seguridad la ponen
   las reglas de firebase/firestore.rules.
   ============================================= */
'use strict';

const CLOUD_CONFIG = window.CLOUD_CONFIG_OVERRIDE || {
    firebase: null,
    // Ejemplo (sustitúyelo por el tuyo):
    // firebase: {
    //     apiKey: 'AIza...',
    //     authDomain: 'tu-proyecto.firebaseapp.com',
    //     projectId: 'tu-proyecto',
    //     storageBucket: 'tu-proyecto.firebasestorage.app',
    //     messagingSenderId: '123456789',
    //     appId: '1:123456789:web:abcdef',
    // },

    // Correo de contacto que aparece en la política de privacidad.
    contactEmail: '',
};
