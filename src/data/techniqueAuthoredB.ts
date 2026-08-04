/**
 * Tecnica escrita a mano — tren inferior y core.
 *
 * Contenido original redactado para esta aplicacion.
 *
 * Todos los ejercicios con carga axial, bisagra de cadera o flexion lumbar
 * incluyen `lumbarAdaptation` con una alternativa concreta y accionable.
 */
import type { ExerciseTechnique } from '@bodyfit/domain/types';

type T = ExerciseTechnique;

export const AUTHORED_LOWER: Record<string, T> = {
  /* ═════════════════════════════════════════════════════════════ PIERNAS ══ */

  sentadilla: {
    authored: true,
    summary:
      'El patron mas completo que existe y el que mas exige a la columna. Cadera y pecho suben al mismo ritmo, siempre.',
    setup: [
      'Ajusta la barra a la altura de la parte alta del pecho en el rack.',
      'Coloca los seguros a la altura del punto mas bajo de tu sentadilla.',
      'Barra sobre el trapecio (posicion alta) o sobre el deltoides posterior (posicion baja).',
    ],
    startPosition: [
      'Saca la barra dando un paso atras, no dos ni tres.',
      'Pies a la anchura de los hombros con las puntas 15–30 grados hacia fuera.',
      'Peso repartido entre el talon y la base del dedo gordo.',
      'Toma aire profundo, presiona el abdomen contra el cinturon imaginario y aprieta gluteos.',
    ],
    execution: [
      'Rompe con cadera y rodillas a la vez: ni sentarse hacia atras ni adelantar solo la rodilla.',
      'Las rodillas viajan en la direccion de las puntas de los pies.',
      'Baja hasta donde puedas mantener la pelvis neutra, idealmente muslo paralelo o algo mas.',
      'Sube empujando el suelo con todo el pie.',
      'Cadera y pecho deben subir al mismo ritmo desde el primer centimetro.',
    ],
    breathing:
      'Aire dentro y abdomen presurizado arriba. Manten la presion durante toda la bajada y la primera mitad de la subida. Expulsa al pasar el punto dificil. Vuelve a tomar aire arriba antes de la siguiente repeticion.',
    rangeOfMotion:
      'Hasta que el pliegue de la cadera baje de la rodilla, siempre que la pelvis no se retroverse. Ese punto lo marca tu movilidad, no el ego.',
    tempo: '3-1-1-0 · 3 s bajando, 1 s abajo sin rebote',
    commonMistakes: [
      'Que la cadera suba antes que el pecho: el ejercicio se convierte en un buenos dias con la barra alta.',
      'Retroversion pelvica en la parte baja, la llamada colita de perro.',
      'Rodillas que colapsan hacia dentro al subir.',
      'Levantar los talones por falta de movilidad de tobillo.',
      'Mirar al techo, lo que hiperextiende el cuello.',
    ],
    warningSigns: [
      'La cadera se dispara hacia arriba antes que los hombros.',
      'La zona lumbar se redondea en la parte baja.',
      'Necesitas rebotar para salir del hoyo.',
      'Notas la espalda baja mas que las piernas al terminar la serie.',
    ],
    safety: [
      'Trabaja SIEMPRE dentro de un rack con los seguros bien puestos. Si fallas, dejas la barra en los seguros.',
      'No uses cinturon para tapar una tecnica que se rompe: usalo para cargas maximas con tecnica ya solida.',
      'Aprende a fallar antes de acercarte al fallo: practica dejar la barra sin peso.',
    ],
    hypertrophy: [
      '6–12 repeticiones con recorrido completo.',
      'La sentadilla frontal o la goblet suelen dar mas cuadriceps con menos carga lumbar.',
    ],
    strength: [
      '3–5 repeticiones al 80–90% con descansos de 3–5 minutos.',
      'La presion abdominal es lo que sostiene la columna. Practicala en cada serie, tambien en las ligeras.',
    ],
    warnings: [
      'CARGA LUMBAR ALTA. Es el ejercicio del catalogo que mas comprime la columna bajo carga.',
      'Si vienes de una molestia lumbar, no vuelvas directo a la barra: pasa antes por goblet y prensa.',
    ],
    contraindications: [
      'Dolor lumbar activo o de rodilla en carga. Consulta con un profesional cualificado antes de volver a cargar este patron.',
    ],
    lumbarAdaptation:
      'Con lumbar sensible, en orden de preferencia: 1) prensa de piernas con la pelvis siempre pegada al respaldo, 2) sentadilla goblet, cuyo contrapeso frontal mantiene el torso vertical, 3) hack squat, que fija la trayectoria. Las tres dan estimulo de cuadriceps sin barra sobre la espalda.',
  },

  prensa: {
    authored: true,
    summary:
      'Cuadriceps con carga alta y columna descargada. La clave es que la pelvis nunca se despegue del respaldo.',
    setup: [
      'Ajusta el respaldo para poder bajar sin que la cadera ruede.',
      'Pies en la plataforma a la anchura de los hombros, a media altura.',
    ],
    startPosition: [
      'Espalda y gluteos completamente pegados al respaldo.',
      'Piernas extendidas sin bloquear las rodillas.',
      'Manos en los agarres laterales, abdomen firme.',
      'Quita los seguros con el peso ya sostenido.',
    ],
    execution: [
      'Baja controlado flexionando rodillas y caderas.',
      'Detente justo antes de que la pelvis empiece a despegarse del respaldo.',
      'Empuja con todo el pie, sobre todo con el talon.',
      'Termina sin bloquear las rodillas de golpe.',
    ],
    breathing:
      'Inspira al bajar y expulsa durante el empuje. Con carga alta y las piernas por encima del corazon, evita apneas largas.',
    rangeOfMotion:
      'Hasta unos 90 grados de rodilla o algo mas, siempre que la pelvis siga apoyada. Ese es el limite real, no la profundidad.',
    tempo: '3-0-1-0',
    commonMistakes: [
      'Bajar tanto que la pelvis se despega y la lumbar se redondea contra el respaldo.',
      'Bloquear las rodillas arriba con carga alta.',
      'Levantar los talones de la plataforma.',
      'Empujar las rodillas con las manos.',
    ],
    warningSigns: [
      'La zona baja de la espalda se separa del respaldo.',
      'Los gluteos ruedan hacia arriba en la parte baja.',
      'Aparece molestia lumbar en un ejercicio que no deberia darla.',
    ],
    safety: [
      'Coloca los seguros antes de empezar y comprueba que los alcanzas.',
      'No pongas las manos en las rodillas: si fallas, no hay salida.',
    ],
    hypertrophy: [
      '10–15 repeticiones con recorrido controlado.',
      'Pies mas altos enfatiza gluteo e isquios; mas bajos, cuadriceps.',
    ],
    strength: [
      'Permite mucha carga, pero transfiere poco a la sentadilla libre. Usala como volumen.',
    ],
    warnings: ['El error de despegar la pelvis es la unica via por la que este ejercicio lesiona.'],
    contraindications: ['Molestia de rodilla que empeora con el rango completo.'],
    lumbarAdaptation:
      'Es una de las mejores opciones con lumbar sensible SIEMPRE que reduzcas el rango antes de que la pelvis se mueva. Marca mentalmente ese punto y no lo pases, aunque puedas.',
  },

  'hack-squat': {
    authored: true,
    summary:
      'Trayectoria fija y espalda apoyada: cuadriceps con carga alta y mucho menos riesgo tecnico que la barra.',
    setup: [
      'Ajusta las hombreras a tu altura.',
      'Pies a la anchura de los hombros, a media plataforma.',
    ],
    startPosition: [
      'Espalda completa apoyada en el respaldo, incluida la zona lumbar.',
      'Hombros bajo las almohadillas, abdomen firme.',
      'Piernas extendidas sin bloquear, seguros liberados.',
    ],
    execution: [
      'Baja controlado hasta que el muslo pase el paralelo, si la cadera lo permite.',
      'Manten toda la espalda pegada al respaldo.',
      'Empuja con el pie completo hasta casi extender.',
    ],
    breathing:
      'Inspira arriba, manten el torso firme al bajar y expulsa pasado el punto mas dificil de la subida.',
    rangeOfMotion:
      'Hasta el paralelo o algo mas, mientras la pelvis siga apoyada.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Despegar la cadera del respaldo en la parte baja.',
      'Levantar los talones.',
      'Bloquear las rodillas arriba.',
    ],
    warningSigns: ['La lumbar se separa del respaldo.', 'Las rodillas colapsan hacia dentro.'],
    safety: ['Comprueba los seguros antes de cada serie pesada.'],
    hypertrophy: [
      '8–15 repeticiones. Excelente para llevar el cuadriceps cerca del fallo con seguridad.',
    ],
    strength: ['Buena para acumular carga sin el coste tecnico de la sentadilla libre.'],
    warnings: ['Sin riesgos destacables mientras mantengas toda la espalda apoyada en el respaldo.'],
    contraindications: ['Molestia de rodilla en flexion profunda.'],
    lumbarAdaptation:
      'Con la espalda apoyada la carga lumbar baja mucho respecto a la sentadilla. Limita el rango al punto donde la pelvis empiece a rodar.',
  },

  'extension-cuadriceps': {
    authored: true,
    summary:
      'Aislamiento puro de cuadriceps sin ninguna carga sobre la columna. Ideal cuando la espalda pide tregua.',
    setup: [
      'Ajusta el respaldo para que la rodilla coincida con el eje de giro de la maquina.',
      'Coloca el rodillo justo por encima del tobillo.',
    ],
    startPosition: [
      'Sentado con la espalda apoyada y los gluteos al fondo.',
      'Manos en los agarres laterales.',
      'Rodillas alineadas con el eje de la maquina.',
    ],
    execution: [
      'Extiende las rodillas hasta casi bloquear.',
      'Aprieta el cuadriceps un segundo arriba.',
      'Baja en 3 segundos resistiendo, sin dejar que las placas choquen.',
    ],
    breathing: 'Expulsa el aire al extender, inspira al bajar.',
    rangeOfMotion: 'Desde 90 grados hasta casi extension completa.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Impulsar con el torso hacia atras.',
      'Dejar caer el peso en la bajada.',
      'Eje de la maquina desalineado con la rodilla.',
    ],
    warningSigns: [
      'Los gluteos se despegan del asiento.',
      'Aparece dolor puntual bajo la rotula.',
    ],
    safety: [
      'Si notas la rotula, reduce el rango final o baja la carga.',
      'La alineacion del eje es lo que decide si la rodilla trabaja comoda.',
    ],
    hypertrophy: [
      '12–20 repeticiones con pausa arriba.',
      'Muy util como preactivacion antes de sentadilla o prensa.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos destacables con carga moderada y el eje de la maquina alineado con la rodilla.'],
    contraindications: ['Dolor femoropatelar que empeora con el ejercicio.'],
    lumbarAdaptation:
      'Carga lumbar nula con la espalda apoyada. Es de los pocos ejercicios de pierna que puedes hacer con la espalda muy sensible.',
  },

  'peso-muerto-rumano': {
    authored: true,
    summary:
      'El rango lo marca el isquiotibial, nunca la columna. En cuanto la espalda se mueve, la serie ha terminado.',
    setup: [
      'Barra desde el rack a la altura de la cadera, o desde el suelo con carga ligera.',
      'Agarre pronado a la anchura de los hombros.',
    ],
    startPosition: [
      'De pie, barra pegada a los muslos.',
      'Rodillas con una flexion minima que no cambiara durante el ejercicio.',
      'Espalda neutra de la cabeza a la pelvis, dorsal activo apretando la barra contra el cuerpo.',
      'Aire dentro y abdomen presurizado.',
    ],
    execution: [
      'Lleva la cadera hacia atras, como si cerrases una puerta con los gluteos.',
      'La barra baja rozando los muslos y las espinillas.',
      'Baja hasta notar estiramiento claro en los isquiotibiales, normalmente entre la rodilla y media espinilla.',
      'Vuelve empujando la cadera hacia delante y apretando gluteos arriba.',
    ],
    breathing:
      'Aire dentro arriba, mantenlo durante todo el recorrido y expulsa al terminar cada repeticion.',
    rangeOfMotion:
      'El limite es el estiramiento del isquiotibial. Si para bajar mas tienes que redondear la espalda, ya te has pasado.',
    tempo: '4-1-1-0 · excentrica lenta',
    commonMistakes: [
      'Redondear la zona lumbar buscando mas rango.',
      'Convertirlo en una sentadilla doblando cada vez mas la rodilla.',
      'Separar la barra del cuerpo.',
      'Hiperextender la espalda al llegar arriba.',
    ],
    warningSigns: [
      'La barra se aleja de las piernas.',
      'La espalda cambia de forma durante la bajada.',
      'Notas la zona lumbar antes que los isquiotibiales.',
    ],
    safety: [
      'La barra pegada al cuerpo no es estetica: es lo que mantiene el brazo de palanca corto sobre la columna.',
      'No lo lleves al fallo. Con este patron, la ultima repeticion mal hecha cuesta cara.',
    ],
    hypertrophy: [
      '8–12 repeticiones con excentrica de 4 segundos.',
      'El estimulo esta en el estiramiento, no en el peso.',
    ],
    strength: ['5–8 repeticiones con espalda impecable.'],
    warnings: [
      'CARGA LUMBAR ALTA. Es una bisagra de cadera cargada: exige mucho a los erectores.',
    ],
    contraindications: [
      'Dolor lumbar activo, hernia sintomatica o cualquier molestia que aparezca al inclinarse. Consulta con un profesional sanitario antes de retomar este patron.',
    ],
    lumbarAdaptation:
      'Con lumbar sensible, sustituye por curl femoral sentado o tumbado: trabajan el isquiotibial sin ninguna carga sobre la columna. Si quieres mantener el patron de cadera, el hip thrust da trabajo de gluteo con la espalda apoyada.',
  },

  'curl-femoral-sentado': {
    authored: true,
    summary:
      'La cadera flexionada estira mas el isquiotibial: da mas estimulo que la version tumbada, sin tocar la columna.',
    setup: [
      'Ajusta el respaldo y el rodillo superior para que sujeten sin hacer dano.',
      'El rodillo inferior debe quedar justo por encima del talon.',
    ],
    startPosition: [
      'Sentado con la espalda apoyada y las caderas fijas por el rodillo.',
      'Piernas extendidas con los isquiotibiales ya en tension.',
      'Manos en los agarres.',
    ],
    execution: [
      'Flexiona las rodillas llevando los talones hacia los gluteos.',
      'Manten un instante en la contraccion maxima.',
      'Vuelve en 3 segundos resistiendo hasta la extension completa.',
    ],
    breathing:
      'Expulsa al llevar el talon bajo el asiento, inspira mientras la pierna se extiende.',
    rangeOfMotion:
      'Desde extension completa hasta la maxima flexion de rodilla que permita la maquina.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Levantar la cadera del asiento para ayudar.',
      'Dejar caer el peso en la vuelta.',
      'Rodillo mal colocado, sobre el gemelo en vez de sobre el talon.',
    ],
    warningSigns: [
      'Los gluteos se despegan del asiento.',
      'Aparecen calambres en el isquiotibial: suele indicar carga excesiva o poca preparacion.',
    ],
    safety: ['Ajusta bien el rodillo superior: si no sujeta, la cadera se levantara.'],
    hypertrophy: [
      '10–15 repeticiones con excentrica controlada.',
      'La version sentada da mas estiramiento que la tumbada: si eliges una sola, elige esta.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos destacables: la maquina fija la cadera y la espalda queda apoyada.'],
    contraindications: ['Molestia en la parte posterior de la rodilla.'],
    lumbarAdaptation:
      'Carga lumbar nula. Es la mejor alternativa al peso muerto rumano cuando la espalda esta sensible.',
  },

  'curl-femoral': {
    authored: true,
    summary:
      'Aislamiento de isquiotibiales tumbado. Vigila que la cadera no se despegue del banco.',
    setup: [
      'Coloca el rodillo justo por encima del talon.',
      'Alinea la rodilla con el eje de giro de la maquina.',
    ],
    startPosition: [
      'Tumbado boca abajo con las caderas pegadas al banco.',
      'Piernas extendidas, manos en los agarres.',
      'Abdomen firme para evitar que la pelvis bascule.',
    ],
    execution: [
      'Flexiona las rodillas llevando los talones hacia los gluteos.',
      'Manten las caderas pegadas al banco durante todo el recorrido.',
      'Aprieta arriba y vuelve controlado hasta la extension completa.',
    ],
    breathing:
      'Expulsa al acercar el talon al gluteo, inspira mientras la pierna vuelve a extenderse.',
    rangeOfMotion: 'Extension completa abajo, maxima flexion arriba sin levantar la cadera.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Levantar la cadera del banco, que arquea la lumbar.',
      'Dejar caer el peso.',
      'Rodillo mal colocado.',
    ],
    warningSigns: [
      'La cadera se despega y la lumbar se arquea.',
      'Notas la espalda baja en un ejercicio de isquiotibiales.',
    ],
    safety: [
      'El despegue de cadera es exactamente lo que convierte este ejercicio en molesto para la lumbar. Vigilalo.',
    ],
    hypertrophy: ['10–15 repeticiones con pausa en contraccion.'],
    strength: ['No aplica.'],
    warnings: ['Con carga excesiva la cadera se levanta sola: baja el peso.'],
    contraindications: ['Molestia en la parte posterior de la rodilla.'],
    lumbarAdaptation:
      'Manten la pelvis pegada al banco apretando el abdomen y los gluteos. Si aun asi se levanta, cambia a la version sentada, que fija la cadera por diseno.',
  },

  'hip-thrust': {
    authored: true,
    summary:
      'El mejor ejercicio de gluteo con la espalda apoyada. La clave es la retroversion pelvica: sin ella, trabaja la lumbar.',
    setup: [
      'Banco estable a la altura de la parte baja de las escapulas.',
      'Almohadilla gruesa sobre la cadera.',
      'Pies a la anchura de la cadera, colocados de modo que arriba la tibia quede vertical.',
    ],
    startPosition: [
      'Escapulas apoyadas en el borde del banco, no el cuello ni la espalda entera.',
      'Barra sobre el pliegue de la cadera.',
      'Barbilla ligeramente metida, mirada hacia delante y abajo.',
      'Mete la pelvis en retroversion antes de empezar: es el gesto que protege la lumbar.',
    ],
    execution: [
      'Empuja con los talones subiendo la cadera hasta que el torso quede paralelo al suelo.',
      'Aprieta los gluteos con fuerza un segundo arriba.',
      'Manten la pelvis en retroversion: no busques altura arqueando la espalda.',
      'Baja controlado sin llegar a apoyar del todo entre repeticiones.',
    ],
    breathing:
      'Expulsa al empujar la cadera arriba, inspira mientras desciende. Manten el abdomen firme sin bloquear el aire.',
    rangeOfMotion:
      'Hasta que el torso quede paralelo al suelo. Ni un grado mas: la altura extra sale de la lumbar, no del gluteo.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Hiperextender la lumbar arriba en vez de apretar el gluteo.',
      'Levantar la barbilla, lo que arrastra a la espalda a extenderse.',
      'Pies demasiado adelantados o atrasados.',
      'Apoyar la espalda entera en el banco en vez de solo las escapulas.',
    ],
    warningSigns: [
      'Notas la zona lumbar al terminar la serie en vez del gluteo.',
      'La barbilla sube y la mirada va al techo.',
      'Las costillas se abren arriba.',
    ],
    safety: [
      'Usa siempre almohadilla: la barra sobre la cadera sin proteccion duele y limita la carga.',
      'Comprueba que el banco no se desplace hacia atras.',
    ],
    hypertrophy: [
      '8–15 repeticiones con pausa de un segundo arriba.',
      'La pausa en contraccion vale mas que anadir peso.',
    ],
    strength: ['5–8 repeticiones. Permite cargas altas con muy poca exigencia de columna.'],
    warnings: ['La hiperextension lumbar arriba es el unico error que puede hacer dano aqui.'],
    contraindications: ['Molestia lumbar que persiste incluso con la pelvis en retroversion.'],
    lumbarAdaptation:
      'Es una de las mejores opciones de cadena posterior con lumbar sensible, porque el torso esta apoyado. La regla es simple: sube solo hasta el paralelo y manten la pelvis metida. Si dudas, hazlo primero sin peso.',
  },

  bulgara: {
    authored: true,
    summary:
      'Unilateral y muy exigente. Da mucho estimulo de cuadriceps y gluteo con una fraccion de la carga espinal.',
    setup: [
      'Banco a la altura de la rodilla, o algo mas bajo.',
      'Mancuernas a los lados, o sin peso hasta dominar el equilibrio.',
    ],
    startPosition: [
      'Pie trasero apoyado sobre el banco, empeine o punta segun te resulte comodo.',
      'Pie delantero lo bastante adelantado para que la rodilla no pase mucho la punta.',
      'Torso erguido con una inclinacion minima hacia delante.',
    ],
    execution: [
      'Baja vertical flexionando la rodilla delantera.',
      'Desciende hasta que el muslo delantero quede paralelo al suelo.',
      'Empuja con el talon delantero para volver.',
      'Manten la cadera cuadrada durante todo el recorrido.',
    ],
    breathing:
      'Inspira antes de bajar sobre la pierna de apoyo, expulsa al subir desde el punto mas bajo.',
    rangeOfMotion: 'Hasta el paralelo del muslo delantero, o hasta donde controles el equilibrio.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Pie delantero demasiado cerca del banco.',
      'Inclinar el torso en exceso.',
      'Empujar con la pierna trasera.',
      'Perder la alineacion de la rodilla delantera.',
    ],
    warningSigns: [
      'La cadera rota hacia un lado.',
      'La rodilla delantera se desplaza hacia dentro.',
      'Necesitas apoyar la mano para no caerte.',
    ],
    safety: [
      'Empieza sin peso hasta dominar el equilibrio.',
      'Con mancuernas a los lados, si pierdes el equilibrio las sueltas y ya esta: es de los ejercicios unilaterales mas seguros.',
    ],
    hypertrophy: [
      '8–12 repeticiones por pierna.',
      'Con inclinacion del torso trabaja mas gluteo; erguido, mas cuadriceps.',
    ],
    strength: ['6–8 repeticiones por pierna con mancuernas pesadas.'],
    warnings: ['La primera vez deja agujetas notables: empieza con volumen bajo.'],
    contraindications: ['Inestabilidad de rodilla sin valoracion previa.'],
    lumbarAdaptation:
      'Con mancuernas a los lados en vez de barra en la espalda, la carga axial es minima. Es de las mejores formas de entrenar pierna pesado con lumbar sensible.',
  },

  zancadas: {
    authored: true,
    summary:
      'Patron unilateral con carga axial baja. Baja vertical y empuja con el talon de la pierna delantera.',
    setup: [
      'Espacio libre para caminar, o sitio fijo si las haces estaticas.',
      'Mancuernas a los lados.',
    ],
    startPosition: [
      'De pie, torso erguido, mirada al frente.',
      'Abdomen firme y hombros abajo.',
    ],
    execution: [
      'Da un paso adelante lo bastante largo para que la rodilla trasera baje comoda.',
      'Baja vertical hasta que la rodilla trasera casi toque el suelo.',
      'Empuja con el talon delantero para volver o para dar el siguiente paso.',
      'Manten la cadera cuadrada en todo momento.',
    ],
    breathing:
      'Inspira al dar el paso y bajar, expulsa al empujar con la pierna de delante para volver.',
    rangeOfMotion: 'Hasta que la rodilla trasera quede a un par de centimetros del suelo.',
    tempo: '2-1-1-0',
    commonMistakes: [
      'Paso demasiado corto, que lleva la rodilla delantera muy por delante del pie.',
      'Inclinar el torso hacia delante.',
      'Dar el paso en linea recta y perder el equilibrio lateral.',
    ],
    warningSigns: [
      'El torso se inclina en cada repeticion.',
      'La rodilla delantera colapsa hacia dentro.',
    ],
    safety: ['Empieza con peso corporal. El equilibrio es la limitacion real al principio.'],
    hypertrophy: ['10–12 repeticiones por pierna.'],
    strength: ['8–10 repeticiones por pierna con carga moderada.'],
    warnings: ['Con molestias de rodilla, acorta el rango antes que reducir el peso.'],
    contraindications: ['Dolor de rodilla en flexion cargada.'],
    lumbarAdaptation:
      'Con mancuernas a los lados la columna apenas se carga. La version estatica, sin desplazamiento, reduce ademas la demanda de estabilizacion.',
  },

  'gemelo-de-pie': {
    authored: true,
    summary:
      'Recorrido completo y pausas largas. El gemelo responde al rango y al tiempo bajo tension, no a rebotar peso.',
    setup: [
      'Maquina de gemelo de pie, o un escalon con mancuerna.',
      'Antepie sobre el borde de la plataforma, talones al aire.',
    ],
    startPosition: [
      'De pie con las rodillas casi extendidas, sin bloquear.',
      'Talones por debajo del nivel del antepie, en estiramiento.',
      'Torso erguido, abdomen firme.',
    ],
    execution: [
      'Sube todo lo que puedas hasta quedar sobre la punta del pie.',
      'Manten un segundo completo en la contraccion.',
      'Baja despacio hasta el estiramiento maximo.',
      'Manten 2 segundos abajo antes de la siguiente repeticion.',
    ],
    breathing:
      'Expulsa al elevarte sobre las puntas, inspira mientras los talones descienden.',
    rangeOfMotion:
      'Estiramiento maximo abajo y elevacion completa arriba. El recorrido parcial es la razon principal por la que los gemelos no crecen.',
    tempo: '3-2-1-1 · 2 s de estiramiento abajo',
    commonMistakes: [
      'Rebotar en la parte baja usando el reflejo del tendon.',
      'Recorrido corto sin llegar al estiramiento ni a la contraccion.',
      'Flexionar las rodillas durante el movimiento.',
    ],
    warningSigns: [
      'El movimiento se convierte en un rebote ritmico.',
      'Las rodillas se doblan para ayudar.',
    ],
    safety: ['Sujetate para mantener el equilibrio y concentrarte en el recorrido.'],
    hypertrophy: [
      '12–20 repeticiones con pausas en ambos extremos.',
      'Tolera bien frecuencia alta: 3 sesiones semanales no son excesivas.',
    ],
    strength: ['No aplica.'],
    warnings: ['El rebote es la causa numero uno de que este ejercicio no funcione.'],
    contraindications: ['Molestia en el tendon de Aquiles.'],
    lumbarAdaptation:
      'La version de pie con carga sobre los hombros comprime la columna. Con lumbar sensible usa la maquina sentado o sujeta una mancuerna con una mano.',
  },

  /* ═══════════════════════════════════════════════ CORE Y ZONA LUMBAR ══ */

  'dead-bug': {
    authored: true,
    summary:
      'Ensena al core a sostener la pelvis mientras las extremidades se mueven. De los ejercicios mas seguros que existen para una espalda sensible.',
    setup: ['Una colchoneta y espacio para estirar brazos y piernas.'],
    startPosition: [
      'Tumbado boca arriba.',
      'Brazos extendidos hacia el techo, perpendiculares al suelo.',
      'Caderas y rodillas a 90 grados, espinillas paralelas al suelo.',
      'Zona lumbar en contacto con el suelo, sin hueco.',
    ],
    execution: [
      'Baja despacio el brazo derecho por encima de la cabeza y la pierna izquierda hacia el suelo.',
      'Detente justo antes de que la lumbar se despegue del suelo.',
      'Vuelve a la posicion inicial con el mismo control.',
      'Alterna con el brazo izquierdo y la pierna derecha.',
    ],
    breathing:
      'Expulsa el aire lentamente mientras extiendes las extremidades. Es la exhalacion la que mantiene las costillas abajo.',
    rangeOfMotion:
      'El limite exacto es el punto donde la lumbar empieza a despegarse. No es negociable y es distinto para cada persona.',
    tempo: '3-1-3-1 · lento en ambas direcciones',
    commonMistakes: [
      'Bajar tanto que la lumbar se arquea.',
      'Aguantar la respiracion durante todo el movimiento.',
      'Ir demasiado rapido y perder el control de la pelvis.',
    ],
    warningSigns: [
      'Aparece un hueco entre la lumbar y el suelo.',
      'Notas la espalda baja en vez del abdomen.',
      'Las costillas se abren hacia arriba.',
    ],
    safety: [
      'Si no puedes mantener la lumbar pegada, acorta el recorrido. La calidad importa mas que el rango.',
      'Puedes empezar moviendo solo los brazos, luego solo las piernas y por ultimo combinando.',
    ],
    hypertrophy: ['3–4 series de 8–12 repeticiones por lado, lentas.'],
    strength: [
      'Progresa alargando la palanca o el tiempo bajo control, nunca anadiendo velocidad.',
    ],
    warnings: ['Sin riesgos destacables: es un ejercicio de control motor, no de carga.'],
    contraindications: [
      'En su version basica no hay contraindicaciones destacables. Si notas la zona lumbar, acorta el recorrido.',
    ],
    lumbarAdaptation:
      'Este ejercicio ES la adaptacion lumbar. Ensena justo el control que falta cuando la espalda baja se sobrecarga en sentadillas y peso muerto. Si tienes molestias recurrentes, incluyelo dos o tres veces por semana.',
  },

  'bird-dog': {
    authored: true,
    summary:
      'Estabilidad de tronco con la columna en posicion neutra. Poco espectacular, muy eficaz.',
    setup: ['Colchoneta. Nada mas.'],
    startPosition: [
      'A cuatro apoyos, manos bajo los hombros y rodillas bajo las caderas.',
      'Columna neutra: ni arqueada ni redondeada.',
      'Mirada al suelo para mantener el cuello alineado.',
    ],
    execution: [
      'Extiende a la vez el brazo derecho y la pierna izquierda.',
      'Llega hasta que ambos queden paralelos al suelo, ni mas alto.',
      'Manten la pelvis completamente quieta: no debe rotar ni bascular.',
      'Aguanta 2–3 segundos y vuelve despacio.',
      'Alterna con el lado contrario.',
    ],
    breathing: 'Respiracion continua y tranquila. No aguantes el aire.',
    rangeOfMotion:
      'Brazo y pierna hasta la horizontal. Subir mas la pierna solo arquea la lumbar.',
    tempo: 'Mantenimiento de 2–3 segundos por repeticion',
    commonMistakes: [
      'Subir la pierna por encima de la horizontal.',
      'Rotar la cadera hacia un lado.',
      'Levantar la cabeza y extender el cuello.',
      'Ir demasiado rapido.',
    ],
    warningSigns: [
      'La pelvis bascula al extender.',
      'La lumbar se arquea visiblemente.',
      'Pierdes el equilibrio en cada repeticion.',
    ],
    safety: [
      'Un truco util: coloca un objeto ligero en la zona lumbar. Si se cae, la pelvis se ha movido.',
    ],
    hypertrophy: ['3 series de 8–10 repeticiones por lado con mantenimiento.'],
    strength: ['Progresa alargando el mantenimiento, no anadiendo velocidad.'],
    warnings: ['Sin riesgos especificos mas alla de respetar la tecnica descrita.'],
    contraindications: ['Molestia de muneca: usa punos cerrados o paralelas.'],
    lumbarAdaptation:
      'Es uno de los ejercicios de referencia para reeducar el control lumbopelvico. Seguro incluso en fases muy sensibles, siempre que la pelvis no se mueva.',
  },

  'pallof-press': {
    authored: true,
    summary:
      'Antirotacion: el core trabaja impidiendo que el torso gire. Carga ligera, control alto.',
    setup: [
      'Polea a la altura del pecho con agarre sencillo.',
      'Carga ligera: debes poder mantener la posicion sin temblar.',
    ],
    startPosition: [
      'De pie perpendicular a la polea, a un paso de distancia.',
      'Pies a la anchura de los hombros, rodillas ligeramente flexionadas.',
      'Manos juntas sobre el esternon, codos pegados.',
    ],
    execution: [
      'Extiende los brazos al frente resistiendo la traccion lateral del cable.',
      'Manten caderas y hombros mirando al frente: nada debe rotar.',
      'Aguanta 2–3 segundos con los brazos extendidos.',
      'Vuelve al pecho con el mismo control.',
    ],
    breathing: 'Expulsa el aire lentamente mientras extiendes los brazos.',
    rangeOfMotion: 'Del pecho a la extension completa de brazos, sin rotacion del torso.',
    tempo: '2-3-2-0 · 3 s de mantenimiento en extension',
    commonMistakes: [
      'Dejar que la cadera rote hacia la polea.',
      'Cargar demasiado y compensar inclinando el torso.',
      'Abrir las costillas al extender.',
    ],
    warningSigns: [
      'Los pies o las caderas giran.',
      'El torso se inclina hacia el lado contrario a la polea.',
    ],
    safety: ['Carga ligera siempre. Aqui el peso alto elimina el objetivo del ejercicio.'],
    hypertrophy: ['3 series de 8–12 repeticiones por lado con mantenimiento.'],
    strength: ['Progresa alejandote de la polea antes que anadiendo peso.'],
    warnings: ['Sin riesgos especificos mas alla de respetar la tecnica descrita.'],
    contraindications: ['Dolor al resistir la rotacion del tronco.'],
    lumbarAdaptation:
      'Excelente con lumbar sensible: entrena la estabilidad del tronco sin flexion, extension ni carga axial. Es el complemento natural del dead bug y el bird dog.',
  },

  plancha: {
    authored: true,
    summary:
      'No es aguantar tiempo: es mantener la pelvis neutra generando tension. Treinta segundos buenos valen mas que dos minutos malos.',
    setup: ['Colchoneta y espacio para tumbarse boca abajo.'],
    startPosition: [
      'Antebrazos en el suelo, codos justo bajo los hombros.',
      'Cuerpo en linea recta de la cabeza a los talones.',
      'Pelvis en posicion neutra, ligeramente metida.',
      'Gluteos y cuadriceps apretados.',
    ],
    execution: [
      'Manten la posicion generando tension activa, no simplemente aguantando.',
      'Aprieta los antebrazos contra el suelo como si quisieras juntarlos.',
      'Respira de forma superficial y constante.',
      'Sal de la posicion antes de que la cadera empiece a caer.',
    ],
    breathing: 'Respiracion continua y superficial. Aguantar el aire no es opcion.',
    rangeOfMotion: 'Isometrico. No hay recorrido, hay posicion.',
    tempo: 'Mantenimientos de 20–45 segundos de calidad',
    commonMistakes: [
      'Dejar caer la cadera y arquear la lumbar.',
      'Subir demasiado los gluteos, lo que quita toda la tension.',
      'Aguantar la respiracion.',
      'Perseguir tiempos largos con la posicion ya rota.',
    ],
    warningSigns: [
      'La cadera empieza a descender.',
      'Notas la zona lumbar en vez del abdomen.',
      'Empiezas a temblar y pierdes la linea.',
    ],
    safety: [
      'Si notas la lumbar, apoya las rodillas o eleva los antebrazos sobre un banco.',
      'Termina la serie cuando la posicion se rompa, no cuando suene el cronometro.',
    ],
    hypertrophy: ['3–4 series de 30–45 segundos con tension maxima.'],
    strength: [
      'Progresa anadiendo peso en la espalda alta o alargando la palanca, no sumando minutos.',
    ],
    warnings: ['Los tiempos largos con la cadera caida cargan la lumbar en vez del abdomen.'],
    contraindications: ['Dolor lumbar durante el ejercicio.'],
    lumbarAdaptation:
      'Si la lumbar molesta, apoya los antebrazos en un banco: la inclinacion reduce la exigencia y permite mantener la pelvis neutra. A medida que mejore, baja la altura.',
  },

  'plancha-lateral': {
    authored: true,
    summary:
      'Trabaja el lateral del tronco, el glúteo medio y la estabilidad de cadera sin cargar la columna.',
    setup: ['Colchoneta. Toalla bajo el codo si molesta.'],
    startPosition: [
      'Tumbado de lado con el codo bajo el hombro.',
      'Piernas extendidas, un pie delante del otro o apilados.',
      'Cuerpo en linea recta de la cabeza a los pies.',
    ],
    execution: [
      'Sube la cadera hasta alinear el cuerpo.',
      'Aprieta el gluteo del lado de abajo.',
      'Manten la posicion sin dejar que la cadera caiga ni rote.',
      'Baja controlado y cambia de lado.',
    ],
    breathing:
      'Respiracion continua por la nariz. Si tienes que retener el aire, la serie ya es demasiado larga.',
    rangeOfMotion: 'Isometrico en alineacion completa.',
    tempo: 'Mantenimientos de 20–40 segundos por lado',
    commonMistakes: [
      'Dejar caer la cadera.',
      'Rotar el torso hacia el suelo.',
      'Apoyar el codo por delante o por detras del hombro.',
    ],
    warningSigns: [
      'La cadera desciende progresivamente.',
      'El torso rota buscando apoyo.',
      'Molestia en el hombro de apoyo.',
    ],
    safety: ['Con las rodillas apoyadas la version es mucho mas accesible y sigue siendo util.'],
    hypertrophy: ['3 series de 20–40 segundos por lado.'],
    strength: ['Progresa levantando la pierna superior o anadiendo peso en la cadera.'],
    warnings: ['Sin riesgos especificos mas alla de respetar la tecnica descrita.'],
    contraindications: ['Dolor de hombro en apoyo lateral.'],
    lumbarAdaptation:
      'Muy recomendable con lumbar sensible: fortalece el lateral del tronco sin flexionar ni comprimir la columna. Empieza con las rodillas apoyadas.',
  },

  'mcgill-curl-up': {
    authored: true,
    summary:
      'Trabaja el recto abdominal manteniendo la curva lumbar natural. Pensado para espaldas que no toleran el crunch clasico.',
    setup: ['Colchoneta. Las manos van bajo la zona lumbar.'],
    startPosition: [
      'Tumbado boca arriba con una pierna flexionada y el pie apoyado.',
      'La otra pierna extendida en el suelo.',
      'Manos bajo la zona lumbar, palmas hacia abajo, para conservar la curva natural.',
      'Codos ligeramente apoyados en el suelo.',
    ],
    execution: [
      'Levanta la cabeza y los hombros solo unos centimetros del suelo.',
      'La zona lumbar NO se aplana: por eso estan las manos debajo.',
      'Manten 8–10 segundos con tension.',
      'Baja despacio y descansa unos segundos antes de la siguiente repeticion.',
      'Cambia la pierna flexionada a mitad de las series.',
    ],
    breathing: 'Respiracion continua durante el mantenimiento. Nunca aguantes el aire.',
    rangeOfMotion:
      'Recorrido deliberadamente muy corto: unos centimetros. La columna no se flexiona.',
    tempo: 'Mantenimientos de 8–10 segundos',
    commonMistakes: [
      'Subir demasiado y convertirlo en un abdominal clasico.',
      'Aplanar la lumbar contra el suelo.',
      'Tirar del cuello con las manos.',
      'Aguantar la respiracion.',
    ],
    warningSigns: [
      'Notas presion en la zona lumbar.',
      'El cuello se tensa mas que el abdomen.',
      'La lumbar aplasta las manos contra el suelo.',
    ],
    safety: [
      'El recorrido corto no es una limitacion: es el objetivo. Este ejercicio busca resistencia, no rango.',
    ],
    hypertrophy: ['Series descendentes: 6, luego 4, luego 2 mantenimientos, con descanso entre ellas.'],
    strength: ['Progresa aumentando el tiempo de mantenimiento, nunca el rango.'],
    warnings: ['No lo conviertas en un crunch. Si subes mas, pierdes todo el sentido.'],
    contraindications: ['Molestia cervical: apoya la cabeza y trabaja solo la tension abdominal.'],
    lumbarAdaptation:
      'Este ejercicio existe precisamente como alternativa al abdominal clasico para espaldas sensibles. Mantener las manos bajo la lumbar conserva la curva natural y evita la flexion repetida de la columna.',
  },

  'hip-hinge-drill': {
    authored: true,
    summary:
      'Aprende el patron de bisagra sin carga, con una guia fisica que te avisa si la espalda se mueve.',
    setup: [
      'Una barra, un paloescoba o cualquier baston recto.',
      'Espacio para inclinarte sin obstaculos.',
    ],
    startPosition: [
      'De pie con los pies a la anchura de las caderas.',
      'Coloca el baston vertical sobre la espalda, tocando en tres puntos: cabeza, zona dorsal y sacro.',
      'Sujetalo con una mano por arriba y otra por abajo.',
      'Rodillas con una flexion minima.',
    ],
    execution: [
      'Lleva la cadera hacia atras manteniendo los tres puntos de contacto.',
      'Baja el torso hasta notar estiramiento en los isquiotibiales.',
      'Si pierdes cualquiera de los tres contactos, has movido la columna: vuelve y repite con menos rango.',
      'Regresa empujando la cadera hacia delante y apretando gluteos.',
    ],
    breathing: 'Aire dentro antes de bajar, expulsa al volver arriba.',
    rangeOfMotion:
      'Hasta donde mantengas los tres puntos de contacto. Ese es exactamente tu rango seguro de bisagra hoy.',
    tempo: '3-1-2-0 · lento y consciente',
    commonMistakes: [
      'Doblar las rodillas y convertirlo en una sentadilla.',
      'Perder el contacto lumbar sin darse cuenta.',
      'Mirar al frente, lo que extiende el cuello y rompe el contacto de la cabeza.',
    ],
    warningSigns: [
      'El baston se separa del sacro: la pelvis ha rotado.',
      'El baston se separa de la zona dorsal: la espalda se ha redondeado.',
    ],
    safety: [
      'Sin carga. Es un ejercicio de aprendizaje, no de entrenamiento.',
      'Hazlo como calentamiento antes de cualquier sesion con peso muerto o remo con barra.',
    ],
    hypertrophy: ['No aplica: el objetivo es el patron, no el musculo.'],
    strength: [
      'Es el paso previo a cargar cualquier bisagra. Dominarlo mejora directamente el peso muerto rumano.',
    ],
    warnings: ['Sin riesgos destacables: se practica sin carga y con recorrido guiado por el baston.'],
    contraindications: [
      'Sin contraindicaciones destacables al hacerlo sin carga y dentro de un rango comodo.',
    ],
    lumbarAdaptation:
      'Es la herramienta principal para reaprender la bisagra despues de una molestia lumbar. Practicalo a diario unos minutos: te ensena donde esta tu limite real antes de que la carga te lo recuerde.',
  },

  'puente-gluteo': {
    authored: true,
    summary:
      'Activacion de gluteo sin carga ni exigencia de columna. Basico como calentamiento y util como ejercicio en si.',
    setup: ['Colchoneta. Opcionalmente una banda por encima de las rodillas.'],
    startPosition: [
      'Tumbado boca arriba con las rodillas flexionadas.',
      'Pies planos a la anchura de la cadera, cerca de los gluteos.',
      'Brazos a los lados, palmas hacia abajo.',
      'Pelvis ligeramente en retroversion.',
    ],
    execution: [
      'Empuja con los talones subiendo la cadera hasta alinear rodillas, cadera y hombros.',
      'Aprieta los gluteos con fuerza 2 segundos arriba.',
      'Manten la pelvis metida: no busques altura arqueando la lumbar.',
      'Baja controlado sin apoyar del todo entre repeticiones.',
    ],
    breathing:
      'Expulsa al elevar la cadera, inspira al apoyarla de nuevo. Respiracion tranquila de principio a fin.',
    rangeOfMotion:
      'Hasta la alineacion rodilla-cadera-hombro. Ni un centimetro mas: la altura extra sale de la lumbar.',
    tempo: '2-2-1-0 · 2 s de contraccion arriba',
    commonMistakes: [
      'Hiperextender la lumbar buscando altura.',
      'Empujar con las puntas de los pies en vez de con los talones.',
      'Pies demasiado alejados, lo que pasa el trabajo a los isquiotibiales.',
    ],
    warningSigns: [
      'Notas la zona lumbar en lugar del gluteo.',
      'Aparecen calambres en los isquiotibiales: los pies estan demasiado lejos.',
    ],
    safety: ['Sin carga y con la espalda apoyada, es de los ejercicios mas seguros del catalogo.'],
    hypertrophy: ['3 series de 12–20 repeticiones con pausa arriba.'],
    strength: ['Progresa hacia el hip thrust con barra cuando controles bien la retroversion.'],
    warnings: ['Sin riesgos especificos mas alla de respetar la tecnica descrita.'],
    contraindications: [
      'Sin contraindicaciones destacables al hacerlo sin carga y dentro de un rango comodo.',
    ],
    lumbarAdaptation:
      'Perfecto con lumbar sensible: activa el gluteo, que suele estar poco implicado en quienes sobrecargan la espalda baja. Usalo como calentamiento antes de cualquier sesion de pierna.',
  },
};
