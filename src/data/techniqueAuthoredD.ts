/**
 * Tecnica escrita a mano — piernas, core, movilidad y cardio.
 *
 * Contenido original redactado para esta aplicacion. Sin afirmaciones medicas
 * ni absolutas; las contraindicaciones remiten a un profesional.
 */
import type { ExerciseTechnique } from '@/domain/types';

type T = ExerciseTechnique;

export const AUTHORED_LOWER_2: Record<string, T> = {
  /* ═════════════════════════════════════════════════════════════ PIERNAS ══ */

  'sentadilla-frontal': {
    authored: true,
    summary:
      'La barra delante obliga a un torso mas vertical: mas cuadriceps y menos palanca sobre la lumbar que la trasera.',
    setup: [
      'Rack con la barra a la altura de la clavicula y seguros al punto mas bajo.',
      'Agarre frontal con los dedos bajo la barra, o cruzado si te falta movilidad de muneca.',
    ],
    startPosition: [
      'Barra apoyada en los deltoides frontales, no sostenida por las manos.',
      'Codos altos, brazos paralelos al suelo.',
      'Pies a la anchura de los hombros, puntas ligeramente hacia fuera.',
      'Aire dentro y abdomen presurizado.',
    ],
    execution: [
      'Baja manteniendo el torso lo mas vertical posible.',
      'Los codos no bajan: si caen, la barra rueda hacia delante.',
      'Desciende hasta donde mantengas la pelvis neutra.',
      'Sube empujando el suelo con todo el pie.',
    ],
    breathing: 'Aire dentro arriba, mantenlo durante la bajada, expulsa al pasar el punto dificil.',
    rangeOfMotion:
      'Suele permitir mas profundidad que la trasera por la posicion vertical del torso.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Dejar caer los codos y perder la barra hacia delante.',
      'Inclinar el torso como en una sentadilla trasera.',
      'Sujetar la barra con las manos en lugar de apoyarla en los hombros.',
    ],
    warningSigns: [
      'Los codos descienden durante la subida.',
      'La barra se desplaza hacia el cuello o hacia delante.',
      'El torso se inclina de golpe al salir del hoyo.',
    ],
    safety: [
      'Si pierdes la barra hacia delante, dejala caer al frente y separate: nunca intentes recuperarla.',
      'Trabaja siempre dentro de un rack con seguros.',
    ],
    hypertrophy: [
      '6–10 repeticiones. Es de los mejores ejercicios de cuadriceps con barra.',
    ],
    strength: [
      '3–5 repeticiones. Moveras entre un 15 y un 25% menos que en trasera: es lo esperable.',
    ],
    warnings: ['Carga lumbar moderada: menor que la trasera, pero sigue siendo una sentadilla cargada.'],
    contraindications: ['Molestia de muneca o de hombro que impida sostener la barra.'],
    lumbarAdaptation:
      'Con el torso mas vertical ya es la version mas amable con la lumbar entre las sentadillas con barra. Si aun molesta, la goblet mantiene el mismo patron sin carga sobre la espalda.',
  },

  'sentadilla-goblet': {
    authored: true,
    summary:
      'El contrapeso delante del pecho endereza el torso solo: la mejor forma de aprender el patron y la mas amable con la espalda.',
    setup: [
      'Una mancuerna o kettlebell que puedas sostener comoda contra el pecho.',
      'Empieza ligero: el objetivo es la posicion, no la carga.',
    ],
    startPosition: [
      'Sujeta el peso contra el esternon con ambas manos, codos hacia abajo.',
      'Pies a la anchura de los hombros, puntas ligeramente hacia fuera.',
      'Pecho alto, abdomen firme.',
    ],
    execution: [
      'Baja entre las rodillas manteniendo el torso vertical.',
      'Los codos pueden rozar la cara interna de los muslos abajo.',
      'Desciende hasta donde la pelvis siga neutra.',
      'Sube empujando el suelo sin dejar que el peso te arrastre hacia delante.',
    ],
    breathing: 'Aire dentro arriba, expulsa al subir.',
    rangeOfMotion:
      'Suele permitir mucha profundidad porque el contrapeso ayuda a mantener el equilibrio.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Separar el peso del pecho, lo que anula el contrapeso.',
      'Dejar caer los codos hacia fuera.',
      'Usar carga tan alta que el agarre falla antes que las piernas.',
    ],
    warningSigns: [
      'El peso se aleja del cuerpo.',
      'Los talones se levantan del suelo.',
    ],
    safety: [
      'Si pierdes el equilibrio, sueltas el peso hacia delante y ya esta: es la sentadilla mas segura del catalogo.',
    ],
    hypertrophy: ['10–20 repeticiones. El agarre suele limitar antes que las piernas.'],
    strength: [
      'No es un ejercicio de fuerza maxima. Usalo para aprender el patron y como calentamiento.',
    ],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia de rodilla en flexion profunda: reduce el rango.'],
    lumbarAdaptation:
      'Es una de las mejores opciones con lumbar sensible: sin carga axial sobre la columna y con el torso vertical por diseno.',
  },

  'zancadas-estaticas': {
    authored: true,
    summary:
      'Sin desplazamiento, toda la atencion va al recorrido vertical y a la estabilidad de la rodilla.',
    setup: [
      'Espacio para un paso largo. Sin peso hasta dominar el equilibrio.',
      'Puedes apoyar una mano en la pared al principio.',
    ],
    startPosition: [
      'Un pie adelantado, otro atras apoyado en la punta.',
      'Torso erguido, mirada al frente.',
      'Peso repartido entre los dos pies.',
    ],
    execution: [
      'Baja vertical flexionando ambas rodillas.',
      'La rodilla trasera desciende hasta quedar a un par de centimetros del suelo.',
      'Empuja con el talon delantero para volver arriba.',
      'Completa todas las repeticiones de un lado antes de cambiar.',
    ],
    breathing:
      'Inspira mientras la rodilla de atras baja, expulsa al subir desde el talon delantero.',
    rangeOfMotion: 'Hasta que la rodilla trasera casi toque el suelo.',
    tempo: '2-1-1-0',
    commonMistakes: [
      'Desplazarse hacia delante en lugar de bajar vertical.',
      'Paso demasiado corto, que adelanta mucho la rodilla.',
      'Inclinar el torso.',
    ],
    warningSigns: [
      'La rodilla delantera se desplaza hacia dentro.',
      'Necesitas apoyo constante para no caerte.',
    ],
    safety: ['Domina esta version antes de pasar a zancadas caminando o a la bulgara.'],
    hypertrophy: ['10–15 repeticiones por pierna.'],
    strength: ['Anade mancuernas a los lados cuando controles el equilibrio.'],
    warnings: ['Sin riesgos destacables al hacerlo con peso corporal y equilibrio controlado.'],
    contraindications: ['Dolor de rodilla en flexion cargada.'],
    lumbarAdaptation:
      'Sin desplazamiento y con mancuernas a los lados, la carga axial es minima. Es una buena opcion de pierna unilateral con espalda sensible.',
  },

  'nordic-curl': {
    authored: true,
    summary:
      'Excentrica pura de isquiotibiales. Muy exigente: la primera vez casi nadie controla mas de la mitad del recorrido.',
    setup: [
      'Alguien que sujete los tobillos, o un soporte firme donde encajarlos.',
      'Una colchoneta bajo las rodillas.',
    ],
    startPosition: [
      'De rodillas con los tobillos bien fijados.',
      'Cuerpo en linea recta desde las rodillas hasta la cabeza.',
      'Gluteos apretados, manos preparadas por delante.',
    ],
    execution: [
      'Baja el torso hacia delante lo mas despacio que puedas, resistiendo con los isquiotibiales.',
      'Manten la cadera extendida: no te dobles por la cintura.',
      'Amortigua con las manos al llegar abajo.',
      'Vuelve empujando con las manos hasta la posicion inicial.',
    ],
    breathing: 'Inspira antes de bajar, expulsa el aire durante el descenso.',
    rangeOfMotion:
      'Hasta donde controles. Al principio seran 20 grados; con el tiempo, mucho mas.',
    tempo: 'Excentrica de 4–6 segundos',
    commonMistakes: [
      'Doblarse por la cadera en lugar de mantener la linea del cuerpo.',
      'Dejarse caer sin resistir.',
      'Hacer demasiado volumen el primer dia.',
    ],
    warningSigns: [
      'La cadera se flexiona y los gluteos se van hacia atras.',
      'La caida deja de ser controlada desde el primer grado.',
    ],
    safety: [
      'Deja siempre las manos preparadas para amortiguar.',
      'Empieza con 2 series de 3 repeticiones: produce agujetas notables.',
    ],
    hypertrophy: ['3 series de 4–8 repeticiones. Poco volumen, mucha intensidad.'],
    strength: [
      'Progresa aumentando el rango controlado antes que las repeticiones.',
    ],
    warnings: ['El volumen alto en las primeras sesiones deja agujetas que duran varios dias.'],
    contraindications: ['Molestia previa de isquiotibiales: consulta con un profesional antes de incluirlo.'],
    lumbarAdaptation:
      'Manteniendo la cadera extendida y la linea del cuerpo, la lumbar apenas trabaja. Si te doblas por la cintura, si la implica: esa es la senal para parar.',
  },

  'patada-gluteo': {
    authored: true,
    summary:
      'Aislamiento de gluteo con el torso estable. El rango util termina cuando la pelvis empieza a rotar.',
    setup: [
      'Polea baja con tobillera.',
      'Sujeta la torre con ambas manos para estabilizarte.',
    ],
    startPosition: [
      'De pie frente a la torre, tobillera en la pierna que trabaja.',
      'Ligera inclinacion del torso hacia delante, espalda neutra.',
      'Pierna de apoyo con rodilla ligeramente flexionada.',
    ],
    execution: [
      'Lleva la pierna hacia atras extendiendo la cadera.',
      'Detente cuando el gluteo este contraido y antes de que la lumbar se arquee.',
      'Manten un segundo la contraccion.',
      'Vuelve controlado sin dejar que el peso tire.',
    ],
    breathing:
      'Expulsa al llevar la pierna hacia atras, inspira mientras la rodilla vuelve bajo la cadera.',
    rangeOfMotion:
      'Hasta la extension de cadera, no mas. Todo lo que pase de ahi sale de la columna.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Arquear la lumbar para ganar recorrido.',
      'Rotar la pelvis hacia el lado que trabaja.',
      'Cargar demasiado y compensar con el torso.',
    ],
    warningSigns: [
      'La zona lumbar se arquea al final del movimiento.',
      'La cadera rota en cada repeticion.',
    ],
    safety: ['Carga moderada: el rango extra que da el peso alto sale de la espalda, no del gluteo.'],
    hypertrophy: ['12–20 repeticiones por pierna con pausa en contraccion.'],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos destacables mientras la pelvis no rote y el rango se mantenga corto.'],
    contraindications: ['Molestia lumbar al extender la cadera.'],
    lumbarAdaptation:
      'Manten el rango corto y la pelvis quieta. Si te cuesta, el puente de gluteo da el mismo trabajo tumbado, con la espalda apoyada.',
  },

  abduccion: {
    authored: true,
    summary:
      'Trabaja el gluteo medio, clave para la estabilidad de la cadera y a menudo el eslabon debil en sentadillas.',
    setup: [
      'Maquina de abduccion con el respaldo ajustado.',
      'Puedes inclinar el torso hacia delante para enfatizar el gluteo medio.',
    ],
    startPosition: [
      'Sentado con la espalda apoyada y las almohadillas en la cara externa de los muslos.',
      'Pies planos en los apoyos.',
      'Abdomen firme.',
    ],
    execution: [
      'Separa las piernas contrayendo el gluteo.',
      'Manten un segundo en la maxima apertura.',
      'Vuelve controlado sin dejar que las placas choquen.',
    ],
    breathing: 'Expulsa al abrir, inspira al cerrar.',
    rangeOfMotion: 'Apertura completa comoda, cierre hasta antes de que las placas se toquen.',
    tempo: '2-1-2-1',
    commonMistakes: [
      'Usar impulso del torso hacia atras.',
      'Recorrido muy corto con carga excesiva.',
      'Dejar que el peso vuelva de golpe.',
    ],
    warningSigns: ['La espalda se despega del respaldo.', 'El movimiento se vuelve un rebote.'],
    safety: ['Ejercicio de bajo riesgo. La carga excesiva solo empeora la calidad del movimiento.'],
    hypertrophy: [
      '15–25 repeticiones con pausa. El gluteo medio responde bien a repeticiones altas.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia en la cara externa de la cadera.'],
    lumbarAdaptation: 'Con la espalda apoyada, la carga lumbar es practicamente nula.',
  },

  'gemelo-sentado': {
    authored: true,
    summary:
      'Con la rodilla flexionada el gemelo pierde ventaja y el soleo toma el relevo: complementa al gemelo de pie.',
    setup: [
      'Maquina de gemelo sentado con la almohadilla sobre la parte baja del muslo.',
      'Antepie sobre el borde de la plataforma, talones al aire.',
    ],
    startPosition: [
      'Sentado con las rodillas a 90 grados.',
      'Almohadilla firme sobre los muslos, no sobre la rodilla.',
      'Talones por debajo del nivel del antepie.',
    ],
    execution: [
      'Sube los talones todo lo que puedas.',
      'Manten un segundo la contraccion.',
      'Baja despacio hasta el estiramiento maximo.',
      'Manten 2 segundos abajo antes de la siguiente repeticion.',
    ],
    breathing:
      'Expulsa al empujar con la punta del pie, inspira mientras el talon baja.',
    rangeOfMotion:
      'Estiramiento maximo abajo y elevacion completa arriba. El recorrido parcial es el error clasico del gemelo.',
    tempo: '3-2-1-1',
    commonMistakes: [
      'Rebotar en la parte baja.',
      'Recorrido corto con mucho peso.',
      'Almohadilla colocada sobre la rodilla en lugar del muslo.',
    ],
    warningSigns: [
      'El movimiento se vuelve un rebote ritmico.',
      'Molestia en la rodilla por la posicion de la almohadilla.',
    ],
    safety: ['Comprueba la posicion de la almohadilla antes de cargar.'],
    hypertrophy: [
      '15–20 repeticiones con pausas en ambos extremos.',
      'Combina con el gemelo de pie: uno trabaja el gemelo, otro el soleo.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia en el tendon de Aquiles.'],
    lumbarAdaptation:
      'Sentado y sin carga sobre los hombros, es la version de gemelo mas amable con la espalda.',
  },

  /* ═══════════════════════════════════════════════════════════════ CORE ══ */

  'crunch-polea': {
    authored: true,
    summary:
      'Flexion de columna con carga progresiva. Es un ejercicio de abdomen valido, pero no para todas las espaldas.',
    setup: [
      'Polea alta con cuerda.',
      'Arrodillate a un paso de la torre, de espaldas o de frente segun prefieras.',
    ],
    startPosition: [
      'De rodillas con la cuerda sujeta a los lados de la cabeza.',
      'Cadera fija, torso erguido.',
      'Abdomen ya en tension antes de empezar.',
    ],
    execution: [
      'Flexiona la columna llevando las costillas hacia la pelvis.',
      'El movimiento es de la columna, no de la cadera.',
      'Manten un segundo la contraccion.',
      'Vuelve controlado sin dejar que el peso te estire.',
    ],
    breathing: 'Expulsa el aire al flexionar: ayuda a cerrar las costillas.',
    rangeOfMotion:
      'Flexion de columna, no giro de cadera. Si la cadera se mueve, el abdomen deja de trabajar.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Mover la cadera en lugar de la columna.',
      'Tirar con los brazos.',
      'Cargar tanto que el movimiento se convierte en un balanceo.',
    ],
    warningSigns: [
      'La cadera sube y baja con cada repeticion.',
      'Notas el cuello o los brazos mas que el abdomen.',
    ],
    safety: [
      'La flexion repetida de columna bajo carga no le sienta bien a todas las espaldas.',
    ],
    hypertrophy: ['12–20 repeticiones con contraccion controlada.'],
    strength: ['No aplica.'],
    warnings: ['Si notas la zona lumbar, cambia a un ejercicio de anti-extension.'],
    contraindications: ['Molestia lumbar que aparece con la flexion cargada.'],
    lumbarAdaptation:
      'Con lumbar sensible, sustituye por plancha, dead bug o McGill curl-up: trabajan el abdomen sin flexionar la columna bajo carga.',
  },

  'elevacion-piernas': {
    authored: true,
    summary:
      'Cuelga sin balancearte y sube desde la pelvis: si solo mueves las piernas, trabaja el flexor de cadera.',
    setup: [
      'Barra fija o paralelas con apoyo de codos.',
      'La version con apoyo de codos elimina la exigencia de agarre.',
    ],
    startPosition: [
      'Colgado con los brazos extendidos y los hombros deprimidos.',
      'Piernas juntas y extendidas.',
      'Abdomen ya en tension, pelvis ligeramente en retroversion.',
    ],
    execution: [
      'Inicia metiendo la pelvis: la parte baja de la espalda se redondea ligeramente.',
      'Sube las piernas manteniendo esa retroversion.',
      'Detente cuando dejes de poder mantenerla.',
      'Baja despacio sin dejarte caer.',
    ],
    breathing:
      'Expulsa al elevar las piernas, inspira al bajarlas. Retener el aire hace perder la retroversion.',
    rangeOfMotion:
      'Hasta donde mantengas la retroversion pelvica. Ese es el rango util, no cuanto suben los pies.',
    tempo: '2-1-3-0',
    commonMistakes: [
      'Balancearse para generar impulso.',
      'Subir las piernas sin mover la pelvis.',
      'Dejarse caer en la bajada.',
    ],
    warningSigns: [
      'El cuerpo oscila como un pendulo.',
      'Notas los flexores de cadera y nada de abdomen.',
    ],
    safety: ['Si el agarre falla antes que el abdomen, usa correas o la version con apoyo de codos.'],
    hypertrophy: ['8–15 repeticiones controladas.'],
    strength: ['Progresa hacia elevaciones con las piernas extendidas y pausa arriba.'],
    warnings: ['Sin riesgos destacables mientras el cuerpo no se balancee para completar repeticiones.'],
    contraindications: ['Molestia de hombro al colgarse.'],
    lumbarAdaptation:
      'La retroversion pelvica es justo lo que protege la lumbar aqui. Si no la consigues, empieza por elevacion de rodillas.',
  },

  'elevacion-rodillas': {
    authored: true,
    summary:
      'La version accesible de la elevacion de piernas: mismo principio, palanca mas corta.',
    setup: ['Barra fija, paralelas con apoyo de codos o silla romana.'],
    startPosition: [
      'Colgado o apoyado con los hombros deprimidos.',
      'Piernas juntas y relajadas.',
      'Pelvis ligeramente metida.',
    ],
    execution: [
      'Sube las rodillas hacia el pecho iniciando desde la pelvis.',
      'Manten un instante arriba.',
      'Baja despacio hasta la posicion inicial.',
    ],
    breathing:
      'Expulsa al acercar las rodillas al pecho, inspira al dejarlas caer despacio.',
    rangeOfMotion: 'Hasta donde mantengas la pelvis metida.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Balancearse.',
      'Subir solo la rodilla sin implicar la pelvis.',
    ],
    warningSigns: ['El cuerpo oscila.', 'Notas solo los flexores de cadera.'],
    safety: ['Es la progresion previa a la elevacion de piernas extendidas.'],
    hypertrophy: ['12–20 repeticiones.'],
    strength: ['Progresa extendiendo las piernas conforme domines la retroversion.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia de hombro al colgarse: usa la version con apoyo de codos.'],
    lumbarAdaptation:
      'Con la palanca mas corta, la exigencia lumbar es menor que en la version con piernas extendidas.',
  },

  abdominales: {
    authored: true,
    summary:
      'Recorrido corto y controlado. La flexion repetida de columna no le sienta bien a toda espalda.',
    setup: ['Colchoneta. Rodillas flexionadas y pies apoyados.'],
    startPosition: [
      'Tumbado boca arriba, rodillas a 90 grados.',
      'Manos cruzadas en el pecho o a los lados de la cabeza sin tirar del cuello.',
      'Barbilla ligeramente metida.',
    ],
    execution: [
      'Levanta la cabeza y los omoplatos del suelo flexionando la columna.',
      'Detente cuando los omoplatos se despeguen: no hace falta llegar a sentarse.',
      'Manten un instante y baja controlado.',
    ],
    breathing:
      'Expulsa mientras te enrollas hacia arriba, inspira al desenrollar vertebra a vertebra.',
    rangeOfMotion:
      'Solo hasta despegar los omoplatos. El resto del recorrido lo hace el flexor de cadera.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Tirar del cuello con las manos.',
      'Sentarse del todo, implicando el psoas.',
      'Ir rapido y por impulso.',
    ],
    warningSigns: [
      'El cuello se tensa mas que el abdomen.',
      'Los pies se levantan del suelo.',
      'Notas la zona lumbar.',
    ],
    safety: [
      'La flexion repetida de columna es lo que puede molestar en espaldas sensibles.',
    ],
    hypertrophy: ['15–25 repeticiones controladas.'],
    strength: ['No aplica.'],
    warnings: ['Carga lumbar moderada por la flexion repetida.'],
    contraindications: ['Molestia lumbar durante o despues del ejercicio.'],
    lumbarAdaptation:
      'El McGill curl-up existe precisamente como alternativa: mantiene la curva lumbar natural con las manos debajo y trabaja el abdomen sin flexionar la columna. Dead bug y plancha son igual de validos.',
  },

  'russian-twist': {
    authored: true,
    summary:
      'Rotacion cargada del tronco. Util para oblicuos, pero de los ejercicios de core que mas exigen a la columna.',
    setup: ['Colchoneta y un disco o mancuerna ligera. Sin peso al principio.'],
    startPosition: [
      'Sentado con las rodillas flexionadas y los pies apoyados o elevados.',
      'Torso inclinado hacia atras unos 45 grados, espalda recta.',
      'Peso sujeto con ambas manos delante del pecho.',
    ],
    execution: [
      'Gira el torso hacia un lado manteniendo la espalda recta.',
      'El movimiento nace de la caja toracica, no de los brazos.',
      'Vuelve al centro y gira al otro lado.',
      'Manten el control en todo el recorrido.',
    ],
    breathing: 'Respiracion continua. No aguantes el aire.',
    rangeOfMotion: 'Rotacion moderada. Girar hasta el limite anade riesgo sin anadir estimulo.',
    tempo: '2-0-2-0 · lento a ambos lados',
    commonMistakes: [
      'Redondear la espalda al inclinarse.',
      'Mover solo los brazos sin rotar el torso.',
      'Ir rapido, convirtiendolo en un balanceo.',
    ],
    warningSigns: [
      'La espalda se redondea.',
      'Notas la zona lumbar en lugar de los oblicuos.',
    ],
    safety: [
      'La rotacion bajo carga con la columna flexionada es la combinacion que mas molesta a espaldas sensibles.',
      'Sin peso y despacio es un ejercicio distinto al mismo movimiento con disco y a toda velocidad.',
    ],
    hypertrophy: ['15–20 repeticiones totales, lentas y sin peso o con muy poco.'],
    strength: ['No aplica.'],
    warnings: ['Carga lumbar moderada. No es el ejercicio de oblicuos mas seguro que existe.'],
    contraindications: ['Molestia lumbar al rotar el tronco.'],
    lumbarAdaptation:
      'El pallof press trabaja los mismos musculos resistiendo la rotacion en vez de producirla, sin flexionar la columna. La plancha lateral es la otra alternativa clara.',
  },

  'rueda-abdominal': {
    authored: true,
    summary:
      'Anti-extension en su version mas exigente. El rango util termina donde la lumbar empieza a arquearse.',
    setup: [
      'Rueda abdominal y una colchoneta bajo las rodillas.',
      'Empieza de rodillas y con recorrido corto; la version de pie es muy avanzada.',
    ],
    startPosition: [
      'De rodillas con la rueda bajo los hombros.',
      'Pelvis en retroversion, costillas hacia abajo.',
      'Gluteos y abdomen apretados.',
    ],
    execution: [
      'Rueda hacia delante manteniendo la pelvis metida.',
      'Detente en el instante en que notes que la lumbar quiere arquearse.',
      'Vuelve tirando con el abdomen, no con los brazos.',
    ],
    breathing: 'Expulsa el aire al extenderte, inspira al volver.',
    rangeOfMotion:
      'Hasta el punto exacto en que pierdes la retroversion. Ese punto es distinto para cada persona y va creciendo con la practica.',
    tempo: '3-0-2-0',
    commonMistakes: [
      'Ir mas lejos de lo que el core puede sostener.',
      'Arquear la lumbar en la extension.',
      'Volver tirando con los brazos.',
    ],
    warningSigns: [
      'La cadera se hunde y la espalda se arquea.',
      'Notas un pinchazo en la zona lumbar al extenderte.',
    ],
    safety: [
      'Coloca un tope fisico (una pared) a la distancia que controlas: te impide pasarte.',
      'Si no puedes volver, deja caer la cadera al suelo de forma controlada.',
    ],
    hypertrophy: ['3 series de 6–12 repeticiones dentro del rango controlado.'],
    strength: ['Progresa alargando el rango, nunca anadiendo velocidad.'],
    warnings: ['Es de los ejercicios de core que mas rapido castigan pasarse de rango.'],
    contraindications: ['Molestia lumbar en extension.'],
    lumbarAdaptation:
      'Empieza con la plancha hasta poder mantener 45 segundos con la pelvis firme. Despues, rueda con recorrido muy corto y un tope fisico.',
  },

  /* ═══════════════════════════════════════════════════════════ MOVILIDAD ══ */

  'movilidad-cadera': {
    authored: true,
    summary:
      'Trabaja rotacion interna y externa de cadera, el rango que mas limita la profundidad en sentadilla.',
    setup: ['Colchoneta y espacio para sentarse con las piernas abiertas.'],
    startPosition: [
      'Sentado con una pierna delante flexionada a 90 grados y la otra al lado, tambien a 90.',
      'Torso erguido, manos apoyadas detras para sostenerte.',
    ],
    execution: [
      'Gira ambas rodillas hacia el lado contrario pasando por el suelo.',
      'Manten el torso lo mas erguido que puedas.',
      'Alterna de lado a lado despacio.',
      'Puedes mantener 20–30 segundos en cada posicion inclinando el torso hacia delante.',
    ],
    breathing: 'Respiracion lenta y profunda: ayuda a ganar rango.',
    rangeOfMotion: 'Hasta notar tension en la cadera, nunca dolor.',
    tempo: 'Transiciones lentas o mantenimientos de 20–30 segundos',
    commonMistakes: [
      'Forzar con rebotes.',
      'Redondear la espalda para llegar mas lejos.',
      'Aguantar la respiracion.',
    ],
    warningSigns: [
      'Aparece pinchazo en la cara anterior de la cadera.',
      'La espalda se redondea buscando rango.',
    ],
    safety: ['La tension es suficiente estimulo. El dolor no aporta rango, lo resta.'],
    hypertrophy: ['No aplica: el objetivo es movilidad.'],
    strength: [
      'Si quieres que el rango se quede, activa la posicion nueva: levanta la rodilla del suelo unos segundos en cada lado.',
    ],
    warnings: ['Sin riesgos destacables mientras te muevas dentro de un rango comodo.'],
    contraindications: ['Molestia de cadera que empeora al rotar: consulta con un profesional.'],
    lumbarAdaptation:
      'Ganar rotacion de cadera reduce la compensacion que la zona lumbar hace en sentadillas y bisagras. Es de los trabajos mas utiles con espalda sensible.',
  },

  'movilidad-toracica': {
    authored: true,
    summary:
      'La zona dorsal debe rotar y extenderse para que la lumbar no tenga que hacerlo por ella.',
    setup: [
      'Colchoneta. Opcionalmente un rodillo de espuma bajo la zona dorsal.',
    ],
    startPosition: [
      'De lado en el suelo, rodillas flexionadas a 90 grados una sobre otra.',
      'Brazos extendidos al frente, palmas juntas.',
      'La rodilla de arriba apoyada en el suelo o sobre un cojin.',
    ],
    execution: [
      'Abre el brazo de arriba describiendo un arco hasta el otro lado.',
      'Sigue la mano con la mirada.',
      'Manten las rodillas juntas y apoyadas: el giro debe venir del torso.',
      'Vuelve despacio y repite antes de cambiar de lado.',
    ],
    breathing: 'Inspira antes de abrir, expulsa el aire durante la rotacion.',
    rangeOfMotion: 'Hasta donde llegue el hombro sin que las rodillas se separen.',
    tempo: 'Lento, con 2–3 segundos de mantenimiento en la apertura',
    commonMistakes: [
      'Dejar que las rodillas se despeguen y rotar desde la cadera.',
      'Forzar el hombro contra el suelo.',
      'Ir rapido.',
    ],
    warningSigns: [
      'Las rodillas se separan del suelo.',
      'Notas la zona lumbar en lugar de la dorsal.',
    ],
    safety: ['Si el hombro no llega al suelo, no pasa nada: el objetivo es la rotacion, no tocar.'],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos mas alla de respetar la tecnica descrita.'],
    contraindications: ['Molestia de hombro en la apertura.'],
    lumbarAdaptation:
      'Una zona dorsal rigida obliga a la lumbar a compensar en rotaciones y extensiones. Este ejercicio ataca esa causa directamente y es seguro incluso en fases sensibles.',
  },

  'gato-camello': {
    authored: true,
    summary:
      'Movilidad segmentaria de columna con recorrido controlado. No busca rango maximo, busca movimiento.',
    setup: ['Colchoneta y espacio para ponerse a cuatro apoyos.'],
    startPosition: [
      'Manos bajo los hombros, rodillas bajo las caderas.',
      'Columna en posicion neutra para empezar.',
      'Cuello alineado, mirada al suelo.',
    ],
    execution: [
      'Redondea la espalda de forma progresiva expulsando el aire, empezando por la pelvis.',
      'Vuelve y arquea suavemente tomando aire.',
      'Cada vertebra se mueve por turno, no toda la espalda de golpe.',
      'Repite despacio, sin buscar el extremo del rango.',
    ],
    breathing: 'Expulsa al redondear, inspira al arquear. La respiracion marca el ritmo.',
    rangeOfMotion:
      'Recorrido comodo en ambas direcciones. Este ejercicio no busca el maximo: busca fluidez.',
    tempo: '3 segundos en cada direccion',
    commonMistakes: [
      'Ir rapido, convirtiendolo en un balanceo.',
      'Forzar el arqueo maximo.',
      'Mover el cuello de forma exagerada.',
    ],
    warningSigns: [
      'Aparece pinchazo en algun punto del recorrido.',
      'La molestia lumbar aumenta a medida que repites en lugar de aliviarse.',
    ],
    safety: ['Si algo molesta en una direccion, reduce el rango en esa direccion y sigue en la otra.'],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos destacables mientras el recorrido resulte comodo en ambas direcciones.'],
    contraindications: ['Dolor agudo en cualquier punto del recorrido.'],
    lumbarAdaptation:
      'Es de los primeros movimientos que suele tolerar bien una espalda sensible. Usalo como calentamiento antes de cualquier sesion con carga sobre la columna.',
  },

  'estiramiento-psoas': {
    authored: true,
    summary:
      'El flexor de cadera acortado tira de la pelvis hacia delante y aumenta la curva lumbar. Aqui la clave es la pelvis, no el rango.',
    setup: ['Colchoneta o cojin bajo la rodilla de apoyo.'],
    startPosition: [
      'En posicion de caballero: una rodilla en el suelo, el otro pie adelantado.',
      'Torso erguido, manos en la cadera adelantada.',
      'Mete la pelvis en retroversion apretando el gluteo del lado de atras.',
    ],
    execution: [
      'Con la pelvis ya metida, desplaza la cadera ligeramente hacia delante.',
      'Notaras la tension en la parte frontal de la cadera trasera.',
      'Manten 20–30 segundos respirando con calma.',
      'Cambia de lado.',
    ],
    breathing: 'Respiracion lenta y profunda durante todo el mantenimiento.',
    rangeOfMotion:
      'Muy corto. Si necesitas desplazarte mucho, es que la pelvis no esta metida y estas estirando la lumbar en lugar del psoas.',
    tempo: 'Mantenimiento de 20–30 segundos por lado',
    commonMistakes: [
      'Arquear la lumbar y desplazarse mucho hacia delante.',
      'No apretar el gluteo del lado que estira.',
      'Buscar rango en lugar de posicion.',
    ],
    warningSigns: [
      'Notas la zona lumbar en lugar de la cadera.',
      'La espalda se arquea al desplazarte.',
    ],
    safety: ['Sin la retroversion pelvica, este estiramiento carga la lumbar en vez de soltar el psoas.'],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos destacables mientras mantengas la pelvis en retroversion.'],
    contraindications: ['Molestia de rodilla en el apoyo: usa mas acolchado.'],
    lumbarAdaptation:
      'Es uno de los estiramientos mas utiles con lumbar sensible, siempre que domines la retroversion pelvica. Sin ella, es contraproducente.',
  },

  'dislocaciones-hombro': {
    authored: true,
    summary:
      'Recorre todo el arco del hombro con carga minima. El agarre ancho al principio: estrecharlo antes de tiempo fuerza la articulacion.',
    setup: [
      'Banda elastica ligera, palo de escoba o toalla.',
      'Empieza con un agarre muy ancho, mucho mas de lo que crees necesario.',
    ],
    startPosition: [
      'De pie, banda sujeta por delante con los brazos extendidos.',
      'Costillas hacia abajo, abdomen firme.',
    ],
    execution: [
      'Lleva la banda por encima de la cabeza y hacia atras con los brazos extendidos.',
      'Continua hasta que llegue a la altura de los gluteos.',
      'Vuelve por el mismo recorrido.',
      'Estrecha el agarre solo cuando el recorrido sea comodo y sin compensaciones.',
    ],
    breathing:
      'Inspira al llevar el baston hacia atras, expulsa al devolverlo al frente. La respiracion marca el ritmo.',
    rangeOfMotion: 'Recorrido completo por encima de la cabeza, con los brazos siempre extendidos.',
    tempo: 'Lento, 3 segundos por direccion',
    commonMistakes: [
      'Agarre demasiado estrecho desde el principio.',
      'Doblar los codos para completar el recorrido.',
      'Arquear la lumbar al pasar por encima de la cabeza.',
    ],
    warningSigns: [
      'Los codos se doblan.',
      'Las costillas se abren y la espalda se arquea.',
      'Aparece pinchazo en el hombro.',
    ],
    safety: [
      'Con banda elastica, si te pasas de rango la banda cede: es mas segura que un palo rigido.',
    ],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Si aparece pinchazo, ensancha el agarre inmediatamente.'],
    contraindications: ['Historial de luxacion de hombro: consulta con un profesional antes de incluirlo.'],
    lumbarAdaptation:
      'La unica via por la que carga la lumbar es el arqueo compensatorio al pasar por encima de la cabeza. Manten las costillas abajo.',
  },

  /* ═════════════════════════════════════════════════════════════ CARDIO ══ */

  caminadora: {
    authored: true,
    summary:
      'Postura erguida y sin agarrarse. Si necesitas el manillar, la velocidad o la inclinacion son excesivas.',
    setup: [
      'Ajusta velocidad e inclinacion antes de subir del todo.',
      'Coloca la pinza de seguridad en la ropa.',
    ],
    startPosition: [
      'De pie sobre la cinta con el torso erguido y la mirada al frente.',
      'Brazos relajados a los lados.',
    ],
    execution: [
      'Empieza con 3–5 minutos suaves.',
      'Manten la postura erguida y el braceo natural.',
      'No te agarres al manillar salvo para subir o bajar.',
      'Termina con unos minutos de vuelta a la calma.',
    ],
    breathing: 'Ritmo comodo. En trabajo suave deberias poder mantener una conversacion.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Constante',
    commonMistakes: [
      'Agarrarse al manillar, lo que reduce mucho el gasto real.',
      'Mirar los pies en lugar de al frente.',
      'Bajarse de golpe sin reducir la velocidad.',
    ],
    warningSigns: [
      'Necesitas el manillar para mantener el ritmo.',
      'La zancada se vuelve irregular.',
    ],
    safety: [
      'Usa siempre la pinza de seguridad.',
      'Reduce la velocidad antes de bajarte.',
    ],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Para si notas mareo o dolor en el pecho.'],
    contraindications: [
      'Sintomas cardiovasculares durante el ejercicio: consulta con un profesional sanitario.',
    ],
  },

  'cinta-inclinada': {
    authored: true,
    summary:
      'La herramienta de cardio mas usada en prep. Su valor depende por completo de no agarrarse al manillar.',
    setup: [
      'Inclinacion entre el 8 y el 15%, velocidad entre 4.5 y 6 km/h como punto de partida.',
      'Pinza de seguridad puesta.',
    ],
    startPosition: [
      'De pie con el torso erguido y ligeramente inclinado hacia delante por el tobillo, no por la cintura.',
      'Brazos con braceo natural.',
    ],
    execution: [
      'Camina con zancada natural sin agarrarte.',
      'Manten el torso erguido: inclinarse sobre el manillar anula el efecto de la pendiente.',
      'Si necesitas sujetarte, baja la inclinacion o la velocidad.',
    ],
    breathing: 'Deberias poder hablar con frases cortas: esa es la zona de trabajo tipica.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Constante, 20–45 minutos segun el plan',
    commonMistakes: [
      'Agarrarse al manillar, que reduce el gasto real hasta un tercio y falsea las calorias de la maquina.',
      'Inclinacion tan alta que obliga a sujetarse.',
      'Correr en lugar de caminar, lo que anade fatiga innecesaria en un prep.',
    ],
    warningSigns: [
      'Las manos vuelven al manillar sin que lo decidas.',
      'El torso se inclina hacia delante desde la cintura.',
    ],
    safety: [
      'Las calorias que muestra la maquina son una estimacion, y bastante generosa. Usa el tiempo como referencia, no el numero.',
    ],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['El impacto es bajo, pero el volumen alto puede cargar el tendon de Aquiles.'],
    contraindications: ['Molestia en el tendon de Aquiles o en la fascia plantar.'],
  },

  bicicleta: {
    authored: true,
    summary:
      'Bajo impacto y postura estable. La altura del sillin decide si trabajas comodo o te castigas la rodilla.',
    setup: [
      'Ajusta el sillin: con el pedal abajo, la rodilla debe quedar casi extendida, con una flexion de unos 25 grados.',
      'Manillar a una altura que no te obligue a redondear la espalda.',
    ],
    startPosition: [
      'Sentado con el peso repartido, espalda neutra.',
      'Antepie sobre el pedal, no el arco.',
    ],
    execution: [
      'Pedalea con cadencia constante, entre 70 y 90 revoluciones por minuto en trabajo suave.',
      'Ajusta la resistencia, no la cadencia, para cambiar la intensidad.',
      'Manten los hombros relajados.',
    ],
    breathing:
      'El ritmo respiratorio lo marca la intensidad: en zona baja deberias poder mantener una frase entera.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Cadencia constante',
    commonMistakes: [
      'Sillin demasiado bajo, que castiga la rodilla.',
      'Balancear la cadera para alcanzar el pedal, senal de sillin demasiado alto.',
      'Redondear la espalda sobre el manillar.',
    ],
    warningSigns: [
      'La cadera oscila de lado a lado.',
      'Molestia en la parte frontal de la rodilla.',
    ],
    safety: ['Ajusta el sillin antes de cada sesion si la maquina es compartida.'],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos destacables con el sillin a la altura correcta y la espalda sin encorvar.'],
    contraindications: ['Molestia de rodilla que empeora al pedalear.'],
    lumbarAdaptation:
      'Es de las opciones de cardio mas amables con la espalda, siempre que el manillar este lo bastante alto para no obligarte a encorvarte.',
  },

  eliptica: {
    authored: true,
    summary:
      'Impacto minimo y cuerpo completo. Util cuando las articulaciones piden tregua pero el cardio no puede parar.',
    setup: ['Ajusta la resistencia antes de empezar. Sujeta los manillares moviles si quieres implicar el tren superior.'],
    startPosition: [
      'De pie sobre los pedales con el torso erguido.',
      'Peso repartido en todo el pie.',
    ],
    execution: [
      'Pedalea con movimiento fluido, sin dar tirones.',
      'Manten el torso erguido, sin apoyarte en los manillares fijos.',
      'Si usas los manillares moviles, empuja y tira de forma activa.',
    ],
    breathing:
      'Respiracion constante. Si no puedes hablar, has subido demasiado la resistencia para una sesion de base.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Constante',
    commonMistakes: [
      'Apoyar el peso en los manillares fijos.',
      'Resistencia tan baja que el movimiento se vuelve inercial.',
    ],
    warningSigns: ['Los brazos sostienen parte del peso corporal.', 'El movimiento se vuelve un balanceo.'],
    safety: ['Sube y baja con la maquina detenida.'],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: [
      'Sin contraindicaciones destacables para la mayoria. Si aparecen sintomas cardiovasculares durante el esfuerzo, consulta con un profesional sanitario.',
    ],
    lumbarAdaptation: 'Bajo impacto y postura erguida: buena opcion con espalda sensible.',
  },

  'remo-ergometro': {
    authored: true,
    summary:
      'Piernas, cadera y brazos, en ese orden. Invertir la secuencia es lo que convierte el remo en un ejercicio de espalda baja.',
    setup: [
      'Ajusta las correas de los pies a la altura del antepie.',
      'Resistencia media al principio: mas no es mejor.',
    ],
    startPosition: [
      'Sentado con las rodillas flexionadas y las espinillas verticales.',
      'Brazos extendidos sujetando el agarre.',
      'Torso ligeramente inclinado hacia delante desde la cadera, espalda neutra.',
    ],
    execution: [
      'Empuja primero con las piernas manteniendo brazos y torso quietos.',
      'Cuando las piernas estan casi extendidas, abre la cadera hacia atras.',
      'Por ultimo, tira con los brazos hasta la parte baja del pecho.',
      'Invierte el orden al volver: brazos, cadera, piernas.',
    ],
    breathing: 'Expulsa durante el tiron, inspira al volver.',
    rangeOfMotion: 'Recorrido completo respetando la secuencia piernas-cadera-brazos.',
    tempo: 'Ritmo constante, mas control que velocidad',
    commonMistakes: [
      'Tirar con los brazos antes de empujar con las piernas.',
      'Redondear la espalda al volver hacia delante.',
      'Echar el torso muy atras al final del tiron.',
    ],
    warningSigns: [
      'La espalda se redondea en la vuelta.',
      'Notas la zona lumbar antes que las piernas.',
    ],
    safety: [
      'La secuencia correcta es lo que reparte el trabajo. Si la inviertes, toda la carga va a la espalda baja.',
    ],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Carga lumbar moderada si la tecnica se rompe con la fatiga.'],
    contraindications: ['Sensibilidad lumbar activa.'],
    lumbarAdaptation:
      'Con lumbar sensible, la bicicleta o la eliptica dan un estimulo cardiovascular parecido sin la flexion repetida de tronco bajo fatiga.',
  },

  escaladora: {
    authored: true,
    summary:
      'Gasto alto con impacto bajo. Su unico enemigo es apoyarse en el pasamanos.',
    setup: ['Empieza con una velocidad que te permita subir sin agarrarte.'],
    startPosition: [
      'De pie con el torso erguido, mirada al frente.',
      'Manos apoyadas ligeramente, sin sostener peso.',
    ],
    execution: [
      'Sube pisando el escalon completo, no solo con la punta.',
      'Manten el torso erguido: inclinarte sobre el pasamanos quita casi todo el trabajo.',
      'Ritmo constante durante toda la sesion.',
    ],
    breathing: 'Ritmo comodo. Sube la velocidad solo si puedes mantener la postura.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Constante',
    commonMistakes: [
      'Colgarse del pasamanos.',
      'Pisar solo con la punta del pie.',
      'Velocidad tan alta que obliga a sujetarse.',
    ],
    warningSigns: [
      'Los brazos sostienen el peso del cuerpo.',
      'El torso se inclina hacia delante de forma marcada.',
    ],
    safety: ['Baja siempre con la maquina detenida o a velocidad minima.'],
    hypertrophy: ['No aplica, aunque implica bastante gluteo.'],
    strength: ['No aplica.'],
    warnings: ['El gasto es alto: vigila la fatiga acumulada si ya entrenas piernas fuerte.'],
    contraindications: ['Molestia de rodilla al subir escalones.'],
  },

  cuerda: {
    authored: true,
    summary:
      'Salto de bajo recorrido y aterrizaje con el antepie. Es cardio de impacto: la dosis importa.',
    setup: [
      'Cuerda a tu medida: pisandola, los mangos deben llegarte a las axilas.',
      'Superficie con algo de amortiguacion, no cemento.',
    ],
    startPosition: [
      'De pie con los pies juntos, codos pegados al cuerpo.',
      'Hombros relajados, mirada al frente.',
    ],
    execution: [
      'Gira la cuerda con las munecas, no con los brazos.',
      'Salta apenas 2–3 cm, lo justo para que pase la cuerda.',
      'Aterriza con el antepie y las rodillas ligeramente flexionadas.',
    ],
    breathing: 'Ritmo constante y comodo.',
    rangeOfMotion: 'Salto minimo. Saltar alto solo anade impacto.',
    tempo: 'Constante',
    commonMistakes: [
      'Saltar demasiado alto.',
      'Girar con los brazos en lugar de las munecas.',
      'Aterrizar con el talon.',
    ],
    warningSigns: [
      'Los aterrizajes suenan fuerte.',
      'Aparece molestia en gemelos o tibia.',
    ],
    safety: [
      'Es cardio de impacto: si acumulas mucho volumen, la tibia y el Aquiles lo notan.',
      'Empieza con series cortas de 30–60 segundos.',
    ],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['No es la mejor opcion si ya haces mucho volumen de pierna.'],
    contraindications: ['Molestia en tibia, gemelo o tendon de Aquiles.'],
  },

  caminata: {
    authored: true,
    summary:
      'El cardio con menor coste de recuperacion que existe. En un prep, los pasos diarios valen mas que una sesion heroica.',
    setup: ['Calzado comodo. Nada mas.'],
    startPosition: [
      'De pie, torso erguido, mirada al frente.',
      'Hombros sueltos y brazos libres para bracear.',
    ],
    execution: [
      'Camina a ritmo vivo pero conversacional.',
      'Braceo natural, hombros relajados.',
      'Reparte los pasos a lo largo del dia en lugar de concentrarlos en una sola sesion.',
    ],
    breathing: 'Deberias poder mantener una conversacion sin esfuerzo.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Continuo',
    commonMistakes: [
      'Ir tan despacio que no suma nada.',
      'Concentrar todos los pasos en una sesion, lo que fatiga mas que repartirlos.',
    ],
    warningSigns: [
      'Aparece molestia en pies o rodillas por volumen excesivo.',
      'El paso diario sube tanto que interfiere con la recuperacion del entrenamiento de fuerza.',
    ],
    safety: ['Es la actividad con menor coste de recuperacion: puedes hacerla a diario.'],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos mas alla de respetar la tecnica descrita.'],
    contraindications: [
      'Sin contraindicaciones destacables para la mayoria. Si aparecen sintomas cardiovasculares durante el esfuerzo, consulta con un profesional sanitario.',
    ],
    lumbarAdaptation:
      'Caminar suele sentar bien a la mayoria de espaldas sensibles. Si notas molestia al caminar mucho rato, reparte la distancia en tramos mas cortos.',
  },

  'farmer-walk': {
    authored: true,
    summary:
      'Agarre, core y postura bajo carga real. El tronco trabaja impidiendo que la carga te incline.',
    setup: [
      'Dos mancuernas o kettlebells iguales.',
      'Recorrido despejado de 15–20 metros, o espacio para caminar en circulos.',
    ],
    startPosition: [
      'De pie entre las cargas, agarralas doblando las rodillas y con la espalda neutra.',
      'Hombros abajo y atras, pecho alto.',
      'Abdomen firme.',
    ],
    execution: [
      'Camina con pasos cortos y controlados.',
      'Manten el torso completamente vertical.',
      'No dejes que las cargas te balanceen ni te inclinen a un lado.',
      'Deja el peso en el suelo doblando las rodillas, nunca desde la espalda.',
    ],
    breathing: 'Respiracion continua y controlada. No aguantes el aire durante todo el recorrido.',
    rangeOfMotion: 'No aplica: se mide en distancia o en tiempo.',
    tempo: 'Series de 20–40 metros o de 30–45 segundos',
    commonMistakes: [
      'Inclinarse hacia un lado.',
      'Encoger los hombros.',
      'Dejar caer las cargas al terminar.',
    ],
    warningSigns: [
      'El torso se inclina de forma visible.',
      'Los pasos se vuelven irregulares.',
      'La espalda se redondea al recoger o soltar el peso.',
    ],
    safety: [
      'Coger y soltar la carga es el momento de mas riesgo, no el paseo.',
      'Con lumbar sensible, reduce la carga y la distancia antes que la tecnica.',
    ],
    hypertrophy: ['Series de 30–45 segundos. Trabaja sobre todo agarre y core.'],
    strength: ['Cargas altas en distancias cortas, 15–20 metros.'],
    warnings: ['Carga lumbar moderada por la compresion axial mantenida.'],
    contraindications: ['Molestia lumbar bajo carga axial.'],
    lumbarAdaptation:
      'Con lumbar sensible, reduce mucho la carga y trabaja distancias cortas. La plancha y el pallof press dan trabajo de core sin compresion sobre la columna.',
  },
};
