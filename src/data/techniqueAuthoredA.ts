/**
 * Tecnica escrita a mano — tren superior.
 *
 * Contenido original redactado para esta aplicacion. No se reproduce ni se
 * adapta material de terceros.
 *
 * Cada entrada sustituye por completo a la plantilla del patron de movimiento.
 */
import type { ExerciseTechnique } from '@bodyfit/domain/types';

type T = ExerciseTechnique;

export const AUTHORED_UPPER: Record<string, T> = {
  /* ═══════════════════════════════════════════════════════════════ PECHO ══ */

  'press-banca': {
    authored: true,
    summary:
      'El pectoral crece por lo que controlas al bajar, no por lo que rebotas al subir. Escapulas fijas y codos a 45–70 grados.',
    setup: [
      'Coloca los seguros del rack a la altura del pecho tumbado, no mas abajo.',
      'Tumbate con los ojos justo debajo de la barra.',
      'Agarre entre 1.4 y 1.6 veces la anchura biacromial, con el pulgar rodeando la barra.',
      'Marca la barra con las munecas rectas: el peso cae sobre el hueso, no sobre la articulacion.',
    ],
    startPosition: [
      'Pies planos y firmes, algo por detras de las rodillas.',
      'Junta las escapulas y deprimelas hacia los bolsillos: el pecho sube solo.',
      'Arco lumbar natural con los gluteos siempre pegados al banco.',
      'Saca la barra hacia atras hasta que quede sobre la linea de los hombros.',
    ],
    execution: [
      'Toma aire y aprieta el abdomen antes de iniciar el descenso.',
      'Baja la barra en 2–3 segundos hacia la parte baja del pecho, entre el pezon y el esternon.',
      'Toca el pecho sin apoyar el peso: la tension no se pierde en ningun momento.',
      'Empuja el suelo con los pies y lleva la barra en diagonal ligera hacia los hombros.',
      'Termina con los codos extendidos sin bloquearlos de golpe y sin perder las escapulas.',
    ],
    breathing:
      'Aire dentro arriba, mantenlo durante toda la bajada y expulsa al superar el punto mas dificil de la subida.',
    rangeOfMotion:
      'Contacto ligero con el pecho. Si el hombro molesta antes de llegar, para donde el hombro este comodo.',
    tempo: '3-1-1-0 · 3 s bajando, 1 s de contacto sin apoyar, 1 s empujando',
    commonMistakes: [
      'Abrir los codos a 90 grados del torso: es la causa mas comun de molestia de hombro en este ejercicio.',
      'Despegar los gluteos del banco para generar impulso.',
      'Rebotar la barra en el esternon.',
      'Bajar la barra al cuello por llevar el agarre demasiado ancho.',
      'Perder la retraccion escapular en las ultimas dos repeticiones.',
    ],
    warningSigns: [
      'La barra sube en zigzag o se desvia hacia un lado.',
      'Los hombros se adelantan y el pecho se hunde al tocar.',
      'Necesitas levantar la cadera para completar la repeticion.',
      'Notas mas trabajo en la parte frontal del hombro que en el pectoral.',
    ],
    safety: [
      'Seguros a la altura correcta o companero: es el ejercicio con mas accidentes del gimnasio.',
      'Nunca uses agarre con el pulgar suelto. La barra puede rodar sobre el cuello.',
      'Si trabajas solo y fallas, no intentes rodar la barra: dejala caer sobre los seguros.',
    ],
    hypertrophy: [
      '6–12 repeticiones dejando 1–3 en reserva.',
      'La excentrica de 3 segundos es lo que mas cambia el estimulo, mas que el peso.',
      'Dos sesiones por semana con volumen repartido rinden mas que una sesion larga.',
    ],
    strength: [
      '3–6 repeticiones al 80–90% con descansos de 3–5 minutos.',
      'La tecnica de las series ligeras debe ser identica a la de las pesadas.',
      'Empuja con intencion de mover rapido aunque la barra vaya lenta.',
    ],
    warnings: [
      'Si notas pinchazo en la parte frontal del hombro, cambia a mancuernas o reduce el rango antes de seguir cargando.',
    ],
    contraindications: [
      'Molestia aguda de hombro o pectoral. Consulta con un profesional antes de volver a cargar.',
    ],
    lumbarAdaptation:
      'El arco lumbar debe ser natural, no forzado. Si notas la zona baja, sube los pies al banco o apoyalos en un step: se elimina casi toda la tension lumbar a cambio de algo de estabilidad.',
  },

  'press-inclinado-mancuerna': {
    authored: true,
    summary:
      'Banco a 30 grados y trayectoria libre: la mancuerna permite mas rango y menos estres de hombro que la barra.',
    setup: [
      'Ajusta el banco a 30 grados. Por encima de 45 el trabajo se va al deltoides anterior.',
      'Elige mancuernas que puedas colocar tu solo.',
      'Sientate con las mancuernas apoyadas verticalmente sobre los muslos.',
    ],
    startPosition: [
      'Impulsa cada mancuerna con la rodilla mientras te tumbas: nunca las subas con los brazos.',
      'Escapulas juntas contra el respaldo, pecho alto.',
      'Mancuernas sobre la parte alta del pecho, palmas hacia delante o ligeramente giradas.',
    ],
    execution: [
      'Baja controlado con los codos a unos 45 grados del torso.',
      'Desciende hasta que las manos queden a la altura del pecho o algo por debajo.',
      'Empuja hacia arriba y hacia dentro, sin llegar a chocar las mancuernas.',
      'Manten media flexion de codo arriba para no perder tension.',
    ],
    breathing:
      'Inspira al bajar y expulsa durante el empuje. En inclinado el diafragma trabaja con menos margen: no encadenes repeticiones en apnea.',
    rangeOfMotion:
      'Baja hasta notar estiramiento en el pectoral superior. La mancuerna permite ir mas abajo que la barra: aprovechalo, pero sin forzar el hombro.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Inclinacion excesiva del banco, que convierte el ejercicio en un press de hombro.',
      'Chocar las mancuernas arriba y perder toda la tension.',
      'Bajar los codos por detras de la linea del torso.',
    ],
    warningSigns: [
      'Una mancuerna sube antes que la otra.',
      'Las munecas se doblan hacia atras bajo el peso.',
      'Notas el deltoides anterior mucho mas que el pecho.',
    ],
    safety: [
      'Al terminar, lleva las mancuernas a los muslos y incorporate con ellas. No las sueltes desde arriba.',
      'Con cargas altas, pide que te ayuden a colocarlas.',
    ],
    hypertrophy: [
      '8–12 repeticiones con pausa de un segundo en el estiramiento.',
      'Es de los mejores ejercicios para la porcion clavicular del pectoral.',
    ],
    strength: [
      'No es la mejor herramienta para fuerza maxima: la estabilizacion limita la carga.',
      'Si buscas fuerza, usa la version con barra y deja las mancuernas como accesorio.',
    ],
    warnings: ['Los hombros con historial de inestabilidad toleran mal el estiramiento profundo.'],
    contraindications: ['Dolor de hombro en abduccion con rotacion externa.'],
    lumbarAdaptation:
      'El respaldo inclinado ya sostiene la espalda. Si aun asi notas la zona lumbar, apoya los pies sobre un step para reducir el arco.',
  },

  'press-maquina-pecho': {
    authored: true,
    summary:
      'La maquina fija la trayectoria: es donde puedes llevar el pectoral cerca del fallo con el menor riesgo.',
    setup: [
      'Ajusta el asiento hasta que los agarres queden a la altura de la mitad del pecho.',
      'Comprueba que puedas apoyar la espalda completa sin encoger los hombros.',
    ],
    startPosition: [
      'Espalda pegada al respaldo, escapulas ligeramente juntas.',
      'Pies planos en el suelo, abdomen firme.',
      'Codos algo por debajo de la linea de los hombros.',
    ],
    execution: [
      'Empuja hacia delante llevando los agarres a la linea media sin bloquear los codos.',
      'Aprieta el pectoral medio segundo en la posicion final.',
      'Vuelve controlado hasta notar estiramiento, sin dejar que el peso choque.',
    ],
    breathing: 'Expulsa el aire al empujar, inspira al volver.',
    rangeOfMotion:
      'Hasta el estiramiento comodo del pectoral. Al ser guiada, puedes trabajar el rango completo con seguridad.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Separar la espalda del respaldo para mover mas peso.',
      'Dejar que las placas choquen entre repeticiones.',
      'Encoger los hombros hacia las orejas al empujar.',
    ],
    warningSigns: [
      'La espalda se despega del respaldo.',
      'El cuello se tensa visiblemente.',
    ],
    safety: [
      'Es el empuje horizontal mas seguro del catalogo: no hay barra que caiga.',
      'Ideal para trabajar al fallo o para las ultimas series de la sesion.',
    ],
    hypertrophy: [
      '10–15 repeticiones, incluso hasta el fallo tecnico.',
      'Perfecta para series descendentes al final del entrenamiento.',
    ],
    strength: ['La carga guiada no transfiere bien a la fuerza libre. Usala como accesorio.'],
    warnings: ['Ajusta siempre el asiento: una altura incorrecta cambia el musculo que trabaja.'],
    contraindications: ['Molestia de hombro que no cede al reducir el rango.'],
    lumbarAdaptation:
      'Con la espalda apoyada, la carga lumbar es practicamente nula. Es la mejor opcion de pecho si la zona baja esta sensible.',
  },

  'cruce-poleas': {
    authored: true,
    summary:
      'La polea mantiene tension en todo el recorrido, incluida la contraccion final que la mancuerna pierde.',
    setup: [
      'Coloca las poleas a la altura de los hombros para trabajar el pectoral medio, o arriba para el inferior.',
      'Selecciona una carga que te permita controlar la vuelta sin que te arrastre.',
    ],
    startPosition: [
      'Un pie ligeramente adelantado para estabilizar.',
      'Torso inclinado unos 15 grados hacia delante.',
      'Brazos abiertos con una flexion fija y constante de codo.',
    ],
    execution: [
      'Junta las manos describiendo un arco, como si abrazases un barril.',
      'Cruza ligeramente una mano sobre la otra para maximizar la contraccion.',
      'Manten un segundo en el punto de maxima contraccion.',
      'Abre controlado hasta notar estiramiento en el pectoral.',
    ],
    breathing: 'Expulsa el aire al juntar, inspira al abrir.',
    rangeOfMotion:
      'Estiramiento completo sin que los codos pasen muy por detras del torso, y cruce real al final.',
    tempo: '2-0-1-2',
    commonMistakes: [
      'Convertirlo en un press doblando y estirando el codo.',
      'Usar impulso del torso para arrancar el movimiento.',
      'Cargar tanto que la vuelta se convierte en una caida.',
    ],
    warningSigns: [
      'El angulo del codo cambia durante la serie.',
      'El torso se balancea hacia delante y atras.',
    ],
    safety: [
      'Manten el codo con flexion fija: extenderlo del todo carga el ligamento del hombro.',
      'Sal de la posicion con control, no sueltes los agarres de golpe.',
    ],
    hypertrophy: [
      '12–20 repeticiones con pausa en la contraccion.',
      'Excelente como ultimo ejercicio de pecho, cuando ya no puedes cargar.',
    ],
    strength: ['No aplica: es un ejercicio de tension, no de carga.'],
    warnings: ['Carga moderada. Aqui el peso alto solo empeora la tecnica.'],
    contraindications: ['Inestabilidad de hombro con el brazo abierto.'],
    lumbarAdaptation:
      'De pie exige algo de estabilizacion lumbar. Con molestias, hazlo sentado en un banco entre las poleas.',
  },

  'fondos-pecho': {
    authored: true,
    summary:
      'Inclinacion del torso hacia delante y bajada controlada hasta que el hombro llegue a la altura del codo, ni un centimetro mas.',
    setup: [
      'Elige unas paralelas algo mas anchas que tus hombros.',
      'Si aun no dominas el peso corporal, usa la maquina asistida antes que lastrar.',
    ],
    startPosition: [
      'Brazos extendidos, hombros abajo y lejos de las orejas.',
      'Torso inclinado unos 30 grados hacia delante.',
      'Piernas cruzadas por detras y abdomen apretado.',
    ],
    execution: [
      'Baja controlado manteniendo la inclinacion del torso.',
      'Para cuando el hombro quede a la altura del codo.',
      'Empuja hacia arriba abriendo el pecho, sin encoger los hombros.',
      'Termina sin bloquear los codos de golpe.',
    ],
    breathing:
      'Inspira al bajar y expulsa al empujar. Manten el abdomen firme durante toda la serie: es lo que impide que las piernas se balanceen.',
    rangeOfMotion:
      'Hasta que el hombro alcance la altura del codo. Bajar mas aumenta mucho el estres articular sin anadir estimulo.',
    tempo: '3-0-1-0',
    commonMistakes: [
      'Bajar demasiado buscando profundidad.',
      'Mantener el torso vertical, lo que pasa el trabajo al triceps.',
      'Dejar que los hombros se encojan en la parte baja.',
    ],
    warningSigns: [
      'Los hombros suben hacia las orejas al bajar.',
      'Aparece un chasquido o pinzamiento en la parte frontal del hombro.',
      'Balanceas las piernas para subir.',
    ],
    safety: [
      'Es exigente para el hombro: no es un ejercicio de iniciacion.',
      'Si notas pinzamiento, cambia a press declinado o a fondos en maquina asistida.',
    ],
    hypertrophy: [
      '8–12 repeticiones. Cuando superes 15 limpias, empieza a lastrar.',
      'La inclinacion del torso es lo que decide si trabaja pecho o triceps.',
    ],
    strength: ['Lastre progresivo en series de 5–8 repeticiones.'],
    warnings: [
      'Con hombros sensibles o historial de luxacion, sustituye por press declinado.',
    ],
    contraindications: ['Dolor anterior de hombro, especialmente al bajar.'],
    lumbarAdaptation:
      'La carga lumbar es baja, pero mantener el core firme evita que la pelvis oscile. Si la zona baja molesta, cruza las piernas y aprieta gluteos durante toda la serie.',
  },

  /* ═════════════════════════════════════════════════════════════ ESPALDA ══ */

  'jalon-pecho': {
    authored: true,
    summary:
      'Baja los hombros antes de doblar los codos: si el movimiento lo inicia el biceps, el dorsal apenas participa.',
    setup: [
      'Ajusta el rodillo hasta que sujete los muslos sin dejar hueco.',
      'Agarre pronado, algo mas ancho que los hombros.',
    ],
    startPosition: [
      'Sentado con los muslos fijos y los pies planos.',
      'Brazos extendidos, dejando que las escapulas suban con el peso.',
      'Torso con una inclinacion hacia atras de 15–20 grados, no mas.',
    ],
    execution: [
      'Inicia bajando las escapulas, como si te guardases los hombros en los bolsillos.',
      'Tira llevando los codos hacia las costillas hasta que la barra llegue a la clavicula.',
      'Manten un instante la contraccion sin echar el torso mas atras.',
      'Sube controlado dejando que la escapula se estire por completo.',
    ],
    breathing: 'Expulsa el aire al tirar, inspira durante la subida.',
    rangeOfMotion:
      'Estiramiento completo arriba y barra a la altura de la clavicula abajo. No hace falta tocar el pecho.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Echar el torso muy atras y convertirlo en un remo.',
      'Empezar el tiron con los brazos en vez de con la escapula.',
      'Llevar la barra por detras de la nuca.',
      'Agarre exageradamente ancho, que recorta el recorrido util.',
    ],
    warningSigns: [
      'El torso oscila hacia atras en cada repeticion.',
      'Notas mas biceps y antebrazo que espalda.',
      'Los hombros se quedan encogidos en la parte alta.',
    ],
    safety: [
      'Nada de tras nuca: exige una rotacion externa que muy pocos hombros toleran.',
      'Controla la subida. Dejar que el peso tire de ti estira pasivamente el hombro.',
    ],
    hypertrophy: [
      '10–15 repeticiones con pausa breve en la contraccion.',
      'Prueba agarre neutro si notas poco el dorsal: suele mejorar la conexion.',
    ],
    strength: [
      'Es un accesorio. Para fuerza de traccion vertical, progresa hacia dominadas lastradas.',
    ],
    warnings: ['Si el rodillo no sujeta bien, el peso te levantara del asiento.'],
    contraindications: ['Molestia de codo o de hombro con agarre pronado: cambia a neutro.'],
    lumbarAdaptation:
      'Manten la inclinacion del torso pequena y constante. Inclinarse mucho y volver en cada repeticion es lo que carga la lumbar en este ejercicio.',
  },

  dominadas: {
    authored: true,
    summary:
      'El mejor ejercicio de espalda que existe, y el que mas se estropea con impulso. Sal del colgado pasivo antes de tirar.',
    setup: [
      'Barra a una altura que te permita colgarte con los brazos extendidos sin tocar el suelo.',
      'Agarre pronado, ligeramente mas ancho que los hombros.',
      'Si no llegas a 5 repeticiones limpias, usa banda o maquina asistida.',
    ],
    startPosition: [
      'Colgado con los brazos extendidos.',
      'Baja los hombros para salir del colgado pasivo: la escapula debe estar activa antes de tirar.',
      'Piernas juntas, ligeramente adelantadas, gluteos y abdomen apretados.',
    ],
    execution: [
      'Deprime las escapulas: el cuerpo sube unos centimetros solo con eso.',
      'Tira llevando los codos hacia abajo y hacia las costillas.',
      'Sube hasta pasar la barbilla sin estirar el cuello.',
      'Baja en 2–3 segundos hasta la extension completa, sin dejarte caer.',
    ],
    breathing: 'Expulsa el aire durante el tiron, inspira en la bajada.',
    rangeOfMotion:
      'Extension completa abajo y barbilla por encima de la barra arriba. El rango completo es parte del ejercicio.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Balancear el cuerpo para generar impulso.',
      'Cortar el rango abajo y no llegar a extender.',
      'Estirar el cuello para pasar la barbilla en vez de subir el pecho.',
      'Encoger los hombros durante el tiron.',
    ],
    warningSigns: [
      'Las piernas empiezan a moverse para ayudar.',
      'El rango se acorta progresivamente dentro de la misma serie.',
      'Aparece dolor en la cara interna del codo.',
    ],
    safety: [
      'Sal siempre del colgado pasivo antes de tirar: el hombro colgando sin activacion escapular es vulnerable.',
      'Si notas el codo, prueba agarre neutro o supino.',
    ],
    hypertrophy: [
      '3–4 series de 6–12 repeticiones. Cuando pases de 12 limpias, lastra.',
      'Las negativas lentas de 5 segundos son la mejor progresion si aun no dominas una completa.',
    ],
    strength: [
      'Lastradas en series de 3–6 repeticiones con descansos largos.',
      'Progresa el lastre antes que las repeticiones.',
    ],
    warnings: ['Con epicondilitis o dolor de codo, evita el agarre pronado estricto.'],
    contraindications: ['Dolor de hombro al colgarse.'],
    lumbarAdaptation:
      'Carga lumbar baja, pero un balanceo grande la implica. Aprieta gluteos y abdomen para mantener el cuerpo rigido: ademas de proteger la espalda, mejora la traccion.',
  },

  'remo-barra': {
    authored: true,
    summary:
      'Construye grosor de espalda como pocos, pero mantener el torso inclinado bajo carga es exigente para la lumbar.',
    setup: [
      'Barra en el suelo, sobre el medio del pie.',
      'Agarre pronado a la anchura de los hombros o algo mas.',
      'Considera empezar cada repeticion desde el suelo si quieres reducir la fatiga lumbar acumulada.',
    ],
    startPosition: [
      'Bisagra de cadera hasta que el torso quede a unos 45 grados.',
      'Rodillas ligeramente flexionadas, peso repartido en el medio del pie.',
      'Espalda completamente neutra, mirada al suelo un metro por delante.',
      'Toma aire y aprieta el abdomen como si fueras a recibir un golpe.',
    ],
    execution: [
      'Tira llevando la barra hacia el ombligo o la parte baja del esternon.',
      'Inicia el movimiento juntando las escapulas, no doblando los codos.',
      'Manten el torso absolutamente quieto durante todo el recorrido.',
      'Baja controlado hasta la extension completa de los brazos.',
    ],
    breathing:
      'Aire dentro antes de cada repeticion, mantenlo durante el tiron y expulsa al bajar. No respires con el torso inclinado y sin presion abdominal.',
    rangeOfMotion:
      'Extension completa abajo, contacto o casi contacto con el abdomen arriba, siempre sin mover el torso.',
    tempo: '2-1-1-0',
    commonMistakes: [
      'Subir el torso en cada repeticion para ayudar con la cadera.',
      'Redondear la zona lumbar, sobre todo en las ultimas repeticiones.',
      'Tirar solo con los brazos sin mover las escapulas.',
      'Cargar tanto que el ejercicio se convierte en un tiron de cadera.',
    ],
    warningSigns: [
      'El torso sube y baja como un balancin.',
      'Notas la zona lumbar antes que la espalda alta.',
      'La barra ya no llega al abdomen y se queda a media altura.',
    ],
    safety: [
      'Deja la barra en el suelo entre series en lugar de aguantar la posicion inclinada.',
      'La fatiga de los erectores lumbares llega antes que la del dorsal: para la serie cuando la espalda empiece a moverse.',
    ],
    hypertrophy: [
      '8–12 repeticiones con torso firme. La calidad manda sobre el peso.',
      'Si buscas dorsal, tira hacia el ombligo. Si buscas espalda alta, hacia el esternon con los codos mas abiertos.',
    ],
    strength: ['5–8 repeticiones. Considera la version desde el suelo en cada repeticion.'],
    warnings: [
      'Este ejercicio tiene carga lumbar ALTA. Si tu zona baja esta sensible, no lo hagas hoy.',
    ],
    contraindications: [
      'Sensibilidad o dolor lumbar activo. Usa remo con pecho apoyado o remo en polea, y si el dolor persiste consultalo con un profesional sanitario.',
    ],
    lumbarAdaptation:
      'La alternativa directa es el remo con pecho apoyado en banco inclinado: mismo trabajo de espalda, carga lumbar practicamente nula. Si prefieres mantener el patron, reduce la carga y apoya la frente en un soporte.',
  },

  'remo-mancuerna': {
    authored: true,
    summary:
      'Un lado cada vez, con el torso apoyado: permite mas rango que la barra y descarga la espalda baja.',
    setup: [
      'Banco plano a la altura habitual.',
      'Mancuerna en el suelo, junto al banco.',
    ],
    startPosition: [
      'Apoya rodilla y mano del mismo lado sobre el banco.',
      'Torso paralelo al suelo, espalda neutra, cadera cuadrada.',
      'Brazo libre extendido con la mancuerna colgando y la escapula estirada.',
    ],
    execution: [
      'Empieza llevando la escapula hacia la columna.',
      'Sube el codo hacia la cadera, pegado al costado.',
      'Manten medio segundo arriba sin rotar el torso.',
      'Baja controlado hasta el estiramiento completo.',
    ],
    breathing: 'Expulsa el aire al traccionar, inspira al bajar.',
    rangeOfMotion:
      'Estiramiento completo abajo dejando que la escapula viaje, y codo por encima de la linea del torso arriba.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Rotar el torso para subir mas peso.',
      'Tirar hacia el hombro en vez de hacia la cadera.',
      'Perder la neutralidad de la espalda al buscar el estiramiento.',
    ],
    warningSigns: [
      'La cadera gira con cada repeticion.',
      'El brazo de apoyo se dobla y el torso se hunde.',
    ],
    safety: [
      'Coge y deja la mancuerna doblando las rodillas, nunca desde la espalda inclinada.',
      'Con un solo brazo puedes corregir asimetrias, pero tambien exagerarlas si compensas rotando.',
    ],
    hypertrophy: [
      '10–15 repeticiones por lado.',
      'Empieza siempre por el lado mas debil e iguala las repeticiones del otro.',
    ],
    strength: ['6–10 repeticiones por lado con carga alta y torso muy estable.'],
    warnings: ['La rotacion compensatoria del torso es el error que mas se repite aqui.'],
    contraindications: ['Dolor lumbar que aparece al inclinarse hacia delante.'],
    lumbarAdaptation:
      'Con los tres apoyos en el banco la carga lumbar ya es moderada-baja. Si aun molesta, pasa al remo con pecho apoyado, que elimina la posicion en bisagra por completo.',
  },

  'remo-polea': {
    authored: true,
    summary:
      'Tension constante y torso estable: la version mas amable de traccion horizontal para la espalda baja.',
    setup: [
      'Coloca un agarre neutro estrecho o una barra recta segun el enfasis que busques.',
      'Ajusta el apoyo de pies para poder extender las piernas casi por completo.',
    ],
    startPosition: [
      'Sentado con rodillas ligeramente flexionadas.',
      'Torso vertical o con una inclinacion minima hacia atras.',
      'Brazos extendidos dejando que la escapula se estire, pero sin redondear la columna.',
    ],
    execution: [
      'Tira llevando los codos hacia atras, pegados al torso.',
      'Junta las escapulas al final del recorrido.',
      'Manten un segundo la contraccion con el pecho alto.',
      'Vuelve controlado dejando que la escapula se estire.',
    ],
    breathing:
      'Expulsa al llevar el agarre al abdomen, inspira mientras la polea estira los brazos.',
    rangeOfMotion:
      'Estiramiento escapular completo delante y contraccion con los codos pasando la linea del torso.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Acompanar el peso redondeando la espalda en el estiramiento.',
      'Balancear el torso hacia atras y adelante como si remases de verdad.',
      'Encoger los hombros durante el tiron.',
    ],
    warningSigns: [
      'La columna se flexiona al ir hacia delante.',
      'El torso se inclina mas de 20 grados en cualquier direccion.',
    ],
    safety: [
      'Deja que viaje la escapula, no la columna. Es la distincion clave de este ejercicio.',
      'Suelta el agarre solo cuando el peso este apoyado.',
    ],
    hypertrophy: [
      '10–15 repeticiones con pausa en contraccion.',
      'El agarre neutro estrecho suele dar mejor conexion con el dorsal.',
    ],
    strength: ['8–10 repeticiones con torso rigido, sin usar la extension de piernas.'],
    warnings: ['La extension de piernas como impulso es trampa: el trabajo se va de la espalda.'],
    contraindications: ['Molestia lumbar al estirar hacia delante: reduce el rango anterior.'],
    lumbarAdaptation:
      'Manten el torso vertical y no busques el estiramiento maximo llevando el cuerpo hacia delante. Con esa correccion, es una de las mejores opciones de espalda con lumbar sensible.',
  },

  'pullover-polea': {
    authored: true,
    summary:
      'Aisla el dorsal sin implicar al biceps: brazos casi rectos y el movimiento nace del hombro.',
    setup: [
      'Polea alta con barra recta o cuerda.',
      'Situate a un paso de la torre para que el cable trabaje en diagonal.',
    ],
    startPosition: [
      'De pie con una ligera bisagra de cadera y el torso inclinado unos 20 grados.',
      'Brazos extendidos hacia arriba con una flexion minima y fija de codo.',
      'Abdomen firme y costillas abajo.',
    ],
    execution: [
      'Lleva la barra en arco hacia los muslos sin doblar los codos.',
      'Piensa en empujar el suelo con los antebrazos, no en tirar con las manos.',
      'Manten un segundo con el dorsal contraido.',
      'Vuelve controlado dejando que el hombro llegue al estiramiento completo.',
    ],
    breathing: 'Expulsa el aire durante el arco descendente, inspira al volver.',
    rangeOfMotion:
      'Desde flexion completa de hombro arriba hasta que las manos lleguen a los muslos.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Doblar los codos y convertirlo en una extension de triceps.',
      'Usar el torso como palanca subiendo y bajando.',
      'Cargar demasiado y perder el arco del movimiento.',
    ],
    warningSigns: [
      'El angulo del codo cambia durante la repeticion.',
      'El torso se endereza al bajar la barra.',
    ],
    safety: ['Carga moderada: el hombro trabaja en un rango largo y con poca ventaja mecanica.'],
    hypertrophy: [
      '12–20 repeticiones. Es un ejercicio de conexion, no de carga.',
      'Muy util como activacion antes del trabajo pesado de espalda.',
    ],
    strength: ['No aplica.'],
    warnings: ['Si notas el hombro en el estiramiento alto, reduce el rango superior.'],
    contraindications: ['Molestia de hombro en flexion completa.'],
    lumbarAdaptation:
      'La ligera bisagra puede notarse con lumbar sensible. Hazlo arrodillado sobre una colchoneta: se elimina la bisagra y el core estabiliza sin cargar la columna.',
  },

  /* ══════════════════════════════════════════════════════════════ HOMBRO ══ */

  'press-militar': {
    authored: true,
    summary:
      'Empuje vertical estricto. El reto real no es el hombro: es no arquear la lumbar para ganar recorrido.',
    setup: [
      'Barra en el rack a la altura de la clavicula.',
      'Agarre justo por fuera de los hombros, munecas rectas.',
    ],
    startPosition: [
      'Barra apoyada en los deltoides frontales, codos ligeramente por delante.',
      'Pies a la anchura de las caderas.',
      'Gluteos y abdomen apretados, costillas hacia abajo.',
    ],
    execution: [
      'Toma aire y presuriza el abdomen.',
      'Echa la cabeza ligeramente hacia atras para dejar pasar la barra.',
      'Empuja en linea recta hacia arriba.',
      'Al pasar la frente, mete la cabeza de nuevo bajo la barra.',
      'Termina con la barra sobre la linea de las orejas, no por delante.',
    ],
    breathing: 'Aire dentro abajo, mantenlo durante el empuje y expulsa arriba.',
    rangeOfMotion:
      'Desde los deltoides hasta la extension completa de codos con la barra sobre el centro de gravedad.',
    tempo: '2-0-1-0',
    commonMistakes: [
      'Arquear la lumbar para convertirlo en un press inclinado de pie.',
      'Empujar hacia delante y terminar con la barra por delante de la cara.',
      'No meter la cabeza al pasar la barra.',
    ],
    warningSigns: [
      'Las costillas se abren y la lumbar se arquea.',
      'Aparece impulso de piernas sin que lo busques.',
      'Los ultimos centimetros se completan echando el torso atras.',
    ],
    safety: [
      'Trabaja en rack con seguros o empieza con cargas que puedas dejar caer al pecho con control.',
      'Si la movilidad de hombro no te permite la posicion final sobre las orejas, no fuerces: usa mancuernas.',
    ],
    hypertrophy: ['6–10 repeticiones con control total del descenso.'],
    strength: [
      '3–6 repeticiones. La rigidez del torso es lo que limita el peso, no el hombro.',
      'Practica la presion abdominal: aqui vale tanto como en la sentadilla.',
    ],
    warnings: [
      'Este ejercicio tiene carga lumbar MODERADA precisamente por la tendencia a arquear.',
    ],
    contraindications: ['Molestia de hombro en flexion por encima de la cabeza.'],
    lumbarAdaptation:
      'La version sentado con respaldo elimina casi toda la exigencia lumbar sin perder el estimulo del hombro. Es el primer cambio a hacer si la zona baja esta sensible.',
  },

  'press-hombro-mancuerna': {
    authored: true,
    summary:
      'Trayectoria libre y agarre adaptable: suele ser mas comodo para el hombro que la barra.',
    setup: [
      'Banco con respaldo casi vertical, o de pie si controlas bien el core.',
      'Mancuernas que puedas colocar tu solo desde los muslos.',
    ],
    startPosition: [
      'Sentado con la espalda apoyada y los pies planos.',
      'Mancuernas a la altura de las orejas, palmas hacia delante o ligeramente giradas.',
      'Codos algo por delante del plano del torso, no completamente abiertos.',
    ],
    execution: [
      'Empuja hacia arriba describiendo un arco leve hacia dentro.',
      'No llegues a chocar las mancuernas arriba.',
      'Baja controlado hasta que los codos queden a la altura de los hombros o algo mas abajo.',
    ],
    breathing: 'Inspira al bajar, expulsa el aire durante el empuje.',
    rangeOfMotion:
      'Hasta que los codos bajen a la altura de los hombros. Mas profundidad no anade estimulo y si estres articular.',
    tempo: '3-0-1-0',
    commonMistakes: [
      'Abrir los codos completamente en linea con el torso.',
      'Bajar demasiado buscando rango.',
      'Arquear la lumbar en la version de pie.',
    ],
    warningSigns: [
      'Una mancuerna se retrasa respecto a la otra.',
      'La espalda se separa del respaldo.',
    ],
    safety: [
      'Sube las mancuernas impulsando con las rodillas.',
      'Al terminar, bajalas a los muslos antes de incorporarte.',
    ],
    hypertrophy: ['8–12 repeticiones con bajada controlada.'],
    strength: ['6–8 repeticiones. La estabilizacion limita la carga frente a la barra.'],
    warnings: ['Con carga alta, pide ayuda para colocar las mancuernas en posicion.'],
    contraindications: ['Dolor de hombro en el rango superior.'],
    lumbarAdaptation:
      'Hazlo siempre sentado con respaldo. Es la version de empuje vertical mas segura para una espalda baja sensible.',
  },

  'elevaciones-laterales': {
    authored: true,
    summary:
      'El deltoide medio responde al volumen y a la tension, no al peso. Si necesitas impulso, pesa demasiado.',
    setup: [
      'Mancuernas ligeras. Mas ligeras de lo que crees.',
      'De pie o sentado, con espacio libre a los lados.',
    ],
    startPosition: [
      'Brazos a los lados con una flexion de codo de unos 10 grados, fija.',
      'Hombros abajo, lejos de las orejas.',
      'Torso ligeramente inclinado hacia delante, apenas perceptible.',
    ],
    execution: [
      'Sube los brazos hacia los lados guiando con el codo, no con la mano.',
      'Detente cuando el brazo llegue a la altura del hombro.',
      'Manten un instante arriba sin encoger el trapecio.',
      'Baja en 3 segundos resistiendo el peso.',
    ],
    breathing:
      'Expulsa al abrir los brazos, inspira al bajarlos. Son series largas: no aguantes el aire.',
    rangeOfMotion:
      'Desde los muslos hasta la horizontal. Subir por encima del hombro pasa el trabajo al trapecio.',
    tempo: '3-1-1-0 · la bajada lenta es la mitad util del ejercicio',
    commonMistakes: [
      'Balancear el torso para lanzar el peso.',
      'Subir por encima de la horizontal.',
      'Encoger los hombros hacia las orejas.',
      'Guiar con la mano en vez de con el codo.',
    ],
    warningSigns: [
      'Las rodillas se flexionan para dar impulso.',
      'Los trapecios se marcan mas que los deltoides.',
      'Las mancuernas caen sin control en la bajada.',
    ],
    safety: ['Carga ligera. Es un musculo pequeno con un brazo de palanca muy largo.'],
    hypertrophy: [
      '12–20 repeticiones, 3–5 series por sesion.',
      'Es de los pocos musculos que tolera y agradece frecuencia alta.',
      'Las series descendentes funcionan muy bien aqui.',
    ],
    strength: ['No aplica: no es un ejercicio de fuerza.'],
    warnings: ['Si notas pinzamiento en la parte alta del rango, para a 80 grados.'],
    contraindications: ['Dolor de hombro en abduccion.'],
  },

  pajaro: {
    authored: true,
    summary:
      'Deltoide posterior: el musculo mas olvidado y el que mas equilibra un hombro dominado por el empuje.',
    setup: [
      'Mancuernas ligeras o un banco inclinado a 30 grados para apoyar el pecho.',
      'Si lo haces de pie, valora la version con pecho apoyado para descargar la lumbar.',
    ],
    startPosition: [
      'Torso inclinado hacia delante, casi paralelo al suelo.',
      'Brazos colgando con flexion minima y fija de codo.',
      'Espalda neutra, mirada al suelo.',
    ],
    execution: [
      'Abre los brazos hacia los lados describiendo un arco.',
      'Piensa en separar las manos, no en juntar las escapulas.',
      'Detente a la altura de los hombros.',
      'Baja controlado sin dejar caer el peso.',
    ],
    breathing: 'Expulsa el aire al abrir, inspira al volver.',
    rangeOfMotion: 'Hasta la horizontal de los hombros, sin pasar de ahi.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Convertirlo en un remo juntando las escapulas.',
      'Usar impulso del torso subiendo y bajando.',
      'Doblar los codos para mover mas peso.',
    ],
    warningSigns: [
      'El torso se endereza en cada repeticion.',
      'Notas mas romboides y trapecio que deltoide posterior.',
    ],
    safety: ['Carga muy ligera. Aqui el ego es el peor enemigo de la tecnica.'],
    hypertrophy: [
      '15–20 repeticiones con pausa en contraccion.',
      'Combina bien con las elevaciones laterales en la misma sesion.',
    ],
    strength: ['No aplica.'],
    warnings: ['La version de pie inclinado carga la lumbar mas de lo que parece.'],
    contraindications: ['Dolor lumbar al mantener la inclinacion.'],
    lumbarAdaptation:
      'Apoya el pecho en un banco inclinado a 30 grados. Elimina por completo la exigencia lumbar y ademas mejora el aislamiento del deltoide posterior.',
  },

  'face-pull': {
    authored: true,
    summary:
      'Salud de hombro en un solo ejercicio: rotacion externa y trabajo escapular con carga ligera.',
    setup: [
      'Cuerda en la polea a la altura de la cara o algo mas arriba.',
      'Agarra los extremos con los pulgares hacia atras.',
    ],
    startPosition: [
      'Un pie adelantado, torso firme.',
      'Brazos extendidos al frente a la altura de los ojos.',
      'Hombros abajo y costillas cerradas.',
    ],
    execution: [
      'Tira de la cuerda hacia la frente separando las manos.',
      'Termina con los antebrazos verticales y las manos por fuera de las orejas.',
      'Junta las escapulas sin encoger los hombros.',
      'Vuelve controlado a la extension completa.',
    ],
    breathing:
      'Expulsa al separar la cuerda frente a la cara, inspira al dejar que los brazos vuelvan.',
    rangeOfMotion:
      'Desde brazos extendidos hasta la posicion de doble biceps con los antebrazos verticales.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Cargar demasiado y convertirlo en un remo alto.',
      'No rotar los antebrazos hacia arriba al final.',
      'Encoger los hombros durante el tiron.',
    ],
    warningSigns: [
      'El torso se echa hacia atras para contrarrestar el peso.',
      'Los codos quedan por debajo de las manos al final.',
    ],
    safety: [
      'Es un ejercicio preventivo: la carga alta lo desvirtua por completo.',
      'Muy util como calentamiento antes de cualquier sesion de empuje.',
    ],
    hypertrophy: ['15–20 repeticiones. El objetivo es calidad de movimiento, no tamano.'],
    strength: ['No aplica.'],
    warnings: ['Si no puedes terminar con los antebrazos verticales, baja el peso.'],
    contraindications: [
      'Con carga ligera no hay contraindicaciones destacables. Si aparece dolor de hombro, reduce el rango antes que el peso.',
    ],
  },

  /* ══════════════════════════════════════════════════════════════ BICEPS ══ */

  'curl-barra': {
    authored: true,
    summary: 'Codos pegados al torso y quietos: si se adelantan, el biceps deja de trabajar.',
    setup: [
      'Barra recta para maximo estimulo, barra Z si notas las munecas.',
      'Agarre supino a la anchura de los hombros.',
    ],
    startPosition: [
      'De pie con los pies a la anchura de las caderas.',
      'Brazos extendidos, barra apoyada en los muslos.',
      'Codos pegados al torso, hombros abajo, abdomen firme.',
    ],
    execution: [
      'Flexiona los codos subiendo la barra en arco.',
      'Manten los codos en el sitio: no deben adelantarse.',
      'Sube hasta que el antebrazo pase la vertical y aprieta un instante.',
      'Baja en 3 segundos hasta la extension completa.',
    ],
    breathing:
      'Expulsa al flexionar los codos, inspira mientras la barra baja hasta los muslos.',
    rangeOfMotion:
      'Extension completa abajo y flexion maxima arriba sin adelantar el codo.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Balancear el torso hacia atras para arrancar el peso.',
      'Adelantar los codos, convirtiendo el final en una elevacion frontal.',
      'No extender del todo abajo.',
    ],
    warningSigns: [
      'La lumbar se arquea al iniciar la subida.',
      'Los hombros se adelantan.',
      'Solo se completa el rango con impulso.',
    ],
    safety: [
      'Si notas las munecas con barra recta, cambia a barra Z: el agarre semipronado las alinea mejor.',
    ],
    hypertrophy: [
      '8–12 repeticiones con bajada de 3 segundos.',
      'La extension completa abajo es donde el biceps recibe mas estimulo por estiramiento.',
    ],
    strength: ['6–8 repeticiones estrictas. El curl no es un ejercicio de fuerza maxima.'],
    warnings: ['El balanceo lumbar para subir el peso es el error mas comun y el mas costoso.'],
    contraindications: [
      'Molestia en la cara interna del codo o tendinitis del biceps distal. Si no cede al bajar la carga, consulta con un profesional sanitario.',
    ],
    lumbarAdaptation:
      'Apoya la espalda contra una pared durante toda la serie. Elimina el balanceo, protege la lumbar y ademas hace el ejercicio mas estricto.',
  },

  'curl-inclinado': {
    authored: true,
    summary:
      'El brazo queda por detras del torso: es la posicion de maximo estiramiento del biceps y la que mas cuesta.',
    setup: [
      'Banco inclinado a 45–60 grados.',
      'Mancuernas mas ligeras de lo que usarias de pie.',
    ],
    startPosition: [
      'Sentado con la espalda apoyada y la cabeza en el respaldo.',
      'Brazos colgando completamente, perpendiculares al suelo.',
      'Palmas hacia delante, hombros relajados hacia abajo.',
    ],
    execution: [
      'Flexiona los codos sin moverlos de su sitio.',
      'Sube hasta la contraccion completa.',
      'Baja muy despacio hasta la extension total, sintiendo el estiramiento.',
    ],
    breathing: 'Expulsa el aire al subir, inspira durante la bajada.',
    rangeOfMotion:
      'Extension completa con el brazo colgando por detras del torso. Ese estiramiento es todo el sentido del ejercicio.',
    tempo: '4-0-1-1 · excentrica muy lenta',
    commonMistakes: [
      'Adelantar los hombros al bajar para reducir el estiramiento.',
      'Cargar demasiado y no llegar a extender.',
      'Despegar la espalda del respaldo.',
    ],
    warningSigns: [
      'El hombro se adelanta en la parte baja.',
      'Aparece molestia en la cara anterior del hombro.',
    ],
    safety: [
      'Entra en el estiramiento de forma progresiva las primeras sesiones.',
      'El biceps es muy susceptible a agujetas en esta posicion.',
    ],
    hypertrophy: [
      '10–12 repeticiones con excentrica de 4 segundos.',
      'Es de los mejores ejercicios para la cabeza larga del biceps.',
    ],
    strength: ['No aplica.'],
    warnings: ['Si notas tiron en el hombro al extender, reduce la inclinacion del banco.'],
    contraindications: ['Molestia en el tendon largo del biceps.'],
    lumbarAdaptation:
      'Con el banco inclinado la espalda queda totalmente apoyada. Es una opcion excelente para dias con lumbar sensible.',
  },

  'curl-martillo': {
    authored: true,
    summary:
      'Agarre neutro: trabaja el braquial y el braquiorradial, que empujan el biceps hacia arriba y ensanchan el brazo.',
    setup: ['Mancuernas y espacio para mantener los brazos a los lados.'],
    startPosition: [
      'De pie, brazos extendidos a los lados.',
      'Palmas enfrentadas, pulgares hacia delante.',
      'Codos pegados al torso, hombros abajo.',
    ],
    execution: [
      'Sube manteniendo el agarre neutro durante todo el recorrido.',
      'No gires la muneca en ningun momento.',
      'Aprieta arriba un instante y baja controlado.',
      'Puedes alternar brazos o subir ambos a la vez.',
    ],
    breathing:
      'Expulsa al subir con el pulgar arriba, inspira mientras la mancuerna vuelve al costado.',
    rangeOfMotion:
      'Extension completa abajo y antebrazo pasando la vertical arriba, con el pulgar siempre apuntando al techo.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Rotar la muneca durante la subida.',
      'Balancear el torso.',
      'Adelantar los codos.',
    ],
    warningSigns: ['El agarre gira hacia supinacion.', 'Los hombros se adelantan al subir.'],
    safety: ['El agarre neutro suele ser el mas amable con el codo: buena opcion si otros curls molestan.'],
    hypertrophy: [
      '10–15 repeticiones.',
      'Combina bien con el curl con barra en la misma sesion: trabajan musculos distintos.',
    ],
    strength: ['8–10 repeticiones. El agarre neutro permite algo mas de carga que el supino.'],
    warnings: ['Sin riesgos destacables mientras la carga permita controlar la bajada.'],
    contraindications: ['Dolor de codo persistente.'],
    lumbarAdaptation: 'Hazlo sentado en un banco con respaldo para eliminar el balanceo.',
  },

  'curl-predicador': {
    authored: true,
    summary:
      'El apoyo elimina el impulso por completo: es el curl mas estricto y el que mas castiga el estiramiento.',
    setup: [
      'Ajusta el asiento hasta que la axila descanse sobre el borde superior del apoyo.',
      'Barra Z o mancuerna, con carga conservadora.',
    ],
    startPosition: [
      'Brazos completamente apoyados en el respaldo inclinado.',
      'Axilas en contacto con la parte alta del apoyo.',
      'Brazos extendidos pero sin bloquear el codo del todo.',
    ],
    execution: [
      'Flexiona los codos subiendo la barra hasta la contraccion.',
      'Manten un segundo arriba.',
      'Baja en 3 segundos controlando hasta casi la extension completa.',
      'No bloquees el codo abajo: el biceps queda muy expuesto en esa posicion.',
    ],
    breathing:
      'Expulsa al flexionar, inspira durante la bajada: es la fase que mas hay que controlar aqui.',
    rangeOfMotion:
      'Desde casi extension completa hasta la flexion maxima. La parte baja es la mas exigente.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Bloquear el codo abajo y dejar caer el peso.',
      'Despegar las axilas del apoyo.',
      'Cargar en exceso y usar el torso.',
    ],
    warningSigns: [
      'Los gluteos se despegan del asiento.',
      'La bajada deja de ser controlada.',
    ],
    safety: [
      'Nunca sueltes la barra desde la posicion baja con el brazo extendido: pide que te la recojan o bajala con las dos manos.',
      'La extension completa bajo carga en esta posicion es donde ocurren la mayoria de las lesiones de biceps distal.',
    ],
    hypertrophy: ['10–12 repeticiones estrictas con excentrica controlada.'],
    strength: ['No aplica.'],
    warnings: ['Carga conservadora. La posicion no perdona el ego.'],
    contraindications: ['Molestia en el tendon distal del biceps o en el codo.'],
    lumbarAdaptation:
      'Sentado y con el torso apoyado, la carga lumbar es practicamente nula.',
  },

  'curl-polea': {
    authored: true,
    summary:
      'Tension constante de principio a fin: la polea no descarga arriba como hace la mancuerna.',
    setup: [
      'Polea baja con barra recta, Z o cuerda.',
      'Situate a un paso de la torre.',
    ],
    startPosition: [
      'De pie con los pies a la anchura de las caderas.',
      'Brazos extendidos con el cable ya en tension.',
      'Codos pegados al torso.',
    ],
    execution: [
      'Flexiona los codos sin moverlos de sitio.',
      'Sube hasta la contraccion completa.',
      'Baja resistiendo la tension del cable hasta la extension total.',
    ],
    breathing:
      'Expulsa al cerrar el codo, inspira mientras la polea tira del brazo hacia la extension.',
    rangeOfMotion: 'Extension completa abajo, flexion maxima arriba, siempre con tension.',
    tempo: '3-1-1-1',
    commonMistakes: [
      'Situarse demasiado cerca de la torre y perder tension abajo.',
      'Inclinar el torso para ayudar.',
      'Adelantar los codos al final.',
    ],
    warningSigns: ['El cable se destensa en algun punto.', 'El torso se balancea.'],
    safety: ['Vuelve siempre con control: el cable tira de forma continua.'],
    hypertrophy: [
      '12–15 repeticiones.',
      'Excelente como ultimo ejercicio de brazo, cuando la tension constante ya no perdona.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Dolor de codo.'],
    lumbarAdaptation: 'Hazlo sentado o con la espalda apoyada para evitar cualquier balanceo.',
  },

  /* ═════════════════════════════════════════════════════════════ TRICEPS ══ */

  'extension-polea': {
    authored: true,
    summary:
      'Codos fijos junto al torso: todo el movimiento ocurre en el antebrazo, nada en el hombro.',
    setup: [
      'Polea alta con barra recta, Z o cuerda.',
      'La cuerda permite separar las manos al final y contraer mas.',
    ],
    startPosition: [
      'De pie frente a la torre, un pie ligeramente adelantado.',
      'Codos pegados a los costados, antebrazos paralelos al suelo.',
      'Torso ligeramente inclinado, abdomen firme.',
    ],
    execution: [
      'Extiende los codos empujando hacia abajo.',
      'Con cuerda, separa las manos al final del recorrido.',
      'Aprieta el triceps un instante en extension completa.',
      'Vuelve controlado hasta que el antebrazo quede paralelo al suelo, sin dejar que el codo se mueva.',
    ],
    breathing: 'Expulsa el aire al extender, inspira al volver.',
    rangeOfMotion:
      'Desde antebrazo paralelo al suelo hasta extension completa del codo.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Separar los codos del torso.',
      'Inclinar el cuerpo sobre la barra para empujar con el peso corporal.',
      'Subir demasiado el antebrazo y perder la tension.',
    ],
    warningSigns: [
      'Los codos viajan hacia delante o hacia los lados.',
      'El torso sube y baja con cada repeticion.',
    ],
    safety: ['Carga moderada: si necesitas el peso corporal para empujar, pesa demasiado.'],
    hypertrophy: [
      '12–15 repeticiones con pausa en extension.',
      'La cuerda mejora la contraccion final; la barra permite mas carga.',
    ],
    strength: ['No aplica: para fuerza de triceps usa press cerrado.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia de codo que no cede al bajar la carga.'],
    lumbarAdaptation:
      'Manten el torso alto y evita inclinarte sobre la barra. Con esa correccion la carga lumbar es minima.',
  },

  'press-frances': {
    authored: true,
    summary:
      'Estira la cabeza larga del triceps como ningun otro. Tambien es el que mas castiga el codo si te pasas.',
    setup: [
      'Barra Z, que alinea mejor las munecas que la recta.',
      'Banco plano y carga conservadora.',
    ],
    startPosition: [
      'Tumbado con los pies firmes en el suelo.',
      'Brazos extendidos con la barra sobre la linea de los hombros, no de la cara.',
      'Codos ligeramente inclinados hacia atras.',
    ],
    execution: [
      'Flexiona los codos bajando la barra hacia la frente o algo por detras de la cabeza.',
      'Manten los brazos en el mismo angulo: solo se mueve el antebrazo.',
      'Baja hasta notar estiramiento en el triceps.',
      'Extiende sin bloquear de golpe.',
    ],
    breathing:
      'Inspira mientras la barra baja hacia la frente, expulsa al extender los codos.',
    rangeOfMotion:
      'Hasta el estiramiento comodo del triceps. Llevar la barra por detras de la cabeza aumenta el estiramiento pero tambien la exigencia del hombro.',
    tempo: '3-0-1-0',
    commonMistakes: [
      'Abrir los codos hacia los lados al bajar.',
      'Convertirlo en un press cerrado moviendo el hombro.',
      'Cargar demasiado y no controlar la bajada.',
    ],
    warningSigns: [
      'Los codos se separan progresivamente.',
      'Aparece dolor puntual en la punta del codo.',
    ],
    safety: [
      'Si notas el codo, cambia a extension en polea o sobre la cabeza con mancuerna.',
      'Nunca lo hagas al fallo con barra sobre la cara sin companero.',
    ],
    hypertrophy: ['10–12 repeticiones con excentrica controlada.'],
    strength: ['No es la mejor herramienta. Usa press cerrado para fuerza de triceps.'],
    warnings: [
      'Es el ejercicio de triceps con mas incidencia de molestias de codo. Carga con cabeza.',
    ],
    contraindications: [
      'Tendinitis o dolor en la insercion del triceps. Si persiste tras reducir carga y rango, consulta con un profesional sanitario.',
    ],
    lumbarAdaptation: 'Tumbado, la carga lumbar es nula. Apoya los pies en el banco si arqueas.',
  },

  'extension-sobre-cabeza': {
    authored: true,
    summary:
      'Con el brazo por encima de la cabeza, la cabeza larga del triceps trabaja en su maximo estiramiento.',
    setup: [
      'Una mancuerna sujeta con ambas manos, o polea baja con cuerda.',
      'Banco con respaldo vertical si quieres eliminar el trabajo del core.',
    ],
    startPosition: [
      'Sentado o de pie con el abdomen firme y las costillas abajo.',
      'Peso sostenido por encima de la cabeza con los brazos extendidos.',
      'Codos apuntando hacia delante, cerca de las orejas.',
    ],
    execution: [
      'Flexiona los codos bajando el peso por detras de la cabeza.',
      'Manten los codos apuntando al frente durante todo el recorrido.',
      'Baja hasta notar estiramiento claro en el triceps.',
      'Extiende hasta arriba sin bloquear de golpe.',
    ],
    breathing:
      'Inspira mientras el peso baja por detras de la cabeza, expulsa al extender arriba.',
    rangeOfMotion: 'Estiramiento completo por detras de la cabeza hasta extension total arriba.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Abrir los codos hacia los lados.',
      'Arquear la lumbar para compensar la posicion del brazo.',
      'Bajar demasiado rapido y perder el control en el estiramiento.',
    ],
    warningSigns: [
      'Las costillas se abren y la lumbar se arquea.',
      'Los codos se van hacia fuera.',
    ],
    safety: [
      'Sujeta la mancuerna por el disco superior con ambas manos, no por el mango.',
      'Si tienes poca movilidad de hombro, hazlo en polea con cuerda.',
    ],
    hypertrophy: [
      '10–15 repeticiones con enfasis en el estiramiento.',
      'Complementa muy bien a la extension en polea, que trabaja el rango contrario.',
    ],
    strength: ['No aplica.'],
    warnings: ['La posicion sobre la cabeza invita a arquear la lumbar: vigila las costillas.'],
    contraindications: ['Molestia de hombro en flexion completa.'],
    lumbarAdaptation:
      'Hazlo sentado con respaldo vertical y la espalda pegada. Elimina el arqueo compensatorio, que es la unica via por la que este ejercicio carga la lumbar.',
  },

  'fondos-banco': {
    authored: true,
    summary:
      'Accesible y efectivo, pero la posicion del hombro no perdona: no bajes mas de lo necesario.',
    setup: [
      'Un banco estable a la espalda.',
      'Piernas estiradas para mas dificultad, flexionadas para menos.',
    ],
    startPosition: [
      'Manos en el borde del banco a la anchura de las caderas, dedos hacia delante.',
      'Gluteos justo delante del banco, brazos extendidos.',
      'Pecho alto, hombros abajo.',
    ],
    execution: [
      'Baja flexionando los codos hacia atras, no hacia los lados.',
      'Para cuando el brazo llegue a unos 90 grados.',
      'Empuja con las palmas hasta extender los codos.',
      'Manten el cuerpo cerca del banco durante todo el recorrido.',
    ],
    breathing:
      'Inspira al bajar y expulsa al empujar. Al tener el hombro en rotacion interna, una respiracion tranquila ayuda a no encoger los trapecios.',
    rangeOfMotion: 'Hasta 90 grados de codo. Bajar mas fuerza la rotacion interna del hombro.',
    tempo: '2-0-1-0',
    commonMistakes: [
      'Bajar en exceso buscando profundidad.',
      'Separarse del banco y convertirlo en un movimiento de hombro.',
      'Abrir los codos hacia los lados.',
    ],
    warningSigns: [
      'Los hombros se adelantan y suben hacia las orejas.',
      'Aparece molestia en la parte frontal del hombro.',
    ],
    safety: [
      'Es de los ejercicios que mas comprometen la articulacion del hombro cuando se hace mal.',
      'Si notas cualquier pinzamiento, cambia a extension en polea.',
    ],
    hypertrophy: ['12–20 repeticiones. Anade peso en los muslos cuando sea facil.'],
    strength: ['No aplica.'],
    warnings: ['No es un buen ejercicio para hombros con historial de problemas.'],
    contraindications: ['Dolor anterior de hombro.'],
    lumbarAdaptation: 'Carga lumbar practicamente nula. Manten el abdomen firme y listo.',
  },
};
