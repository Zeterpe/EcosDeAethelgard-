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
