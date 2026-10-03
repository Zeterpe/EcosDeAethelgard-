/* =============================================
   ECOS DE AETHELGARD — lore.js
   Narrativa completa (ecos, guardianes, Avatar)
   y textos de apoyo (actos, mecánicas, Sombra).
   ============================================= */
'use strict';

const LORE = {

    echos: {

        1: [
            `Bienvenido a Aethelgard.`,

            `Cierra los ojos. No porque no puedas ver, sino porque en este mundo, ` +
            `los ojos ya no sirven de nada. Lo que una vez fue un reino de luz y armonía ` +
            `es ahora un mar de oscuridad donde solo el sonido dice la verdad. ` +
            `Cada crujido, cada rugido, cada silbido en el aire es una advertencia. ` +
            `Aprende a escucharlos. Tu vida depende de ello.`,

            `Hace exactamente cuarenta y siete días, el Gran Eco se quebró. ` +
            `Así lo llamamos los supervivientes: el Gran Eco, ese equilibrio invisible ` +
            `que mantenía a los cuatro elementos en danza perpetua. ` +
            `Nadie sabe cómo ocurrió. Algunos dicen que fue un experimento de la Academia. ` +
            `Otros hablan de una voz muy antigua que fue despertada sin querer ` +
            `por un aprendiz demasiado ambicioso. La mayoría simplemente llama a lo que vino ` +
            `el Silencio, porque eso es lo que hace: silencia. Primero las risas. ` +
            `Luego las canciones. Luego los nombres.`,

            `Los maestros de la Academia de los Ecos pasaron años enseñándonos ` +
            `que cada elemento tiene su voz y que cada voz tiene su respuesta. ` +
            `El Fuego habla con calor y rabia, y el Agua puede acallarlo. ` +
            `El Viento grita a través de las grietas, y el Fuego puede domarlo. ` +
            `La Tierra murmura con paciencia milenaria, y el Viento puede moverla. ` +
            `El Agua fluye sin cesar, y la Tierra puede detenerla. ` +
            `Esto no es magia. Es escucha activa. Es respuesta justa. ` +
            `Es lo único que queda entre nosotros y la extinción total.`,

            `Tú eres el último en pie. No te pregunto si estás preparado. ` +
            `Nadie lo está nunca. Solo te digo esto: ` +
            `cuando escuches el sonido de algo que se acerca, ` +
            `no pienses. Siente el elemento en su voz. ` +
            `Y respóndele con el opuesto. ` +
            `Esa es toda la sabiduría que me queda para darte.`,

            `Que los ecos te guíen, invocador. Comienza.`,
        ],

        10: [
            `Aquí llega un eco del pasado. La voz que escuchas ahora ` +
            `pertenece a la Maestra Sylvara, Guardiana del Segundo Anillo de la Academia. ` +
            `Esta grabación fue encontrada en los archivos sellados del sótano norte. ` +
            `Fecha: dieciséis días antes del Gran Eco.`,

            `"Si alguien escucha esto, significa que yo ya no estoy. ` +
            `Y si yo no estoy, significa que la Academia ha caído. ` +
            `Así que escucha bien, desconocido, porque lo que voy a decirte ` +
            `costó la vida de veintidós estudiantes descubrirlo.`,

            `El Silencio no destruye los elementos. Los pervierte. ` +
            `Una criatura corrompida por el Silencio lleva dentro ` +
            `el elemento que la creó, pero retorcido, enfermizo. ` +
            `Si intentas combatirla con su propio elemento, ` +
            `no la dañas. La alimentas. La haces más grande, más rápida, más hambrienta. ` +
            `Hemos visto a aprendices lanzar Fuego contra lobos de Fuego ` +
            `y ver cómo los animales se duplicaban ante sus ojos aterrorizados.`,

            `La respuesta siempre es el opuesto. Siempre. ` +
            `Pero hay algo más sutil que mis colegas ignoraron: ` +
            `las criaturas élite, las que han absorbido más Silencio, ` +
            `no responden igual a un solo elemento. ` +
            `Para ellas necesitas combinar dos voces elementales en un solo grito. ` +
            `Solo así las heridas son profundas. Solo así sangran de verdad. ` +
            `Aprende los dúos. Practica los dúos. Los dúos son la diferencia entre vivir y desaparecer."`,

            `Fin de la grabación. La Maestra Sylvara no sobrevivió a la caída de la Academia. ` +
            `Pero sus palabras sí. Úsalas bien.`,
        ],

        '15_shadow': [
            `...`,
            `¿Crees que no te veo, pequeño mago?`,
            `He observado cada uno de tus pasos desde que pusiste el pie en estas ruinas. ` +
            `He contado cada vez que respiraste demasiado rápido. ` +
            `Cada vez que dudaste. Cada vez que casi fallaste.`,
            `Llegarás al umbral. Lo sé. Eso es exactamente lo que quiero.`,
            `Ven a mí. Ven a mí y te mostraré lo que realmente es el Silencio ` +
            `cuando no tiene que contenerse.`,
            `...`,
        ],

        20: [
            `Otro eco. Esta vez la voz es más joven, más quebrada. ` +
            `El Archivero Tomás, aprendiz de tercer año. ` +
            `Esta grabación es la última entrada de su diario personal. ` +
            `Lleva la fecha del día del Gran Eco.`,

            `"No sé si esto llegará a alguien. La Academia arde. ` +
            `No con Fuego elemental, que eso podríamos combatirlo. ` +
            `Arde con algo que no tiene nombre todavía. ` +
            `Un frío que quema. Una oscuridad que suena. ` +
            `Los maestros no lo vieron venir porque buscaban una amenaza externa. ` +
            `Nunca imaginaron que el Silencio nacería de dentro, ` +
            `del hueco entre los cuatro elementos, ` +
            `de ese espacio vacío que siempre dimos por sentado.`,

            `He visto cosas esta noche que no voy a describir. ` +
            `Solo diré esto: los guardianes han caído. ` +
            `Ignar, el Gran Herrero, ya no responde a su nombre. ` +
            `Rok, la Memoria Viva, ha dejado de moverse y aplasta todo lo que toca sin distinción. ` +
            `Zael no lleva mensajes. Solo lleva destrucción. ` +
            `Y la Gran Corriente ya no canta.`,

            `Si llegas al nivel treinta, invocador, significa que eres extraordinario. ` +
            `O que eres el único que queda. Puede que ambas cosas. ` +
            `Lo que te espera después del treinta no es un nivel más difícil. ` +
            `Es una decisión. La decisión más importante que nadie ha tomado en Aethelgard. ` +
            `Elige con el corazón, no con la cabeza. ` +
            `Los guardianes corrompidos aún guardan algo suyo dentro. ` +
            `Algo que espera ser liberado. ` +
            `Tú no vas a matarlos. Vas a purificarlos.`,

            `Eso espero. Eso rezo. Que alguien sea capaz de purificarlos."`,

            `Fin. El Archivero Tomás tampoco sobrevivió. ` +
            `Pero dejó encendida una luz muy pequeña en este mundo oscuro. ` +
            `Esa luz eres tú.`,
        ],

        '25_shadow': [
            `...`,
            `Ja. Ja. Ja.`,
            `¿Ves cómo te acercas? ¿Ves cómo no puedes evitarlo? ` +
            `Pensabas que tenías elección. Pensabas que eras el héroe de esta historia.`,
            `No hay héroes en el Silencio, pequeño. Solo hay ecos que se apagan.`,
            `Cuando vengas a mí, y vendrás, tráeme tus miedos. ` +
            `Son lo único que me alimenta ya.`,
            `Solo... el... silencio...`,
            `...`,
        ],

        30: [
            `Para. Escúchame.`,

            `Has llegado al umbral del nivel treinta. ` +
            `En cincuenta y cuatro años de historia de la Academia de los Ecos, ` +
            `solo once magos llegaron aquí con vida. ` +
            `Solo dos pasaron de largo. ` +
            `Solo uno volvió para contarlo, ` +
            `y lo que contó lo dejó incapaz de pronunciar otra palabra en el resto de su vida.`,

            `Lo que hay al otro lado de este umbral no son más enemigos. ` +
            `Son los guardianes de Aethelgard. Los seres que durante siglos ` +
            `mantuvieron el equilibrio elemental del mundo con su sola presencia. ` +
            `Ahora son prisioneros dentro de sus propios cuerpos corrompidos, ` +
            `esclavos del Silencio que los consume desde dentro. ` +
            `Cada golpe que les des no es un acto de violencia. ` +
            `Es un acto de misericordia. Es una cadena que rompes.`,

            `Pero te advierto, porque sería deshonesto no hacerlo: ` +
            `van a intentar matarte. ` +
            `No porque te odien. Sino porque el Silencio que los habita ` +
            `sí que te odia. ` +
            `Con una intensidad que no tiene medida en ningún idioma que conozcas.`,

            `En un momento tendrás que elegir un camino. ` +
            `Cuatro guardianes. Cuatro elementos. Cuatro tragedias distintas. ` +
            `Escucha bien cuando te cuente su historia ` +
            `porque entender su dolor es la mitad de derrotarlos.`,

            `Respira. El umbral te espera. ` +
            `Que los ecos de los caídos te acompañen al otro lado.`,
        ],

    },

    bosses: {

        fire: {
            preRoute: [
                `Las Tierras de Escoria. Una vez fueron los talleres más gloriosos de Aethelgard, ` +
                `donde el Fuego elemental no destruía sino que creaba. ` +
                `Ahora el suelo cruje bajo tus pies como hueso calcinado ` +
                `y el horizonte permanece eternamente anaranjado por brasas que nunca se apagan.`,

                `Ignar. Antes de que el Silencio lo tocara, ese nombre significaba creación. ` +
                `Era el Gran Herrero, el único ser vivo capaz de conversar con el Fuego elemental ` +
                `en su propio idioma, un lenguaje hecho de chasquidos y calor y luz. ` +
                `Sus obras eran legendarias: escudos que nunca se rompían, ` +
                `espadas que cantaban al cortar el aire, ` +
                `campanas cuyo repique se oía a tres valles de distancia. ` +
                `No era un guerrero. Era un artista. El mayor artista que Aethelgard haya conocido.`,

                `Cuando el Silencio llegó, Ignar hizo lo que siempre hacía con los problemas: ` +
                `intentó forjarlos. Intentó crear algo lo suficientemente fuerte ` +
                `como para contener la oscuridad. Avivó sus forjas hasta niveles ` +
                `que ningún ser mortal había alcanzado. ` +
                `El Fuego elemental obedeció. Obedeció hasta que dejó de hacerlo. ` +
                `Y cuando el Fuego se volvió contra su maestro, ` +
                `el Silencio ya estaba dentro, alimentándose de la desesperación de Ignar, ` +
                `transformando su amor por la creación en una sed insaciable de destrucción.`,

                `Lo que vas a enfrentar no es Ignar. ` +
                `Es la cáscara de Ignar, habitada por el Silencio, ` +
                `que usa sus manos maestras para deshacer en vez de crear. ` +
                `Pero en algún lugar dentro de ese infierno andante ` +
                `sigue existiendo el artista. Pequeño. Asustado. Atrapado. ` +
                `Esperando que alguien sea lo suficientemente valiente ` +
                `como para apagar las llamas que ya no le pertenecen.`,

                `Úsalas bien. El Agua tiene la gentileza que el Fuego ha olvidado. ` +
                `Avanza hacia las cenizas, invocador. Ignar lleva demasiado tiempo solo.`,
            ],

            rage: `¡ARDES! ¡TODO ARDERÁ CONTIGO! ` +
                `¡NO PUEDES APAGAR LO QUE YO SOY, LO QUE SIEMPRE HE SIDO, ` +
                `LO QUE EL SILENCIO ME HA HECHO VER QUE SOY! ` +
                `¡MIS FORJAS SON ETERNAS Y TÚ ERES POLVO!`,

            victory: [
                `Las llamas se apagan una a una, como velas al final de una vigilia. ` +
                `El suelo deja de temblar. El calor se retira despacio, ` +
                `como si la tierra misma exhalara un suspiro de alivio eterno.`,

                `Y entonces lo ves. O mejor dicho, lo sientes. ` +
                `Una presencia cálida, pero no abrasadora. Cálida como un hogar, ` +
                `como el primer fuego de invierno, como las manos de alguien ` +
                `que te quiere y está a punto de irse.`,

                `Una voz. Apenas un susurro, pero clara como el primer amanecer: ` +
                `"Lo sabía. Sabía que alguien vendría. ` +
                `Gracias por no rendirte. Gracias por no dejar de escuchar." ` +
                `Una pausa. Un último destello de luz dorada. ` +
                `"Cuida el fuego, invocador. El fuego que da calor, no el que consume. ` +
                `Ese siempre fue el verdadero."`,

                `Ignar se desvanece. No como algo que muere, ` +
                `sino como algo que finalmente descansa. ` +
                `Las Tierras de Escoria comienzan a enfriarse. Lentamente. ` +
                `Pero es un comienzo.`,
            ],
        },

        water: {
            preRoute: [
                `Las Fosas Abisales. Un lugar donde la presión del agua ` +
                `es tan grande que aplasta el pensamiento antes que los huesos. ` +
                `El sonido aquí es diferente: más grave, más lento, ` +
                `como si el tiempo mismo se moviera con la densidad del abismo.`,

                `La Gran Corriente. Así se llamaba a sí mismo el ser ` +
                `que ahora yace en el fondo de estas aguas corrompidas. ` +
                `No tenía un nombre como los humanos entienden los nombres. ` +
                `Era simplemente el movimiento, la conexión fluida entre todos los océanos, ` +
                `lagos y ríos de Aethelgard. Donde él pasaba, el agua recordaba su propósito. ` +
                `Los pescadores lo amaban. Los navegantes le rezaban. ` +
                `Los niños de las costas le cantaban por las noches ` +
                `y juraban escuchar su respuesta en el rumor de las olas.`,

                `El Silencio llegó al agua de una manera diferente que al Fuego. ` +
                `No lo atacó. Lo paralizó. ` +
                `Fue como si alguien hubiera detenido el tiempo en el interior de la Gran Corriente. ` +
                `El movimiento perpetuo se convirtió en quietud. ` +
                `Y en esa quietud nació algo terrible: ` +
                `un hambre de movimiento imposible de saciar ` +
                `que solo puede expresarse jalando todo hacia el fondo, ` +
                `hacia la oscuridad donde ya nada se mueve ` +
                `porque ya nada existe.`,

                `El Leviatán Abisal no quiere matarte. ` +
                `Eso sería demasiado simple. ` +
                `Quiere retenerte. Quiere que te quedes. ` +
                `Quiere que la quietud que lo consume te consuma también. ` +
                `Porque en su interior corrupto, la soledad es lo único que le queda, ` +
                `y la soledad compartida es la única forma que le queda de amar.`,

                `La Tierra puede anclarte. Puede darte el peso suficiente ` +
                `para no ser arrastrado por las profundidades. ` +
                `Desciende, invocador. La Gran Corriente espera que alguien ` +
                `le recuerde cómo fluir.`,
            ],

            rage: `¡QUÉDATE! ¡TODOS SE QUEDAN AL FINAL! ` +
                `¡EL ABISMO NO SUELTA, EL ABISMO NUNCA SUELTA, ` +
                `Y TÚ SERÁS EL ÚLTIMO ECO EN ESTAS AGUAS ETERNAS! ` +
                `¡VEN A MÍ! ¡VEN ABAJO DONDE TODO ES PAZ, DONDE TODO ES OSCURIDAD, ` +
                `DONDE TODO ES SILENCIO PARA SIEMPRE!`,

            victory: [
                `El agua comienza a moverse. Primero despacio, casi imperceptiblemente. ` +
                `Luego con más decisión, con más alegría. ` +
                `Una corriente nace en el punto exacto donde el Leviatán cayó, ` +
                `y se expande hacia afuera como los círculos que deja una piedra en un estanque.`,

                `El sonido cambia. Ya no es ese grave aplastante del abismo. ` +
                `Es algo más antiguo, más musical. ` +
                `Como un canto que hubiera estado contenido durante demasiado tiempo ` +
                `y ahora por fin puede respirar.`,

                `Sientes algo tocar tu mano bajo el agua. No es una mano. ` +
                `Es solo una corriente, pero tiene la gentileza de una mano. ` +
                `Y escuchas, o quizás imaginas, algo que suena como palabras: ` +
                `"Gracias por devolverte. ` +
                `Gracias por recordarme que fluir no es debilidad. ` +
                `Es la forma más valiente de existir."`,

                `La Gran Corriente vuelve al mar. ` +
                `Y el mar, por primera vez en cuarenta y siete días, ` +
                `vuelve a escucharse desde la costa.`,
            ],
        },

        wind: {
            preRoute: [
                `La Meseta de los Ecos Rotos. ` +
                `Un lugar donde el viento no descansa nunca, ` +
                `pero tampoco lleva ningún mensaje. ` +
                `Solo grita. Un grito que lleva tanto tiempo sonando ` +
                `que ya nadie recuerda qué intentaba decir.`,

                `Zael. El nombre suena como el propio viento: breve, agudo, libre. ` +
                `O al menos así sonaba antes. ` +
                `Era el mensajero de Aethelgard, ` +
                `el ser más rápido que existía y el más necesario. ` +
                `En un mundo sin caminos seguros, sin comunicación fiable, ` +
                `Zael era el hilo que cosía las comunidades unas con otras. ` +
                `Llevaba noticias de nacimientos y muertes. ` +
                `Llevaba peticiones de ayuda y promesas de amor. ` +
                `Llevaba advertencias. ` +
                `Intentó llevar una advertencia sobre el Silencio.`,

                `Nadie lo escuchó. ` +
                `Corrió de pueblo en pueblo, de montaña en montaña, ` +
                `gritando con toda la fuerza que el viento le daba. ` +
                `Y nadie. Levantó la vista. ` +
                `Porque los humanos llevan siglos aprendiendo a ignorar el viento. ` +
                `A verlo como ruido de fondo, como algo inevitable y sin importancia. ` +
                `La desesperación de no ser escuchado ` +
                `fue exactamente la grieta que el Silencio necesitaba. ` +
                `Entró por ahí y transformó al mensajero en la tormenta. ` +
                `Si nadie quiere escuchar el viento, ` +
                `que el viento se asegure de que no puedan ignorarlo.`,

                `El Rey de los Vendavales no destruye por crueldad. ` +
                `Destruye por la rabia acumulada de haber sido ignorado ` +
                `cuando más importaba. ` +
                `Cada ráfaga que lanza es una advertencia que nadie oyó. ` +
                `Cada tormenta es un grito de auxilio que llegó demasiado tarde.`,

                `El Fuego puede calentar lo que el frío de la soledad ha congelado. ` +
                `Sube a la meseta, invocador. ` +
                `Y esta vez, escucha. Escucha de verdad lo que el viento lleva.`,
            ],

            rage: `¡ESCÚCHAME! ¡AHORA SÍ QUE ME ESCUCHARÁS! ` +
                `¡CUANDO EL VENDAVAL LO ARRASTRA TODO NO HAY FORMA DE MIRAR HACIA OTRO LADO! ` +
                `¡DEMASIADO TARDE VINISTE, DEMASIADO TARDE PARA TODOS! ` +
                `¡EL VIENTO QUE ADVERTÍA SE HA CONVERTIDO EN EL VIENTO QUE COBRA!`,

            victory: [
                `El viento cae. ` +
                `No de golpe, sino como cuando una persona agotada por fin se permite descansar. ` +
                `La Meseta de los Ecos Rotos queda en silencio por primera vez en semanas. ` +
                `Pero es un silencio diferente al del Silencio. ` +
                `Es el silencio de la paz. El silencio que viene después de las lágrimas.`,

                `Y entonces el viento vuelve. ` +
                `Suave. Gentil. Como solía ser. ` +
                `Rodea tu cuerpo con una calidez imposible para el aire en estas alturas ` +
                `y entiendes que es un abrazo. El único abrazo que puede dar alguien ` +
                `hecho de aire y libertad.`,

                `Las palabras llegan dispersas, como siempre llegan las palabras del viento: ` +
                `"...te escuché... ` +
                `...me escuchaste... ` +
                `...eso era todo lo que necesitaba... ` +
                `...lleva mi voz a donde haga falta... ` +
                `...yo seguiré. Siempre sigo."`,

                `Y el viento continúa su camino. ` +
                `Pero ahora lleva algo diferente: ` +
                `el eco de una historia que por fin tuvo final.`,
            ],
        },

        earth: {
            preRoute: [
                `El Corazón de Piedra. ` +
                `Un lugar tan antiguo que los mapas de la Academia ` +
                `ni siquiera intentaban representarlo con precisión. ` +
                `"Aquí el suelo recuerda", ponía en los bordes del mapa. ` +
                `Solo eso. ` +
                `Los cartógrafos que intentaron ir más lejos no volvieron para corregirlo.`,

                `Rok. ` +
                `No es un nombre que alguien le pusiera. ` +
                `Es el nombre que él mismo se dio cuando los primeros humanos ` +
                `intentaron comunicarse con él y él necesitó una manera de responder. ` +
                `Rok, decía, como el sonido de una piedra cayendo en el agua. ` +
                `Corto. Definitivo. Exacto. ` +
                `Era la Memoria Viva de Aethelgard, ` +
                `el guardián de todo lo que había existido antes de que hubiera palabras ` +
                `para nombrarlo. ` +
                `Cuando los magos necesitaban entender algo muy antiguo, ` +
                `algo perdido en el tiempo antes de los registros escritos, ` +
                `iban a Rok. Y Rok recordaba. Siempre recordaba.`,

                `El Silencio no atacó a Rok. No se atrevió, al principio. ` +
                `Rok era demasiado grande, demasiado antiguo, ` +
                `demasiado profundamente arraigado en la realidad de Aethelgard. ` +
                `Así que el Silencio esperó. ` +
                `Fue borrando recuerdos, uno por uno, ` +
                `tan despacio que Rok no lo notaba. ` +
                `Un siglo. Dos siglos. Tres. ` +
                `Hasta que la Memoria Viva comenzó a olvidar. ` +
                `Y cuando Rok comprendió que estaba olvidando, ` +
                `el terror que sintió fue tan absoluto, tan incompatible con su naturaleza, ` +
                `que el Silencio pudo entrar por las grietas que el terror abrió.`,

                `El Titán de la Montaña no aplasta por maldad. ` +
                `Aplasta porque olvidó que había algo más. ` +
                `Aplasta porque el peso de lo que ya no recuerda ` +
                `es el único peso que le queda, ` +
                `y no sabe qué hacer con él salvo descargarlo sobre el mundo.`,

                `El Viento puede llevar lo que la piedra no puede soltar. ` +
                `Penetra en el Corazón de Piedra, invocador. ` +
                `Dale a Rok algo que recordar en sus últimos momentos. ` +
                `Ese recuerdo puedes ser tú.`,
            ],

            rage: `¡ROK RECUERDA! ¡ROK AÚN RECUERDA ALGO! ` +
                `¡RECUERDA EL PESO! ¡RECUERDA EL APLASTAMIENTO! ` +
                `¡RECUERDA QUE TODO LO QUE EXISTE TERMINA POR DESMORONARSE ` +
                `BAJO EL PESO DE LO QUE FUE Y YA NO ES! ` +
                `¡TÚ TAMBIÉN SERÁS POLVO, PEQUEÑA VOZ, POLVO Y SILENCIO!`,

            victory: [
                `La tierra se detiene. ` +
                `No el tipo de quietud ominosa que había antes. ` +
                `La quietud de algo que finalmente puede descansar ` +
                `después de un esfuerzo demasiado largo.`,

                `Sientes el suelo vibrar bajo tus pies. ` +
                `No de manera amenazante. ` +
                `Como un latido muy, muy lento. ` +
                `Como si la montaña entera respirara.`,

                `Y desde las profundidades de la piedra, ` +
                `tan bajo que lo sientes más en el pecho que en los oídos, ` +
                `llega algo que podría ser lenguaje: ` +
                `"...recuerdo. ` +
                `Recuerdo la primera vez que los humanos pusieron una mano en la piedra ` +
                `y preguntaron quién era yo. ` +
                `Recuerdo que respondí. ` +
                `Recuerdo que eso fue hermoso. ` +
                `Gracias por preguntarme otra vez."`,

                `El Corazón de Piedra se asienta. ` +
                `Profundamente, irrevocablemente, en paz. ` +
                `Y en las paredes de roca, si sabes escuchar, ` +
                `puedes oír el comienzo de algo que suena, muy remotamente, ` +
                `a memoria.`,
            ],
        },

    },

    finalBoss: {
        intro: [
            `Entonces has venido. Los cuatro guardianes han sido liberados. ` +
            `Las cuatro rutas han sido purificadas. ` +
            `Y ahora estás aquí, en el centro de todo, ` +
            `en el lugar donde el Silencio comenzó.`,

            `Soy lo que queda cuando se quita todo lo demás. ` +
            `No soy un guardián corrompido. No tengo historia trágica que te expliquen ` +
            `ni espíritu que liberar. ` +
            `Soy el espacio entre los elementos. ` +
            `Soy el hueco que nadie pensó en llenar. ` +
            `Soy la pausa entre dos notas que se volvió más larga que la música misma.`,

            `Has aprendido a escuchar. Eso es admirable. ` +
            `Pero yo cambio. No tengo elemento fijo. ` +
            `Soy todos y ninguno, y cambiaré una y otra vez ` +
            `hasta que tus reflejos fallen, hasta que tu concentración se quiebre, ` +
            `hasta que el agotamiento te haga cometer el error que yo llevo esperando.`,

            `Veinte vidas. Las contaré contigo, invocador. ` +
            `Porque incluso yo puedo apreciar la rareza de alguien ` +
            `que llega hasta aquí. ` +
            `Será una lástima que termine igual que todos los demás.`,
        ],

        victory: [
            `Algo cambia en el aire. ` +
            `No lo percibes de inmediato porque nunca has sentido esto antes. ` +
            `Nadie vivo lo ha sentido. ` +
            `Es la ausencia del Silencio. ` +
            `Un vacío que, paradójicamente, suena. ` +
            `Suena a todo lo que el Silencio había estado acallando.`,

            `Los cuatro elementos regresan. ` +
            `No violentamente, no en explosión. ` +
            `Regresan como el amanecer: inevitablemente, con calma, sin pedir permiso. ` +
            `El calor del Fuego devuelto. El murmullo del Agua liberada. ` +
            `El susurro del Viento que retoma su camino. ` +
            `El pulso de la Tierra que vuelve a latir.`,

            `Y desde todas partes a la vez, ` +
            `desde el Fuego y el Agua y el Viento y la Tierra, ` +
            `cuatro voces que reconoces: Ignar, la Gran Corriente, Zael, Rok. ` +
            `No dicen palabras. Solo hacen lo que hacían antes del Silencio. ` +
            `Simplemente están ahí. ` +
            `Y ese estar es el sonido más hermoso que Aethelgard ha producido en décadas.`,

            `Tú. En el centro de todo. ` +
            `El último mago de la Academia de los Ecos. ` +
            `El que escuchó cuando nadie más podía. ` +
            `El que respondió cuando todo decía que era imposible.`,

            `Los ecos de Aethelgard permanecen. ` +
            `Gracias a ti, permanecen.`,
        ],
    },

};

// ═══════════════════════════════════════════════════════
// Crónicas de los Antiguos Ecos
// Páginas del libro que copió y escondió el Archivero Tomás.
// Las cinco primeras suenan al superar los niveles 5, 10, 15, 20 y 25;
// la sexta, antes del Avatar; el epílogo, después de derrotarlo.
// ═══════════════════════════════════════════════════════

LORE.chronicles = {

    titles: {
        1: 'El Primer Canto',
        2: 'La Concordia',
        3: 'Aldara, la Oyente muda',
        4: 'El Oyente que tenía miedo',
        5: 'La noche en que se quebró el Gran Eco',
        6: 'El Aliento',
        epilogue: 'Epílogo: la campana vuelve a sonar',
    },

    1: [
        `Entre los escombros de un aula, tu mano tropieza con algo blando. No es piedra. Es papel. ` +
        `Una página arrancada de un libro muy grueso, con el borde quemado. ` +
        `En la Academia de los Ecos los libros no se leen: se escuchan. ` +
        `Basta con apoyar la palma sobre la tinta para que la página recuerde la voz de quien la escribió. ` +
        `Apoyas la mano. Y la página empieza a hablar.`,

        `Crónicas de los Antiguos Ecos. Copiadas de los cantares más viejos de Aethelgard ` +
        `por el Archivero Tomás, para que nadie las olvide. Capítulo primero: el Primer Canto.`,

        `Al principio no había mundo. Había un silencio enorme, quieto y frío, ` +
        `y en medio de ese silencio, una piedra que caía. Nadie sabe quién la soltó. ` +
        `Los cantares dicen solo que cayó durante mil años, y que al final tocó el agua. ` +
        `Ese fue el primer sonido de todos: una piedra cayendo en el agua. Rok. ` +
        `Así nació el primero de los Antiguos Ecos, el eco de la Tierra, ` +
        `tan viejo que su nombre es el propio golpe.`,

        `Del agua que la piedra agitó nacieron unos círculos que se abrían y se abrían sin terminar nunca: ` +
        `así nació la Gran Corriente, el eco del Agua. ` +
        `El aire que el golpe empujó corrió a contarlo a todas partes, tan deprisa que llegó antes que el propio sonido: ` +
        `así nació Zael, el eco del Viento. ` +
        `Y cuando la piedra rozó otra piedra en el fondo, saltó una chispa diminuta, curiosa, ` +
        `que quiso saber qué más podía crear. Así nació Ignar, el eco del Fuego, el más joven de los cuatro. ` +
        `Por eso Ignar nunca supo estarse quieto.`,

        `Los cuatro Antiguos Ecos cantaron juntos por primera vez, y de su canto salió Aethelgard: ` +
        `las montañas donde cantaba la Tierra, los mares donde cantaba el Agua, ` +
        `los valles por donde corría el Viento y las fraguas donde el Fuego aprendía a dar calor. ` +
        `Pero los cantares guardan un detalle que casi todos olvidan. ` +
        `Entre una frase y la siguiente, los cuatro se callaban un instante. ` +
        `Una pausa pequeña, del tamaño de un aliento. Sin ella, el canto habría sido solo ruido. ` +
        `Los Antiguos la llamaban así: el Aliento. ` +
        `Y la cuidaban como se cuida una llama en una noche de viento.`,

        `Del Primer Canto sobraron notas. Millones de ecos pequeños que rodaron por el mundo buscando dónde quedarse. ` +
        `Algunos se hicieron lobos junto a las hogueras. Otros, ranas en las charcas. ` +
        `Otros, murciélagos en las cuevas y gólems en los caminos. Los cantares los llaman el Coro. ` +
        `Cada criatura de Aethelgard es una nota suelta de aquella primera canción. ` +
        `Por eso cada una suena a su elemento. Y por eso, cuando el Silencio las corrompe, ` +
        `lo que oyes no es un monstruo. Es una nota desafinada que no recuerda la canción.`,

        `Al final hay una nota en el margen, con otra tinta y una letra más torcida: ` +
        `"Si alguien encuentra esta página: las demás están repartidas por todas partes. ` +
        `Las escondí yo. No podía dejar que el Silencio se las comiera. Búscalas. Tomás." ` +
        `La página se calla. Pero ahora, cada vez que oigas a una criatura, ` +
        `sabrás que estás oyendo un trozo del mundo que se perdió.`,
    ],

    2: [
        `Al terminar el combate, el silencio que queda tiene algo raro: suena a papel. ` +
        `Bajo los restos de una estantería encuentras otra página de las Crónicas, doblada en cuatro, ` +
        `con una mancha de cera. Apoyas la mano sobre la tinta. Capítulo segundo: la Concordia.`,

        `Los Antiguos Ecos sabían algo que los humanos tardaron siglos en entender: ` +
        `una canción no se canta una sola vez. Con los años, el mundo se desafina. ` +
        `Los ríos se olvidan de su curso, el viento cambia de humor, la tierra se cansa. ` +
        `Por eso, cada cincuenta años, los cuatro guardianes volvían a encontrarse en el centro de Aethelgard, ` +
        `en un anillo de piedras blancas llamado el Círculo de la Concordia, ` +
        `para cantar otra vez el Primer Canto y afinar el mundo entero.`,

        `Era una fiesta. Los cantares la cuentan con todo detalle, ` +
        `porque los cantores de antes eran muy aficionados a los detalles. ` +
        `Venía gente de los cuatro confines. Las ranas croaban el ritmo desde las charcas, ` +
        `los lobos aullaban la melodía, los murciélagos daban vueltas sobre el Círculo marcando el compás con las alas. ` +
        `Dicen que una vez un gólem intentó bailar, y que tardaron tres días en reconstruir el puente que pisó. ` +
        `Nadie se enfadó. Era la Concordia.`,

        `Pero en el centro de la fiesta había una tarea muy seria. ` +
        `Los guardianes podían cantar, pero no podían callar: ningún eco sabe guardar silencio, lo suyo es sonar. ` +
        `Así que en cada Concordia, una persona se ponía en medio del Círculo para sostener el Aliento, ` +
        `esa pausa pequeña entre frase y frase. Tenía que sostenerlo exactamente un aliento. ` +
        `Ni uno más. Ni uno menos. Y luego soltarlo, para que el canto siguiera. ` +
        `A esa persona la llamaban el Oyente.`,

        `Ser Oyente era el honor más grande de Aethelgard, y también el más caro. ` +
        `Mientras sostenía el Aliento, el Oyente prestaba su voz al silencio. ` +
        `Casi siempre, al amanecer, la Gran Corriente se la devolvía, como el mar devuelve las conchas a la playa. ` +
        `Casi siempre. Los cantares hablan de Oyentes que volvieron con la voz más grave, o más dulce, ` +
        `o con el acento de otra tierra. Y de unos pocos que no volvieron a hablar nunca.`,

        `Lo que los cantares no dicen lo anota Tomás en el margen, con su letra torcida: ` +
        `"He comparado las Concordias de los últimos trescientos años. ` +
        `En cada una, el Oyente sostuvo el Aliento un poquito más que el anterior. Un latido más. Medio latido. ` +
        `Nadie se dio cuenta, porque era muy poco. Pero los Oyentes tenían miedo de soltar demasiado pronto ` +
        `y estropear la canción. Y el miedo, poco a poco, hizo la pausa más grande. ` +
        `Creo que el Silencio no llegó de repente. Creo que lo fuimos dejando entrar, un latido cada vez."`,

        `La página termina con una frase subrayada dos veces: ` +
        `"La última Concordia la sostuvo la Maestra Aldara, hace cincuenta y cuatro años. ` +
        `Después fundó la Academia. Y nunca volvió a decir una palabra." ` +
        `Doblas la página con cuidado. Más allá de los muros, los Campos Corrompidos te esperan.`,
    ],

    3: [
        `La Sombra se ha deshecho, pero algo de ella se ha quedado flotando en el aire: un olor a ceniza fría. ` +
        `Y en el suelo, justo donde cayó, una página. Como si la hubiera llevado encima todo este tiempo. ` +
        `Apoyas la mano. La tinta tarda en hablar, como si le diera miedo. Capítulo tercero: Aldara.`,

        `Aldara era hija de pastores de las colinas del sur. ` +
        `Dicen que de niña se perdió en las cuevas que hay bajo el Círculo de la Concordia ` +
        `y que pasó tres días a oscuras. No lloró. Escuchó. ` +
        `Escuchó chillar a los murciélagos, oyó cómo volvía su chillido y aprendió de ellos a ver con el sonido. ` +
        `Cuando la encontraron, salió de la cueva caminando sola, sin antorcha, sin tropezar ni una vez. ` +
        `Los guardianes la eligieron Oyente cuando tenía diecinueve años.`,

        `De su Concordia, hace cincuenta y cuatro años, solo queda lo que ella escribió después, ` +
        `porque ya no podía contarlo de otra forma. Tomás copió sus palabras tal cual: ` +
        `"Sostuve el Aliento como me enseñaron. Un aliento. Pero dentro de la pausa había algo. ` +
        `No era silencio. Era algo que escuchaba. Llevaba siglos escuchando, aprendiendo cómo sonamos, ` +
        `esperando a que uno de nosotros se quedara dentro el tiempo suficiente. ` +
        `Lo sentí acercarse a mi voz como un animal se acerca al fuego. Solté el Aliento. Lo solté a tiempo. ` +
        `Pero se quedó con mi voz."`,

        `"No volví a hablar. No lo lamento. Aprendí que se puede enseñar sin hablar. ` +
        `Fundé esta casa para que nunca falte quien sepa escuchar. ` +
        `Aquí no se enseña a gritar más fuerte que el enemigo. Se enseña a oírlo antes de que llegue." ` +
        `Esa es la regla que todos los aprendices aprendían el primer día, grabada sobre la puerta de la Academia: ` +
        `escucha antes de responder. Ahora sabes de dónde viene.`,

        `Aldara murió cuatro años antes de la siguiente Concordia, ` +
        `y a la Academia le costó elegir a quien debía sustituirla. ` +
        `Esos cuatro años de retraso fueron un regalo para lo que vivía en la pausa. ` +
        `El Aliento, sin nadie que lo afinara, empezó a abrirse. ` +
        `Por los bordes del mundo aparecieron las primeras criaturas desafinadas. Las primeras corrupciones. ` +
        `La Maestra Sylvara las estudió, y su grabación ya la has oído: ` +
        `veintidós estudiantes murieron para aprender que nunca se ataca a una criatura con su propio elemento.`,

        `Al final de la página, lo último que escribió Aldara, con la letra temblorosa de alguien muy anciano: ` +
        `"La próxima vez no esperará a que alguien se quede dentro. Saldrá a buscar quien lo escuche. ` +
        `Que el próximo Oyente no tenga miedo. El miedo es la puerta." ` +
        `Debajo, Tomás añadió solo unas palabras: "Hemos elegido a Darién. Ojalá."`,
    ],

    4: [
        `Esta página no estaba escondida. Estaba guardada. ` +
        `La encuentras dentro de una caja de latón, envuelta en un pañuelo, ` +
        `entre los restos de lo que fue un dormitorio de aprendices. ` +
        `En la tapa, grabado a punta de navaja, un nombre: Darién. ` +
        `Apoyas la mano. Capítulo cuarto: el Oyente que tenía miedo.`,

        `Darién llegó a la Academia con nueve años y una cicatriz en la mano izquierda. ` +
        `Venía de Valdebrasa, una aldea de los valles que ya no existe. ` +
        `Una noche de verano, el Viento sopló demasiado fuerte sobre un incendio pequeño, ` +
        `y el incendio dejó de ser pequeño. Darién fue el único que salió de allí. ` +
        `Desde entonces no soportaba el ruido: las tormentas, las hogueras, los gritos. ` +
        `Cuando todos dormían, se escapaba al patio, porque era el único sitio en silencio.`,

        `Era el mejor alumno que había tenido la Academia en medio siglo. ` +
        `Distinguía a un lobo de otro por cómo respiraba. Oía llegar la lluvia antes que las ranas. ` +
        `Y era, también, el mejor amigo de un aprendiz flaco y despistado que lo archivaba todo, ` +
        `hasta las recetas de la cocina. Tomás escribió en el margen: ` +
        `"Darién se ríe de mí porque lo apunto todo. Dice que algún día no quedará nadie para leerlo. ` +
        `Yo le digo que por eso mismo."`,

        `Cuando eligieron a Darién como Oyente, toda la Academia lo celebró. Él no. ` +
        `Aquella noche le hizo a la Maestra Sylvara una pregunta que ella anotó en su cuaderno, porque le pareció extraña: ` +
        `"Maestra, ¿y si el Aliento no se soltara nunca? Si la pausa durara para siempre, ya no habría tormentas. ` +
        `Ni incendios. Nadie volvería a perder a nadie. ¿No sería eso la paz?" ` +
        `Sylvara le contestó que una pausa que no termina no es paz: es el final de la canción. ` +
        `Darién asintió. Pero no volvió a preguntar. Y eso, escribió Sylvara, la preocupó más que la pregunta.`,

        `Durante las semanas siguientes, Tomás lo vio practicar a solas en el Círculo. ` +
        `Sostenía el silencio cada vez más tiempo. Diez latidos. Veinte. Un minuto entero. ` +
        `Y hablaba en voz baja con algo que Tomás no podía oír. ` +
        `"Le pregunté con quién hablaba. Me dijo que con la pausa. Que la pausa le escuchaba mejor que nadie. ` +
        `Me lo dijo sonriendo, y era la primera vez en años que lo veía sonreír. ` +
        `Debería haber avisado a alguien. No lo hice. Era mi amigo."`,

        `La página termina con una lista, con la letra de alguien que no puede dormir: ` +
        `cosas que hay que llevar a la Concordia. Velas. Agua para los guardianes, aunque no beben. Pan. ` +
        `Y al final, tachado y vuelto a escribir: "Quedarme cerca de Darién." ` +
        `La Concordia era al día siguiente. Lo que pasó esa noche, invocador, ya lo sabes a medias. ` +
        `Pronto lo sabrás entero.`,
    ],

    5: [
        `La Sombra cae por segunda vez. Y esta vez, antes de deshacerse, hace algo que nunca había hecho: ` +
        `deja de imitar. Durante un instante muy corto no suena a lobo, ni a rana, ni a nada. ` +
        `Suena a una persona. Una voz joven, rota, que casi no se oye: ` +
        `"Ciérrala. Por favor. Yo no puedo." ` +
        `Y luego, nada. Solo una página en el suelo. La última que escribió Tomás.`,

        `Capítulo quinto: la noche de la Concordia. ` +
        `Hace cuarenta y siete días, los cuatro guardianes llegaron al Círculo de piedras blancas. ` +
        `Rok, tan grande que la colina crujía bajo su peso. ` +
        `La Gran Corriente, que subió por el río como una marea. ` +
        `Zael, que llegó antes que nadie, nervioso, dando vueltas alrededor de Darién sin parar. ` +
        `Y Ignar, cargando al hombro la campana que forjó para la primera Concordia, ` +
        `la que suena para avisar al Oyente de que es hora de soltar el Aliento.`,

        `Empezó el canto. Tomás escribe que nunca había oído nada tan hermoso. ` +
        `La Tierra sostenía el ritmo, el Agua la melodía, el Viento la llevaba lejos y el Fuego le daba luz. ` +
        `Y llegó la primera pausa. Darién levantó las manos y sostuvo el Aliento. Un aliento. Dos. ` +
        `Ignar golpeó la campana para avisarle. La campana no sonó. ` +
        `Ignar la golpeó otra vez, y otra, y otra. Nada. El silencio se había comido el sonido de la campana.`,

        `Darién no soltó. Tomás estaba lo bastante cerca para verle la cara, y escribe que no parecía asustado. ` +
        `Parecía en paz. Entonces la pausa se abrió como una puerta que nadie había abierto en trescientos años, ` +
        `y lo que vivía dentro salió. No tenía forma. No tenía voz. ` +
        `Era el hueco entre las notas, que por fin se había hecho más grande que la música. ` +
        `Le quitó la voz a Darién de un solo bocado y, con ella, se fabricó un cuerpo. ` +
        `Eso es lo que hoy llamamos el Avatar del Silencio.`,

        `Los guardianes intentaron cerrar la puerta cantando más fuerte, ` +
        `y el Silencio entró en cada uno por su propia grieta. ` +
        `En Ignar, por la desesperación de no poder hacer sonar su campana. ` +
        `En la Gran Corriente, por el cansancio. En Zael, por la rabia de que nadie lo hubiera escuchado a tiempo. ` +
        `En Rok, por el terror de todo lo que ya había olvidado. El Gran Eco se quebró. ` +
        `Y Darién, sin voz y sin cuerpo, se convirtió en una sombra que solo puede hablar con las voces de los demás.`,

        `La última línea de Tomás está escrita casi a ciegas, torcida, saliéndose de la página: ` +
        `"No fue maldad. Fue miedo. Darién quería que nadie volviera a perder a nadie. ` +
        `Si alguien encuentra esto: no lo odies. Ciérrala por él." ` +
        `Ahora entiendes las dos voces de la Sombra. La que se burla de ti es el Silencio, que habla a través de ella. ` +
        `La otra, la que acabas de oír, es lo que queda de Darién. ` +
        `Y lo que queda de Darién quiere que llegues al centro y hagas lo que él no pudo: soltar el Aliento.`,
    ],

    6: [
        `Antes de entrar en el centro, oyes algo a tu espalda. No es una criatura. ` +
        `Son cuatro presencias que reconoces: el calor tranquilo de Ignar, el rumor de la Gran Corriente, ` +
        `el roce de Zael, el latido lento de Rok. Te han seguido. ` +
        `No pueden luchar a tu lado: el Silencio aún es demasiado fuerte para ellos. ` +
        `Pero han venido a contarte lo último que necesitas saber. ` +
        `Y lo hacen como lo hacían al principio del mundo: cantando muy bajo.`,

        `El centro de Aethelgard es el Círculo de la Concordia. ` +
        `Las piedras siguen ahí, pero ya no son blancas. ` +
        `Lo que te espera en medio no es un monstruo nacido del odio. Es el Aliento. ` +
        `La pausa del Primer Canto. La que los Antiguos cuidaban como una llama en una noche de viento. ` +
        `Trescientos años de Oyentes con miedo la hicieron crecer latido a latido, ` +
        `y la noche de la Concordia, con la voz robada de Darién, aprendió a tener cuerpo.`,

        `Rok habla primero, y su voz suena como la montaña entera: ` +
        `"Ahora recuerdo. Lo primero que olvidé fue su nombre. Se llamaba Aliento. Y un aliento siempre se suelta. ` +
        `Cuando lo olvidé, se quedó solo con el nombre que le pusisteis por miedo: Silencio. ` +
        `Y el silencio no tiene por qué terminar."`,

        `Luego Zael, rápido, como siempre: ` +
        `"No luches contra él como si fuera un enemigo. Escúchalo. Cambiará de elemento una y otra vez, ` +
        `porque está hecho de los huecos entre los cuatro. Respóndele a cada uno." ` +
        `Y la Gran Corriente, despacio: ` +
        `"Cuando esté a punto de apagarse, no tengas miedo de la pausa. Sostenla. Un aliento. Solo uno." ` +
        `Y por último Ignar, con su calor de hogar: ` +
        `"Y luego suéltala, invocador. Esta vez la campana sonará. Te lo prometo."`,

        `Las cuatro voces se apagan, pero no se van. ` +
        `Se quedan alrededor del Círculo, como se quedaba la gente en las Concordias de antes, ` +
        `esperando a que empiece la canción. ` +
        `Aldara no tuvo miedo, y perdió la voz. Darién tuvo miedo, y lo perdió todo. ` +
        `Ahora te toca a ti. No como guerrero. Como Oyente. Entra.`,
    ],

    epilogue: [
        `Pero aún queda algo por hacer. En el centro del Círculo, donde estaba el Avatar, queda un hueco en el aire. ` +
        `Una pausa. Pequeña, temblorosa, del tamaño de un aliento. ` +
        `Los cuatro guardianes empiezan a cantar a tu alrededor el Primer Canto, ` +
        `por primera vez desde la noche en que se quebró el Gran Eco. Y llega la pausa. Es tu turno.`,

        `Sostienes el Aliento. Dentro hay algo que escucha, igual que lo oyó Aldara. ` +
        `Pero ya no es hambre. Es cansancio. ` +
        `Un hueco que lleva trescientos años abierto y que solo quiere que alguien le recuerde su nombre. ` +
        `Así que se lo dices, sin voz, como se dicen las cosas importantes: Aliento. ` +
        `Y la pausa recuerda lo que es. Un aliento siempre se suelta.`,

        `Ignar levanta el martillo y golpea su campana. Y la campana suena. ` +
        `Suena tan fuerte que se oye a tres valles de distancia, como en los cantares. ` +
        `Sueltas el Aliento. El canto sigue. ` +
        `El mundo se afina como un instrumento que llevaba demasiado tiempo guardado: ` +
        `el Agua recuerda su curso, el Viento su camino, la Tierra su memoria y el Fuego su hogar.`,

        `En el último instante, entre las voces de los guardianes, oyes una más. Joven. Ya no está rota. ` +
        `"Gracias. Ya puedo soltarlo yo también." ` +
        `Es Darién. No vuelve: ya no tiene cuerpo al que volver. Pero su voz no se apaga. ` +
        `Se queda en el canto, como una nota más del Coro. Y el Coro, por fin, vuelve a estar completo.`,

        `Por los campos de Aethelgard, los lobos vuelven a buscar hogueras donde acurrucarse. ` +
        `Las ranas croan anunciando lluvia, y aciertan, salvo los martes. ` +
        `Los murciélagos chillan en las cuevas, y su eco vuelve lleno. ` +
        `Y en las ruinas de la Academia, alguien que todavía no conoces encuentra un libro en blanco, ` +
        `apoya la mano en la primera página y empieza a escribir. ` +
        `Un capítulo nuevo de las Crónicas de los Antiguos Ecos: el Oyente que no tuvo miedo. ` +
        `Ese capítulo es tuyo.`,
    ],
};

// ═══════════════════════════════════════════════════════
// Historia de cada criatura (suena la primera vez que aparece)
// ═══════════════════════════════════════════════════════

LORE.creatures = {

    wolf_fire: [
        `Lobos de Fuego. Antes del Silencio no se llamaban así: se llamaban Lobos del Hogar. ` +
        `Eran notas sueltas del Primer Canto que se quedaron a vivir junto a las hogueras, ` +
        `y en cada casa de Aethelgard había uno. ` +
        `En invierno se enroscaban junto a la cuna de los niños para darles calor, ` +
        `y su aullido al amanecer servía para encender los fogones. ` +
        `En la cocina de la Academia vivía uno llamado Chispa que robaba pan recién hecho ` +
        `y que, según el Archivero Tomás, nunca fue castigado, porque era imposible enfadarse con él.`,

        `El Silencio no les quitó el fuego. Les quitó el hogar. ` +
        `Y un fuego sin hogar solo sabe hacer una cosa: tener hambre. ` +
        `Ahora corren en manada por las ruinas, buscando unas casas que ya no existen. ` +
        `El Agua no los odia: los calma, como la lluvia calma un fuego que se ha descontrolado. ` +
        `Recuérdalo cuando los oigas aullar.`,
    ],

    frog_water: [
        `Ranas de Agua. Los campesinos las llamaban Ranas de Lluvia, ` +
        `porque su canto anunciaba el agua con tres días de antelación. ` +
        `Nadie sembraba sin escucharlas primero. Acertaban siempre, salvo los martes. ` +
        `Nadie sabe por qué los martes no. Los cantares recogen catorce teorías distintas, y todas son malas.`,

        `Cuando llegó el Silencio, las ranas dejaron de oír su propio canto. ` +
        `Y una rana que no oye su canto no sabe cuándo va a llover, ` +
        `así que empezó a guardar toda el agua que encontraba, por si acaso. ` +
        `Hoy anegan los campos y te saltan a los pies cuando menos te lo esperas. Son pequeñas, pero traicioneras. ` +
        `La Tierra las detiene como una presa detiene un río: le devuelve al agua su forma.`,
    ],

    bat_wind: [
        `Murciélagos de Viento. Escúchalos con respeto, invocador, porque en cierto modo son tus primeros maestros. ` +
        `Fueron ellos quienes enseñaron a los primeros Oyentes a ver con el sonido: ` +
        `chillan, el chillido rebota en las paredes y vuelve, y por cómo vuelve saben dónde está todo. ` +
        `Llevaban el viento hasta lo más hondo de las cuevas, para que allí abajo también se pudiera respirar.`,

        `El Silencio les hizo la peor de las crueldades: ahora, cuando chillan, el eco no vuelve. ` +
        `Imagina gritar en la oscuridad y que nada te conteste. ` +
        `Por eso aletean frenéticos y chillan sin parar, cada vez más agudo, intentando oír algo, lo que sea. ` +
        `El Fuego doma su viento y, por un instante, les devuelve el eco que perdieron.`,
    ],

    golem_earth: [
        `Gólems de Tierra. Los cantares dicen que, a lo largo de los siglos, ` +
        `Rok fue dejando caer piedras de su memoria por todo Aethelgard, y que cada piedra se levantó y echó a andar. ` +
        `Cada gólem guardaba un recuerdo de Rok. Uno, la primera lluvia. ` +
        `Otro, el nombre de un río que ya no existe. ` +
        `Otro, la canción con la que una madre dormía a su hija hace mil años. ` +
        `Cuidaban los caminos, reparaban los puentes y no tenían ninguna prisa.`,

        `Cuando Rok empezó a olvidar, los recuerdos de los gólems se borraron con él. ` +
        `Ahora caminan sin saber qué guardan, y aplastan los mismos puentes que antes reparaban. ` +
        `Por eso sus pasos hacen temblar el suelo. ` +
        `El Viento los desgasta, sí, pero también se lleva el polvo de lo que olvidaron, y les deja descansar.`,
    ],

    magma_elem: [
        `Elemental de Magma. Las criaturas élite no nacieron así. ` +
        `Cuando el Silencio empezó a apagar el Coro, muchas notas se quedaron solas, y una nota sola se apaga enseguida. ` +
        `Así que hicieron lo único que podían hacer para no desaparecer: se agarraron unas a otras. ` +
        `Dos voces se fundieron en un solo cuerpo. Por eso tienen dos elementos. ` +
        `Y por eso hacen falta dos voces, un dúo, para responderles de verdad.`,

        `Los Elementales de Magma eran Lobos del Hogar y gólems de las fraguas de la Academia, ` +
        `los que cargaban el mineral y avivaban los hornos. ` +
        `Cuando las fraguas se desplomaron, se fundieron en lava: arden y pesan a la vez. ` +
        `El Agua y el Viento juntos, la Tormenta de Hielo, enfrían su fuego y rompen su piedra al mismo tiempo.`,
    ],

    storm_spec: [
        `Espectro Tormenta. Antes eran los Cantores de Bruma: espíritus de agua y viento que vivían en la niebla de las costas. ` +
        `Cuando un barco se perdía en la bruma, cantaban para guiarlo a puerto, ` +
        `y los marineros les dejaban conchas en las rocas para darles las gracias. ` +
        `Eran amigos de la Gran Corriente, que les prestaba sus olas para cantar.`,

        `Cuando la Corriente se quedó quieta en el fondo del abismo, los Cantores de Bruma perdieron su música, y con ella, el rumbo. ` +
        `Su canto se volvió un lamento entre truenos, ` +
        `y ahora llevan a los viajeros hacia la tormenta en lugar de hacia el puerto. ` +
        `La Tierra y el Fuego juntos, la Lava Ardiente, les dan suelo firme y calor para que la niebla se disipe.`,
    ],

    ent_forest: [
        `Ent del Bosque. En el Bosque Susurrante, junto a la Academia, los árboles más viejos caminaban. ` +
        `Muy despacio: un paso cada cien años, siguiendo el curso de los ríos. ` +
        `Se contaban historias de raíz a raíz, y la Maestra Sylvara daba sus clases a la sombra de uno de ellos, ` +
        `porque decía que los ents eran los únicos que la escuchaban sin interrumpir.`,

        `El Silencio cortó los susurros entre las raíces. ` +
        `Un árbol que deja de oír al bosque cree que es el último árbol del mundo, y esa soledad lo enloquece. ` +
        `Ahora los ents caminan deprisa, demasiado deprisa, aplastando lo que encuentran. ` +
        `El Fuego y el Viento juntos, la Llamarada Ciclónica, son como el incendio que renueva un bosque viejo: ` +
        `duele, pero deja sitio para que algo vuelva a crecer.`,
    ],

    djinn_desert: [
        `Djinn del Desierto. Allí donde Zael no podía llegar, en los desiertos del este, sus mensajes los llevaban los djinn: ` +
        `remolinos de arena y viento con campanillas, que se adelantaban a las caravanas para anunciar su llegada. ` +
        `Cuando en un oasis se oían esas campanillas, la gente salía a recibir a los viajeros con agua fresca. ` +
        `Eran la mejor noticia del desierto.`,

        `Cuando nadie quiso escuchar a Zael, a los djinn tampoco los escuchó nadie. ` +
        `Sus campanillas siguen sonando, pero ya no anuncian a nadie, ` +
        `y la rabia de llamar sin respuesta les hizo enterrar los caminos que antes guiaban. ` +
        `El Agua y el Fuego juntos, el Vapor Abrasador, vuelven pesada la arena y apagan el remolino.`,
    ],
};

// ═══════════════════════════════════════════════════════
// Leyendas de los guardianes (al superar el nivel 3 de su ruta)
// y el encuentro antes del combate
// ═══════════════════════════════════════════════════════

Object.assign(LORE.bosses.fire, {
    legendTitle: 'La campana de los tres valles',
    legend: [
        `Entre la escoria encuentras un trozo de metal curvo, todavía tibio, del tamaño de una mano. Es bronce. ` +
        `Y al rozarlo, suena: una nota limpia, dorada, que se apaga enseguida. ` +
        `Es un pedazo de algo mucho más grande. Recuerdas lo que contaban las Crónicas: la campana de Ignar.`,

        `Para la primera Concordia, hace miles de años, Ignar quiso forjar algo que avisara al Oyente ` +
        `de que había llegado el momento de soltar el Aliento. ` +
        `Algo que se oyera por encima del canto de los cuatro guardianes. Tardó cien años. ` +
        `Fundió en ella un poco de cada elemento: arena del desierto, agua de la primera lluvia, ` +
        `aire de una tormenta y una chispa de su propio corazón. ` +
        `Cuando la tocó por primera vez, se oyó a tres valles de distancia, ` +
        `y las ranas se callaron de respeto durante una semana entera.`,

        `En todas las Concordias, la campana sonó. En todas, menos en la última. ` +
        `Aquella noche, Ignar la golpeó y no sonó nada. Volvió a golpearla. Nada. ` +
        `El Silencio se había tragado su voz. ` +
        `Y el artista que nunca había fallado una obra se encontró ante lo único que no sabía arreglar.`,

        `Por eso Ignar golpea su yunque sin descanso. No forja armas. No forja nada. ` +
        `Intenta, una y otra vez, que vuelva a sonar la campana. ` +
        `Y cada golpe fallido salta en chispas: las brasas que te lanzará en combate son trozos de su desesperación. ` +
        `Apágalas con cuidado. Cada una fue un intento de arreglar el mundo.`,
    ],
    encounter: [
        `Al final de las Tierras de Escoria, la tierra se abre en un cráter, y en el fondo del cráter está la forja. ` +
        `El calor es tan fuerte que el aire tiembla y zumba. ` +
        `Y en medio de ese zumbido, un ritmo: clan, clan, clan. Un martillo sobre un yunque vacío.`,

        `Ignar es enorme. Ya no tiene la forma de un herrero, sino la de un incendio que recuerda vagamente haber tenido brazos. ` +
        `Golpea sin mirar lo que golpea. Y entre golpe y golpe, murmura: ` +
        `"No suena. ¿Por qué no suena? Otra vez. Otra vez. Golpearé hasta que el mundo entero sea una campana." ` +
        `De pronto se detiene. Te ha oído llegar. ` +
        `"Tú. Tú tienes voz. Dámela. Con tu voz sí sonará."`,

        `Esa es la grieta por la que entró el Silencio: la desesperación de un creador que ya no puede crear. ` +
        `No lo odies. Apaga su forja. ` +
        `Dentro de esas llamas, el artista sigue esperando a que alguien le diga que no fue culpa suya.`,
    ],
});

Object.assign(LORE.bosses.water, {
    legendTitle: 'La que devuelve las voces',
    legend: [
        `En una roca de las Fosas, la corriente ha dejado un montón de conchas. Cientos. ` +
        `Todas blancas, ordenadas en espiral con una paciencia que no es humana. ` +
        `Si te acercas una al oído, no suena el mar. Suena una voz. Muy lejana. ` +
        `Diciendo una sola palabra que no llegas a entender.`,

        `Las Crónicas cuentan que, después de cada Concordia, la Gran Corriente recorría todos los mares ` +
        `buscando la voz que el Oyente había prestado al silencio. ` +
        `La encontraba siempre, enredada en algún sitio, y al amanecer la dejaba en la orilla dentro de una concha, ` +
        `para que el Oyente la recogiera al despertar. ` +
        `Por eso, en las costas, los niños se acercan las conchas al oído: dicen que dentro hay voces perdidas.`,

        `Hace cincuenta y cuatro años, la Gran Corriente no encontró la voz de Aldara. ` +
        `La buscó por todos los mares. Luego por todos los ríos. Luego en cada charca, en cada gota, en cada lágrima. ` +
        `Cincuenta y cuatro años sin dejar de buscar. ` +
        `Estas conchas son las que trajo, una por una, por si alguna era la buena. Ninguna lo era.`,

        `Cuando llegó el Silencio, encontró a la Corriente agotada de tanto buscar, ` +
        `y le ofreció lo único que ella ya deseaba: dejar de moverse. ` +
        `Por eso el Leviatán se desplaza antes de atacar. Es lo que queda de aquella búsqueda: ` +
        `un movimiento sin destino que sigue cambiando de sitio por costumbre, aunque ya no recuerde qué buscaba.`,
    ],
    encounter: [
        `En lo más hondo de las Fosas, el agua deja de moverse. ` +
        `Es una quietud tan completa que oyes tu propio corazón como si estuviera fuera de ti. ` +
        `Y entonces, en esa quietud, un canto. Grave, enorme, lentísimo. ` +
        `Un canto de ballena que dura tanto que olvidas cuándo empezó.`,

        `El Leviatán Abisal no tiene una forma fija. Es el abismo mismo, que se ha cansado de estar solo. ` +
        `Su voz te llega de todas partes a la vez: ` +
        `"Te estaba buscando. Llevo tanto tiempo buscando. ¿Eres tú lo que perdí? ` +
        `Quédate. Aquí abajo ya no hay que buscar nada. Aquí abajo, todo se queda."`,

        `La grieta del Leviatán fue el cansancio: cincuenta y cuatro años buscando una voz que no aparecía. ` +
        `El Silencio le prometió descanso, y le dio quietud. No es lo mismo. ` +
        `Ánclate en la Tierra, escucha adónde va, y devuélvele el movimiento.`,
    ],
});

Object.assign(LORE.bosses.wind, {
    legendTitle: 'El aviso que nadie oyó',
    legend: [
        `En lo alto de la meseta, el viento golpea una y otra vez contra una roca hueca, y la roca silba. ` +
        `Si te quedas quieto, el silbido parece una palabra. Siempre la misma. ` +
        `Tardas en entenderla: cuidado. Cuidado. Cuidado. Lleva semanas repitiéndola.`,

        `Zael fue el primero en saberlo. Un mes antes de la Concordia, pasó de noche sobre el Círculo ` +
        `y vio a un aprendiz solo, sosteniendo el silencio mucho más de un aliento, y hablando con él en voz baja. ` +
        `Zael conocía el Aliento mejor que nadie: había nacido del aire que empujó el primer golpe. ` +
        `Supo enseguida lo que estaba pasando. Y corrió a avisar.`,

        `Avisó a los pastores, que cerraron las ventanas porque hacía corriente. ` +
        `Avisó a los pescadores, que dijeron que se acercaba mal tiempo. ` +
        `Avisó a la Academia golpeando las contraventanas toda la noche, ` +
        `y los maestros pusieron cuñas de madera para que dejaran de hacer ruido. ` +
        `Avisó a todos, de todas las formas en que sabe avisar el viento. ` +
        `Nadie entendió que el viento estaba hablando.`,

        `Por eso Zael lanza ecos falsos en combate. No intenta engañarte. ` +
        `Son copias de su aviso, repetido tantas veces que ya no sabe cuál era el de verdad. ` +
        `El grito cercano es Zael. Los lejanos son las mil veces que gritó cuidado y nadie se dio la vuelta. ` +
        `Esta vez, escucha el de verdad.`,
    ],
    encounter: [
        `En el borde de la meseta, el viento sopla tan fuerte que tienes que inclinarte para no caer. ` +
        `Y no es un viento: son cientos de voces a la vez, todas gritando, todas lejanas, todas iguales. ` +
        `Hasta que una, muy cerca de tu oído, grita más fuerte que las demás.`,

        `"¿Ahora? ¿Ahora vienes? ¡Lo dije! ¡Lo dije en cada ventana, en cada campana, en cada hoja! ¡Y nadie! ` +
        `Ahora vas a escucharme. Ahora el mundo entero va a escucharme, aunque tenga que arrancarle los tejados."`,

        `La grieta de Zael fue no ser escuchado cuando más importaba. Su rabia es real, y es justa. ` +
        `Pero el Silencio la ha convertido en tormenta. ` +
        `Dale lo único que nunca le dieron: atención. Escucha cuál de sus gritos es el verdadero, ` +
        `y respóndele con el Fuego que calienta.`,
    ],
});

Object.assign(LORE.bosses.earth, {
    legendTitle: 'Lo primero que Rok olvidó',
    legend: [
        `En las paredes del Corazón de Piedra hay marcas. Miles. ` +
        `Pequeños surcos en la roca, como los que hace un preso para contar los días. Pero no cuentan días. ` +
        `Si pasas los dedos por ellos, cada surco vibra con un recuerdo distinto: ` +
        `una risa, una tormenta, el crujido de un árbol al caer. ` +
        `Son los recuerdos que Rok fue grabando en la piedra cuando se dio cuenta de que los estaba perdiendo.`,

        `Hay un surco más profundo que los demás, el más antiguo, y está vacío. No vibra. No suena. ` +
        `Es el lugar donde Rok intentó guardar lo primero que olvidó, hace trescientos años, y llegó demasiado tarde. ` +
        `Las Crónicas sí lo recuerdan: lo primero que olvidó Rok fue el nombre de la pausa. El Aliento.`,

        `Parece poca cosa, un nombre. No lo es. Un aliento es algo que entra y sale. Algo que siempre se suelta. ` +
        `Cuando Rok olvidó ese nombre, el mundo entero empezó a olvidarlo con él, ` +
        `y la gente empezó a llamar a la pausa de otra forma: el Silencio. ` +
        `Y el silencio, a diferencia del aliento, no tiene por qué terminar. ` +
        `Desde ese día, cada Oyente la sostuvo un poco más.`,

        `Por eso Rok alza su escudo de piedra en combate. ` +
        `Se encierra para proteger los pocos recuerdos que le quedan, como quien se abraza a lo último que tiene. ` +
        `Cuando lo oigas, no golpees: espera a que lo baje. ` +
        `Lo que hay detrás del escudo no es un arma. Es un anciano asustado abrazando su memoria.`,
    ],
    encounter: [
        `El túnel se abre en una caverna tan grande que el eco de tus pasos tarda segundos en volver. ` +
        `En el centro, algo que parecía una montaña se mueve. Muy despacio. Y el suelo entero se inclina con él.`,

        `La voz de Rok sale de la roca, de todas partes, tan grave que la sientes en los dientes: ` +
        `"¿Quién eres? No. No me lo digas. Lo olvidaré. Lo olvido todo. Todo se va. ` +
        `Si te aplasto, al menos no tendré que olvidarte."`,

        `La grieta de Rok fue el terror: el terror de la Memoria Viva al darse cuenta de que estaba olvidando. ` +
        `Todo lo que destruye, lo destruye para no tener que perderlo despacio. ` +
        `Muévelo con el Viento. Y cuando caiga el escudo, recuérdale quién era.`,
    ],
});

// ═══════════════════════════════════════════════════════
// Textos de apoyo
// ═══════════════════════════════════════════════════════

const LORE_EXTRA = {

    echoTitles: {
        '1': 'Bienvenida a Aethelgard',
        '10': 'Eco de la Maestra Sylvara',
        '15_shadow': 'La voz en la sombra',
        '20': 'Diario del Archivero Tomás',
        '25_shadow': 'La voz en la sombra, otra vez',
        '30': 'El umbral',
    },

    acts: {
        11: [
            `Acto segundo. Los Campos Corrompidos.`,
            `Más allá de los muros de la Academia, los campos que alimentaban a Aethelgard ` +
            `se han llenado de criaturas élite: seres que han absorbido tanto Silencio ` +
            `que ya no tienen un solo elemento, sino dos. ` +
            `Recuerda las palabras de Sylvara. Los dúos son la diferencia entre vivir y desaparecer.`,
        ],
        21: [
            `Acto tercero. El Umbral.`,
            `El aire se vuelve denso. Los sonidos llegan deformados, como a través del agua. ` +
            `Estás cerca del corazón del Silencio, y él lo sabe. ` +
            `A partir de aquí, nada será amable contigo.`,
        ],
    },

    shadow: {
        15: [
            `Una forma sin forma se desliza entre los enemigos. La Sombra Imitadora.`,
            `Los supervivientes dicen que apareció la misma noche en que se quebró el Gran Eco, ` +
            `y que desde entonces vaga por la Academia como si buscara algo que perdió.`,
            `No tiene voz propia: roba la de las criaturas que ya conoces, ` +
            `pero sus imitaciones suenan distorsionadas, como un eco enfermo.`,
            `Escucha a quién imita y respóndele como si fuera esa criatura. ` +
            `Si imita a un Lobo de Fuego, usa Agua. Si imita a una Rana, usa Tierra.`,
        ],
        25: [
            `La Sombra ha vuelto. Más grande. Más hambrienta.`,
            `Ahora también imita a las criaturas élite. Que no te engañe su disfraz: ` +
            `si imita a una élite, su dúo crítico también funciona.`,
        ],
        defeated: `La Sombra se deshace en un susurro que no pertenece a ninguna criatura. ` +
            `Por un instante, el Silencio retrocede.`,
    },

    bossMechanics: {
        fire: [
            `Ignar te espera junto a su forja. Oirás el golpe de su yunque y el rugido del fuego.`,
            `Cada pocos golpes, Ignar aviva la forja y lanza brasas contra ti. Apágalas con Agua.`,
            `Su debilidad es el Agua. Pero la Ciénaga, Agua y Tierra a la vez, ` +
            `ahoga hasta la forja más ardiente: es su golpe crítico.`,
            `Jamás uses Fuego contra él, ni la Llamarada Ciclónica: Fuego y Viento juntos lo harían más fuerte.`,
        ],
        water: [
            `Las aguas se agitan. El Leviatán Abisal nunca está quieto: antes de atacar, se desplaza.`,
            `Oirás una corriente moverse de un lugar a otro. ` +
            `Apunta siempre a donde termina el movimiento, allí donde suena su canto.`,
            `Su debilidad es la Tierra. Su golpe crítico es el Vendaval de Polvo, ` +
            `Tierra y Viento a la vez, que seca y entierra las corrientes.`,
            `Jamás uses Agua contra él, ni el Vapor Abrasador: Agua y Fuego juntos lo alimentarían.`,
        ],
        wind: [
            `El viento aúlla en la meseta. Zael no ataca de frente: lanza ecos falsos para confundirte.`,
            `Oirás su grito más de una vez. Los ecos falsos suenan lejanos, apagados y con mucha resonancia. ` +
            `El grito real es cercano, seco y fuerte. Apunta siempre al cercano.`,
            `Su debilidad es el Fuego. Su golpe crítico es el Vapor Abrasador, ` +
            `Agua y Fuego a la vez, que vuelve pesado al viento.`,
            `Jamás uses Viento contra él, ni el Vendaval de Polvo: Tierra y Viento juntos le darían más fuerza.`,
        ],
        earth: [
            `El suelo tiembla. Rok, el Titán de la Montaña, es lento pero casi indestructible.`,
            `A veces alza un escudo de piedra. Lo oirás crujir y rechinar. ` +
            `Cuando eso ocurra, no ataques: espera a que pase el golpe y el escudo caiga. ` +
            `Si atacas, tu hechizo rebotará contra ti.`,
            `Su debilidad es el Viento. Su golpe crítico es la Llamarada Ciclónica, ` +
            `Fuego y Viento a la vez, que resquebraja la piedra más antigua.`,
            `Jamás uses Tierra contra él, ni la Ciénaga: Tierra y Agua juntas lo harían más fuerte.`,
        ],
        final: [
            `Una última advertencia antes del fin. El Avatar cambia de elemento constantemente.`,
            `Cada vez que cambie, oirás la firma de su nuevo elemento y una voz te dirá cuál es. ` +
            `Respóndele como a un guardián: con su debilidad, ` +
            `o con el dúo de su debilidad y el elemento neutral para un golpe crítico.`,
            `Cuanto más débil esté, más rápido cambiará, y su voz se irá apagando hasta ser un susurro. ` +
            `Escucha. Solo escucha.`,
        ],
    },

    avatarPhases: {
        2: `¿Lo oyes? Es el sonido de tus fuerzas agotándose. ` +
            `Llamaré a los ecos de los que cayeron para que te hagan compañía.`,
        3: `Silencio... silencio... Ya casi no me oyes, ¿verdad? ` +
            `Así termina todo. En un susurro.`,
    },

    allRoutesDone: [
        `Los cuatro guardianes descansan. Ignar, la Gran Corriente, Zael y Rok han sido liberados.`,
        `Pero el Silencio sigue ahí, en el centro de todo, esperando. ` +
        `En el centro del mapa de rutas se ha abierto un último camino. ` +
        `Elígelo cuando estés listo.`,
    ],

    credits: [
        `Ecos de Aethelgard.`,
        `Gracias por escuchar. Gracias por responder.`,
        `Puedes seguir purificando rutas, desafiar la Arena de los Ecos ` +
        `o enfrentarte de nuevo al Avatar cuando quieras.`,
    ],

    defeatLines: [
        `El Silencio te envuelve... pero los ecos te devuelven al último umbral.`,
        `Caes de rodillas. Un eco lejano pronuncia tu nombre y te levanta.`,
        `Todo se apaga un instante. Respira. Vuelve a escuchar.`,
    ],

    cycle: [
        `El ciclo elemental tiene cuatro voces.`,
        `El Agua apaga el Fuego. El Fuego doma el Viento. El Viento mueve la Tierra. Y la Tierra detiene el Agua.`,
        `Una criatura de Fuego es débil al Agua. Una de Viento, al Fuego. Una de Tierra, al Viento. Y una de Agua, a la Tierra.`,
        `Nunca ataques a una criatura con su propio elemento: la curarías y te devolvería el golpe.`,
        `Las criaturas élite tienen dos elementos y dos debilidades. ` +
        `Si combinas sus dos debilidades en un dúo, el golpe es crítico y les quita dos vidas.`,
        `Los guardianes tienen un solo elemento. Su golpe crítico es el dúo de su debilidad con el elemento neutral, ` +
        `el que ni lo vence ni es vencido por él.`,
    ],
};
