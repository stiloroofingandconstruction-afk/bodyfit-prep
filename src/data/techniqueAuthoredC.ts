/**
 * Tecnica escrita a mano — tren superior, segundo bloque.
 *
 * Contenido original redactado para esta aplicacion a partir de principios
 * biomecanicos generales. No reproduce ni adapta material de terceros.
 *
 * Criterio de redaccion:
 *  - Nada de afirmaciones medicas ni absolutas ("cura", "previene", "siempre").
 *  - Hipertrofia, fuerza y tecnica general son secciones separadas y coherentes.
 *  - Toda contraindicacion remite a un profesional, no diagnostica.
 */
import type { ExerciseTechnique } from '@bodyfit/domain/types';

type T = ExerciseTechnique;

export const AUTHORED_UPPER_2: Record<string, T> = {
  /* ═══════════════════════════════════════════════════════════════ PECHO ══ */

  'press-inclinado-barra': {
    authored: true,
    summary:
      'Inclinacion de 30 grados y barra a la clavicula: mas de 45 grados y el trabajo se marcha al deltoides anterior.',
    setup: [
      'Ajusta el banco a 30 grados. Si el banco solo tiene posiciones fijas, elige la mas baja por encima del plano.',
      'Coloca los seguros a la altura del punto mas bajo del recorrido.',
      'Agarre ligeramente mas estrecho que en press plano.',
    ],
    startPosition: [
      'Escapulas juntas y hundidas contra el respaldo.',
      'Pies planos en el suelo, gluteos pegados al banco.',
      'Barra sobre la linea de los hombros tras sacarla del soporte.',
    ],
    execution: [
      'Baja hacia la parte alta del pecho, cerca de la clavicula.',
      'Codos a unos 45 grados del torso, no abiertos del todo.',
      'Roza el pecho sin apoyar el peso y empuja en linea ligeramente diagonal.',
      'Termina sin bloquear los codos de golpe.',
    ],
    breathing: 'Inspira arriba, manten el aire durante la bajada y expulsa al superar el punto dificil.',
    rangeOfMotion:
      'Hasta rozar la parte alta del pecho. Si el hombro molesta antes, para donde el hombro este comodo.',
    tempo: '3-0-1-0',
    commonMistakes: [
      'Inclinacion excesiva del banco, que convierte el ejercicio en un press de hombro.',
      'Bajar la barra al esternon en lugar de a la clavicula.',
      'Despegar los gluteos para generar impulso.',
    ],
    warningSigns: [
      'Notas el deltoides anterior antes que el pectoral.',
      'La barra sube en diagonal marcada hacia los pies.',
      'Los hombros se adelantan al tocar.',
    ],
    safety: [
      'Trabaja con seguros o companero: en inclinado la barra cae mas cerca del cuello.',
      'No uses agarre con el pulgar suelto.',
    ],
    hypertrophy: [
      '6–12 repeticiones con bajada de 3 segundos.',
      'Enfatiza la porcion clavicular del pectoral, la que suele quedarse corta con solo press plano.',
    ],
    strength: [
      '4–6 repeticiones. Moveras menos peso que en plano: es normal y no indica nada malo.',
    ],
    warnings: ['Con la barra sobre el cuello en inclinado, el margen de error es menor que en plano.'],
    contraindications: ['Molestia de hombro en el rango alto: consulta con un profesional si persiste.'],
    lumbarAdaptation:
      'El respaldo inclinado ya sostiene la espalda. Si aun notas la zona lumbar, apoya los pies en un step para reducir el arco.',
  },

  'press-banca-mancuerna': {
    authored: true,
    summary:
      'Mas rango y trayectoria libre que la barra: cada hombro busca su propio camino, que suele ser el mas comodo.',
    setup: [
      'Banco plano y mancuernas que puedas colocar tu solo desde los muslos.',
      'Si vas pesado, pide que te las acerquen a la posicion inicial.',
    ],
    startPosition: [
      'Sentado en el borde, mancuernas verticales sobre los muslos.',
      'Impulsa con la rodilla mientras te tumbas, una y luego la otra.',
      'Escapulas juntas, mancuernas sobre la linea del pecho, palmas al frente.',
    ],
    execution: [
      'Baja controlado con los codos a unos 45 grados del torso.',
      'Desciende hasta que las manos queden a la altura del pecho o algo por debajo.',
      'Empuja hacia arriba y ligeramente hacia dentro, sin llegar a chocar.',
      'Manten media flexion de codo arriba para no perder tension.',
    ],
    breathing:
      'Inspira al bajar. Al no haber barra que fije las manos, expulsar el aire durante el empuje ayuda a mantener las escapulas juntas.',
    rangeOfMotion:
      'Mas profundo que con barra: aprovecha ese rango extra sin forzar el hombro por debajo de lo comodo.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Chocar las mancuernas arriba y perder toda la tension.',
      'Dejar caer los codos muy por detras del torso.',
      'Subir las mancuernas a pulso desde el suelo en vez de con las rodillas.',
    ],
    warningSigns: [
      'Una mancuerna se retrasa respecto a la otra de forma constante.',
      'Las munecas se doblan hacia atras bajo el peso.',
    ],
    safety: [
      'Al terminar, lleva las mancuernas a los muslos y usa el impulso para incorporarte.',
      'Nunca las sueltes desde arriba: el hombro queda en una posicion muy expuesta.',
    ],
    hypertrophy: [
      '8–12 repeticiones con pausa breve en el estiramiento.',
      'La estabilizacion extra suele traducirse en mas trabajo del pectoral por kilo movido.',
    ],
    strength: [
      'Util como accesorio, pero la estabilizacion limita la carga frente a la barra.',
    ],
    warnings: ['Con cargas altas, colocarlas y soltarlas es el momento de mas riesgo.'],
    contraindications: ['Inestabilidad de hombro conocida sin valoracion previa.'],
    lumbarAdaptation:
      'Apoya los pies sobre un step o el propio banco: reduce el arco lumbar a cambio de algo de estabilidad.',
  },

  'press-declinado': {
    authored: true,
    summary:
      'La inclinacion negativa acorta el recorrido y suele resultar mas comoda para el hombro que el press plano.',
    setup: [
      'Banco declinado con sujecion firme para las piernas.',
      'Comprueba la sujecion antes de tumbarte del todo.',
    ],
    startPosition: [
      'Piernas bien fijadas bajo los rodillos.',
      'Escapulas juntas, agarre similar al de press plano.',
      'Barra sobre la parte baja del pecho tras sacarla del soporte.',
    ],
    execution: [
      'Baja hacia la parte baja del pectoral.',
      'Codos algo mas cerrados que en plano.',
      'Empuja en linea recta hacia arriba.',
    ],
    breathing:
      'Inspira al bajar y expulsa al empujar. En declinado no aguantes el aire mucho tiempo: la posicion invertida ya aumenta la presion en la cabeza.',
    rangeOfMotion: 'Recorrido algo mas corto que en plano por la posicion del torso.',
    tempo: '2-1-1-0',
    commonMistakes: [
      'Empezar sin comprobar la sujecion de las piernas.',
      'Incorporarse de golpe al terminar la serie.',
    ],
    warningSigns: [
      'Notas presion en la cabeza por la posicion invertida.',
      'Las piernas se deslizan de los rodillos.',
    ],
    safety: [
      'Necesitas companero: en declinado no puedes salir tu solo si fallas.',
      'Incorporate despacio al terminar; la posicion invertida puede marear.',
    ],
    hypertrophy: ['8–12 repeticiones. Enfatiza la porcion esternocostal del pectoral.'],
    strength: ['Permite algo mas de carga que el plano por el recorrido mas corto.'],
    warnings: ['Si notas mareo o presion en la cabeza, sal de la posicion y descansa.'],
    contraindications: ['Reflujo o problemas de presion: consulta con un profesional sanitario.'],
    lumbarAdaptation: 'Con las piernas fijadas y el torso apoyado, la carga lumbar es baja.',
  },

  'press-banca-pausa': {
    authored: true,
    summary:
      'Una pausa real de dos segundos elimina el rebote y te obliga a generar fuerza desde cero.',
    setup: [
      'Igual que el press de banca, con seguros a la altura del pecho.',
      'Carga entre un 10 y un 15% menor que en la version normal.',
    ],
    startPosition: [
      'Escapulas juntas y hundidas, pies firmes.',
      'Barra sobre la linea de los hombros, abdomen presurizado.',
    ],
    execution: [
      'Baja controlado hasta rozar el pecho.',
      'Manten la barra apoyada sin hundirla y sin perder la tension del torso durante 2 segundos completos.',
      'Empuja de forma explosiva desde parado, sin ayudarte del rebote.',
    ],
    breathing:
      'Aire dentro arriba. Mantenlo durante la bajada y toda la pausa: soltarlo hunde el pecho y pierdes la posicion.',
    rangeOfMotion: 'Contacto ligero con el pecho, sin hundir la barra.',
    tempo: '3-2-1-0 · pausa real de 2 segundos contados',
    commonMistakes: [
      'Pausa de medio segundo que en realidad sigue siendo un rebote.',
      'Soltar el aire durante la pausa y perder la rigidez del torso.',
      'Apoyar el peso en el pecho en lugar de sostenerlo.',
    ],
    warningSigns: [
      'El pecho se hunde durante la pausa.',
      'Las escapulas se separan mientras esperas.',
    ],
    safety: ['La pausa alarga el tiempo bajo la barra: los seguros son mas necesarios, no menos.'],
    hypertrophy: [
      '5–8 repeticiones. La pausa aumenta mucho la demanda por repeticion.',
    ],
    strength: [
      '3–5 repeticiones. Es la mejor herramienta para el punto muerto del press de banca.',
      'Muy util si compites en powerlifting, donde la pausa es obligatoria.',
    ],
    warnings: ['No es un ejercicio de iniciacion: exige controlar bien el press normal.'],
    contraindications: ['Molestia de hombro que aumenta al mantener la posicion baja.'],
    lumbarAdaptation: 'Igual que el press de banca: pies elevados si el arco molesta.',
  },

  flexiones: {
    authored: true,
    summary:
      'El cuerpo entero es una tabla rigida. Si la cadera cae o se levanta, el ejercicio deja de ser de pecho.',
    setup: [
      'Espacio libre en el suelo. Una esterilla si las munecas molestan.',
      'Si aun no llegas a 5 limpias, apoya las manos en un banco para reducir la carga.',
    ],
    startPosition: [
      'Manos algo mas anchas que los hombros, a la altura del pecho.',
      'Dedos hacia delante, munecas alineadas con los antebrazos.',
      'Cuerpo en linea recta de la cabeza a los talones.',
      'Gluteos y abdomen apretados, costillas hacia abajo.',
    ],
    execution: [
      'Baja controlado con los codos a unos 45 grados del torso.',
      'Desciende hasta que el pecho quede a un palmo del suelo o lo roce.',
      'Empuja el suelo hasta extender los codos sin bloquear de golpe.',
      'La cadera y los hombros suben a la vez.',
    ],
    breathing:
      'Inspira al bajar y expulsa al empujar, sin dejar que el abdomen se relaje: aqui la respiracion tambien sostiene la linea del cuerpo.',
    rangeOfMotion: 'Pecho cerca del suelo arriba, extension casi completa abajo.',
    tempo: '2-0-1-0',
    commonMistakes: [
      'Dejar caer la cadera y arquear la lumbar.',
      'Sacar los codos a 90 grados del torso.',
      'Bajar solo la cabeza en lugar del pecho.',
      'Recorrido parcial que no llega a la mitad.',
    ],
    warningSigns: [
      'La cadera se hunde a mitad de serie.',
      'El cuello se estira hacia delante buscando el suelo.',
      'Las munecas empiezan a doler.',
    ],
    safety: [
      'Si las munecas molestan, usa agarres paralelos o apoya sobre los punos.',
      'Progresa desde las manos elevadas antes que desde las rodillas: mantiene mejor la linea del cuerpo.',
    ],
    hypertrophy: [
      '10–20 repeticiones. Cuando pases de 20 limpias, eleva los pies o anade lastre.',
      'Es un ejercicio de pecho valido, no solo un calentamiento.',
    ],
    strength: ['Progresa a flexiones declinadas o con lastre en la espalda.'],
    warnings: ['Sin riesgos destacables mientras el cuerpo se mantenga en linea recta de la cabeza a los talones.'],
    contraindications: ['Dolor de muneca que no cede al cambiar el agarre.'],
    lumbarAdaptation:
      'La lumbar se carga solo si la cadera cae. Aprieta gluteos durante toda la serie: no es un detalle estetico, es lo que mantiene la pelvis en su sitio.',
  },

  'flexiones-declinadas': {
    authored: true,
    summary:
      'Con los pies elevados aumenta el porcentaje de peso corporal que empujas y se enfatiza el pectoral superior.',
    setup: [
      'Un banco, escalon o sofa firme para los pies.',
      'Cuanto mas alto el apoyo, mas dificil el ejercicio.',
    ],
    startPosition: [
      'Pies sobre el apoyo, manos en el suelo algo mas anchas que los hombros.',
      'Cuerpo en linea recta, gluteos apretados.',
      'Mirada al suelo, cuello alineado con la columna.',
    ],
    execution: [
      'Baja controlado hasta que el pecho quede cerca del suelo.',
      'Codos a unos 45 grados del torso.',
      'Empuja sin dejar que la cadera se hunda ni se eleve.',
    ],
    breathing:
      'Inspira al bajar y expulsa al empujar. Con la cabeza por debajo del corazon, evita apneas largas.',
    rangeOfMotion: 'Pecho cerca del suelo, extension casi completa arriba.',
    tempo: '2-0-1-0',
    commonMistakes: [
      'Elevar los pies tanto que el ejercicio se convierte en un press de hombro.',
      'Perder la linea del cuerpo por exceso de dificultad.',
    ],
    warningSigns: [
      'La cadera se levanta buscando ventaja.',
      'La sangre se acumula en la cabeza por la inclinacion.',
    ],
    safety: ['Comprueba que el apoyo de los pies no se desplace.'],
    hypertrophy: ['8–15 repeticiones. Sube la altura del apoyo cuando sea facil.'],
    strength: ['Anade lastre en la espalda alta antes que subir mas los pies.'],
    warnings: ['Con la cabeza por debajo del corazon, sal despacio de la posicion.'],
    contraindications: ['Mareo en posicion invertida.'],
    lumbarAdaptation:
      'La posicion declinada tiende a hundir mas la cadera. Si notas la lumbar, vuelve a las flexiones normales antes que forzar la linea.',
  },

  'aperturas-mancuerna': {
    authored: true,
    summary:
      'El codo mantiene una flexion fija durante todo el recorrido: si se dobla y estira, es un press, no una apertura.',
    setup: [
      'Banco plano y mancuernas claramente mas ligeras de las que usas en press.',
      'Si no sabes por donde empezar, usa un tercio del peso de tu press con mancuernas.',
    ],
    startPosition: [
      'Tumbado con las escapulas juntas y los pies firmes.',
      'Brazos extendidos sobre el pecho con una flexion de codo de unos 20 grados.',
      'Palmas enfrentadas.',
    ],
    execution: [
      'Abre los brazos describiendo un arco amplio, como si abrazases un barril.',
      'El angulo del codo no cambia en ningun momento.',
      'Baja hasta notar estiramiento en el pectoral, sin que los codos pasen la linea del banco.',
      'Vuelve por el mismo arco juntando las manos sin llegar a chocar.',
    ],
    breathing: 'Inspira al abrir, expulsa el aire al cerrar.',
    rangeOfMotion:
      'Hasta el estiramiento comodo. Bajar por debajo de la linea del banco pone al hombro en su posicion mas vulnerable.',
    tempo: '3-1-1-1',
    commonMistakes: [
      'Convertirlo en un press doblando y estirando el codo.',
      'Cargar tanto que la bajada se vuelve una caida.',
      'Bajar demasiado buscando estiramiento.',
    ],
    warningSigns: [
      'El angulo del codo cambia durante la serie.',
      'Notas tiron en la parte frontal del hombro.',
    ],
    safety: [
      'Es el ejercicio de pecho con mas riesgo de pinzamiento si te pasas de carga o de rango.',
      'Ante cualquier tiron en el hombro, cambia a cruce de poleas o pec deck.',
    ],
    hypertrophy: [
      '12–15 repeticiones con control total.',
      'Va mejor al final de la sesion, cuando el pectoral ya esta cansado y no necesitas carga.',
    ],
    strength: ['No aplica: es un ejercicio de tension, no de fuerza.'],
    warnings: ['Carga conservadora. El brazo de palanca aqui es muy largo.'],
    contraindications: ['Molestia de hombro en abduccion con el brazo extendido.'],
    lumbarAdaptation: 'Tumbado y con los pies apoyados, la carga lumbar es minima.',
  },

  'pec-deck': {
    authored: true,
    summary:
      'Trayectoria guiada y tension constante: la forma mas segura de llevar el pectoral cerca del fallo.',
    setup: [
      'Ajusta el asiento hasta que los agarres queden a la altura del pecho.',
      'Comprueba que la espalda apoya completa sin encoger los hombros.',
    ],
    startPosition: [
      'Espalda pegada al respaldo, escapulas ligeramente juntas.',
      'Codos a la altura de los hombros sobre las almohadillas, o manos en los agarres.',
      'Pies planos en el suelo.',
    ],
    execution: [
      'Junta los brazos al frente contrayendo el pectoral.',
      'Manten un segundo en el punto de maxima contraccion.',
      'Abre controlado hasta notar estiramiento, sin dejar que las placas choquen.',
    ],
    breathing: 'Expulsa al juntar, inspira al abrir.',
    rangeOfMotion: 'Contraccion completa al frente, estiramiento hasta donde el hombro este comodo.',
    tempo: '3-1-1-1',
    commonMistakes: [
      'Separar la espalda del respaldo para ayudar con el torso.',
      'Abrir mas alla del estiramiento comodo.',
      'Dejar que el peso vuelva de golpe.',
    ],
    warningSigns: ['La espalda se despega del respaldo.', 'Los hombros suben hacia las orejas.'],
    safety: ['Al ser guiada, permite trabajar cerca del fallo con mucho menos riesgo que las aperturas libres.'],
    hypertrophy: [
      '12–20 repeticiones con pausa en contraccion.',
      'Excelente para series descendentes al final del entrenamiento de pecho.',
    ],
    strength: ['No aplica.'],
    warnings: ['Ajusta siempre el asiento: una altura incorrecta cambia el angulo de trabajo.'],
    contraindications: ['Molestia de hombro que no cede al reducir el rango de apertura.'],
    lumbarAdaptation: 'Con la espalda apoyada, la carga lumbar es practicamente nula.',
  },

  'press-cerrado': {
    authored: true,
    summary:
      'Agarre a la anchura de los hombros y codos pegados: el triceps se lleva el trabajo sin sacrificar la carga.',
    setup: [
      'Banco plano con seguros a la altura del pecho.',
      'Agarre a la anchura de los hombros, ni mas estrecho: juntar las manos castiga la muneca sin anadir estimulo.',
    ],
    startPosition: [
      'Escapulas juntas, pies firmes.',
      'Barra sobre la linea del pecho, munecas rectas.',
    ],
    execution: [
      'Baja llevando la barra hacia la parte baja del pecho.',
      'Manten los codos cerca del torso, a unos 30 grados.',
      'Empuja en linea recta hasta extender sin bloquear de golpe.',
    ],
    breathing:
      'Inspira al bajar y expulsa al superar el punto dificil. Con agarre estrecho, mantener el aire ayuda a fijar los codos junto al torso.',
    rangeOfMotion: 'Contacto ligero con el pecho, extension casi completa arriba.',
    tempo: '3-0-1-0',
    commonMistakes: [
      'Agarre demasiado estrecho, que fuerza la muneca.',
      'Abrir los codos y convertirlo en un press plano.',
      'Bajar la barra al cuello.',
    ],
    warningSigns: [
      'Las munecas se doblan hacia atras.',
      'Los codos se abren a medida que la serie avanza.',
    ],
    safety: [
      'Seguros o companero, igual que en el press plano.',
      'Si las munecas molestan, ensancha ligeramente el agarre.',
    ],
    hypertrophy: ['8–12 repeticiones. Es el ejercicio de triceps que mas carga admite.'],
    strength: [
      '4–6 repeticiones. Transfiere bien al bloqueo del press de banca.',
    ],
    warnings: ['El agarre muy cerrado es la causa habitual de molestia de muneca en este ejercicio.'],
    contraindications: ['Dolor de muneca o de codo que empeora con el agarre estrecho.'],
    lumbarAdaptation: 'Igual que el press de banca: pies elevados si el arco molesta.',
  },

  pullover: {
    authored: true,
    summary:
      'Estira el dorsal y la caja toracica en un rango que ningun otro ejercicio alcanza. Carga moderada, control alto.',
    setup: [
      'Banco plano y una sola mancuerna sujeta por el disco superior con ambas manos.',
      'Peso conservador: el hombro trabaja en flexion completa.',
    ],
    startPosition: [
      'Tumbado a lo largo del banco con los pies firmes en el suelo.',
      'Mancuerna sostenida sobre el pecho con los brazos casi extendidos.',
      'Costillas hacia abajo, abdomen firme.',
    ],
    execution: [
      'Lleva la mancuerna por detras de la cabeza describiendo un arco.',
      'Manten la flexion de codo constante y minima.',
      'Baja hasta notar estiramiento claro en el dorsal y las costillas.',
      'Vuelve por el mismo arco hasta que la mancuerna quede sobre el pecho.',
    ],
    breathing:
      'Inspira profundo al bajar acompanando la expansion de la caja toracica; expulsa al volver.',
    rangeOfMotion:
      'Hasta el estiramiento comodo por detras de la cabeza. La movilidad de hombro marca el limite, no la ambicion.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Arquear la lumbar para ganar recorrido.',
      'Doblar y estirar el codo, convirtiendolo en una extension de triceps.',
      'Cargar demasiado para el rango que exige.',
    ],
    warningSigns: [
      'Las costillas se abren y la lumbar se despega del banco.',
      'Aparece tiron en la parte frontal del hombro.',
    ],
    safety: [
      'Sujeta la mancuerna por el disco con las dos palmas, no por el mango.',
      'Si tienes poca movilidad de hombro, reduce el rango en vez de forzarlo.',
    ],
    hypertrophy: ['10–15 repeticiones con enfasis en el estiramiento.'],
    strength: ['No aplica.'],
    warnings: ['Si la mancuerna resbala en la posicion baja, cae detras de tu cabeza. Agarre firme.'],
    contraindications: ['Molestia de hombro en flexion completa por encima de la cabeza.'],
    lumbarAdaptation:
      'La tendencia a arquear es el unico modo en que este ejercicio carga la lumbar. Manten las costillas abajo y, si no lo consigues, reduce el rango.',
  },

  encogimiento: {
    authored: true,
    summary:
      'Solo sube y baja el hombro. Rotarlo no aporta nada y anade estres innecesario a la articulacion.',
    setup: [
      'Mancuernas a los lados o barra por delante.',
      'Correas de agarre si el antebrazo falla antes que el trapecio.',
    ],
    startPosition: [
      'De pie, brazos extendidos con el peso colgando.',
      'Pecho alto, mirada al frente, abdomen firme.',
    ],
    execution: [
      'Eleva los hombros hacia las orejas en linea recta.',
      'Manten un segundo arriba apretando el trapecio.',
      'Baja controlado hasta el estiramiento completo.',
    ],
    breathing:
      'Expulsa al elevar los hombros, inspira mientras el trapecio se estira abajo.',
    rangeOfMotion: 'Elevacion completa arriba, estiramiento completo abajo.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Rotar los hombros en circulos.',
      'Usar impulso de piernas.',
      'Recorrido minimo con carga excesiva.',
    ],
    warningSigns: [
      'El movimiento se convierte en un balanceo del cuerpo.',
      'Notas tension en el cuello en lugar del trapecio.',
    ],
    safety: ['La rotacion del hombro bajo carga no aporta nada y si anade riesgo.'],
    hypertrophy: ['12–20 repeticiones con pausa arriba. El trapecio responde bien a la pausa.'],
    strength: ['8–12 repeticiones con carga alta y correas si hace falta.'],
    warnings: ['Sin riesgos destacables mientras no rotes el hombro bajo carga.'],
    contraindications: ['Molestia cervical que aumenta con el ejercicio.'],
    lumbarAdaptation:
      'De pie con carga alta hay algo de compresion. Hazlo sentado en un banco con respaldo si la espalda esta sensible.',
  },

  /* ══════════════════════════════════════════════════════════════ ESPALDA ══ */

  'dominadas-asistidas': {
    authored: true,
    summary:
      'La maquina resta peso, no tecnica: la escapula sigue teniendo que iniciar el movimiento.',
    setup: [
      'Ajusta la asistencia para completar 8–10 repeticiones con buena forma.',
      'Agarre pronado algo mas ancho que los hombros.',
    ],
    startPosition: [
      'Rodillas o pies sobre la plataforma, brazos extendidos.',
      'Baja los hombros para salir del colgado pasivo antes de tirar.',
    ],
    execution: [
      'Deprime las escapulas primero.',
      'Tira llevando los codos hacia las costillas hasta pasar la barbilla.',
      'Baja en 2–3 segundos hasta extension completa.',
    ],
    breathing: 'Expulsa al tirar, inspira al bajar.',
    rangeOfMotion: 'Extension completa abajo, barbilla sobre la barra arriba.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Usar tanta asistencia que el ejercicio deja de costar.',
      'Rebotar en la plataforma para arrancar.',
      'Cortar el rango abajo.',
    ],
    warningSigns: [
      'La plataforma te impulsa en cada repeticion.',
      'El rango se acorta dentro de la misma serie.',
    ],
    safety: ['Sube y baja de la plataforma con la asistencia ya seleccionada.'],
    hypertrophy: [
      '8–12 repeticiones. Reduce la asistencia 5 kg cuando llegues a 12 limpias.',
    ],
    strength: [
      'El objetivo es llegar a la dominada libre: baja la asistencia de forma progresiva y constante.',
    ],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia de hombro al colgarse.'],
    lumbarAdaptation: 'Carga lumbar baja. Aprieta el abdomen para no balancearte.',
  },

  'dominadas-lastradas': {
    authored: true,
    summary:
      'Progresion natural de la dominada. El lastre sube antes que las repeticiones, y la tecnica no se negocia.',
    setup: [
      'Cinturon de lastre o mancuerna entre los pies.',
      'Empieza con 5 kg: el salto de peso corporal a lastrado se nota mas de lo que parece.',
    ],
    startPosition: [
      'Colgado con los brazos extendidos y el lastre estable.',
      'Hombros deprimidos, abdomen y gluteos apretados.',
    ],
    execution: [
      'Deprime las escapulas antes de doblar los codos.',
      'Tira llevando los codos hacia las costillas.',
      'Sube hasta pasar la barbilla sin estirar el cuello.',
      'Baja controlado hasta extension completa.',
    ],
    breathing: 'Expulsa durante el tiron, inspira en la bajada.',
    rangeOfMotion: 'Rango completo. Con lastre, recortar el recorrido es el atajo mas comun.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Anadir lastre antes de dominar 10 repeticiones limpias sin peso.',
      'Balancearse por el peso extra.',
      'Cortar el rango arriba.',
    ],
    warningSigns: [
      'El lastre te hace oscilar en cada repeticion.',
      'Aparece molestia en la cara interna del codo.',
    ],
    safety: [
      'Comprueba que el lastre esta bien sujeto antes de colgarte.',
      'Baja del todo antes de soltar el peso, nunca lo dejes caer desde arriba.',
    ],
    hypertrophy: ['6–10 repeticiones con lastre moderado.'],
    strength: [
      '3–6 repeticiones. Sube el lastre entre 2.5 y 5 kg cuando completes el rango alto con tecnica intacta.',
    ],
    warnings: ['Con lastre, el codo y el hombro reciben mas que con peso corporal.'],
    contraindications: ['Dolor de codo o de hombro: quita el lastre antes que reducir el rango.'],
    lumbarAdaptation:
      'El lastre colgando aumenta la tendencia a balancearse. Aprieta gluteos y abdomen para mantener el cuerpo rigido.',
  },

  'remo-pecho-apoyado': {
    authored: true,
    summary:
      'El pecho apoyado elimina la fatiga lumbar: puedes llevar la espalda al fallo sin que la zona baja decida por ti.',
    setup: [
      'Banco inclinado a unos 30–45 grados.',
      'Mancuernas a ambos lados del banco, o barra si la maquina lo permite.',
    ],
    startPosition: [
      'Pecho apoyado en el respaldo, barbilla por encima del borde.',
      'Brazos colgando con las escapulas estiradas.',
      'Pies firmes en el suelo, sin empujar contra el banco.',
    ],
    execution: [
      'Inicia llevando las escapulas hacia la columna.',
      'Sube los codos hacia la cadera, pegados al torso.',
      'Manten medio segundo en la contraccion.',
      'Baja controlado hasta el estiramiento completo.',
    ],
    breathing: 'Expulsa al traccionar, inspira al bajar.',
    rangeOfMotion: 'Estiramiento escapular completo abajo, codos por detras del torso arriba.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Despegar el pecho del respaldo para ayudarse con el torso.',
      'Tirar solo con los brazos sin mover la escapula.',
      'Empujar con los pies contra el suelo.',
    ],
    warningSigns: [
      'El pecho se separa del banco.',
      'La cadera se levanta del asiento.',
    ],
    safety: [
      'Es la alternativa de referencia al remo con barra cuando la lumbar esta sensible.',
      'Coge y deja las mancuernas con las rodillas dobladas, no desde la espalda.',
    ],
    hypertrophy: [
      '10–15 repeticiones con pausa en contraccion.',
      'Al no fatigar la lumbar, permite mas volumen semanal de espalda que el remo libre.',
    ],
    strength: ['8–10 repeticiones con carga alta y pecho siempre apoyado.'],
    warnings: ['Sin riesgos destacables mientras el pecho permanezca apoyado en el respaldo.'],
    contraindications: ['Molestia de hombro en la traccion.'],
    lumbarAdaptation:
      'Este ejercicio ES la adaptacion lumbar del remo. El apoyo del torso elimina practicamente toda la demanda de los erectores.',
  },

  'remo-t': {
    authored: true,
    summary:
      'Traccion pesada con recorrido guiado. La posicion inclinada sigue exigiendo a la lumbar, aunque menos que el remo libre.',
    setup: [
      'Maquina de remo en T con apoyo de pecho si esta disponible.',
      'Agarre neutro para mas dorsal, pronado y ancho para mas espalda alta.',
    ],
    startPosition: [
      'Pies firmes en la plataforma, rodillas ligeramente flexionadas.',
      'Espalda neutra, pecho apoyado si la maquina lo permite.',
      'Brazos extendidos con la escapula estirada.',
    ],
    execution: [
      'Tira llevando los codos hacia atras y juntando las escapulas.',
      'Manten el torso completamente quieto.',
      'Baja controlado hasta la extension completa.',
    ],
    breathing: 'Aire dentro antes de traccionar, expulsa al volver.',
    rangeOfMotion: 'Estiramiento completo abajo, contraccion con los codos pasando el torso.',
    tempo: '2-1-1-0',
    commonMistakes: [
      'Levantar el torso en cada repeticion.',
      'Cargar tanto que el movimiento se vuelve un tiron de cadera.',
      'Redondear la espalda en el estiramiento.',
    ],
    warningSigns: [
      'El torso sube y baja como un balancin.',
      'Notas la zona lumbar antes que la espalda alta.',
    ],
    safety: [
      'Sin apoyo de pecho, la fatiga lumbar llega antes que la de la espalda: para cuando el torso empiece a moverse.',
    ],
    hypertrophy: ['8–12 repeticiones con torso firme.'],
    strength: ['6–8 repeticiones. Admite bastante carga por el recorrido guiado.'],
    warnings: ['Carga lumbar moderada por la posicion inclinada mantenida.'],
    contraindications: ['Sensibilidad lumbar activa.'],
    lumbarAdaptation:
      'Usa la version con apoyo de pecho si la maquina lo tiene. Si no, el remo con pecho apoyado en banco inclinado da el mismo trabajo sin exigir a la zona baja.',
  },

  'peso-muerto': {
    authored: true,
    summary:
      'Cadera y pecho suben a la vez, barra pegada al cuerpo. Es el ejercicio que menos perdona un fallo tecnico.',
    setup: [
      'Barra sobre el medio del pie, pies a la anchura de la cadera.',
      'Calzado plano y firme: las zapatillas blandas te restan estabilidad.',
      'Discos de tamano estandar para que la barra quede a la altura correcta.',
    ],
    startPosition: [
      'Agarra la barra con los brazos verticales, justo por fuera de las piernas.',
      'Baja la cadera hasta que las espinillas toquen la barra sin perder la espalda neutra.',
      'Pecho alto, dorsal activo apretando la barra contra el cuerpo.',
      'Toma aire, llena el abdomen y aprietalo como si fueras a recibir un golpe.',
    ],
    execution: [
      'Empuja el suelo con las piernas como si hicieras una prensa.',
      'La barra sube rozando las espinillas y los muslos.',
      'Cadera y pecho suben al mismo ritmo desde el primer centimetro.',
      'Termina de pie apretando gluteos, sin echarte hacia atras.',
      'Baja llevando primero la cadera atras y despues doblando rodillas.',
    ],
    breathing:
      'Aire dentro y abdomen presurizado antes de despegar. Manten la presion durante toda la repeticion y expulsa arriba. Vuelve a tomar aire antes de la siguiente.',
    rangeOfMotion: 'Del suelo a la extension completa de cadera. Ni una hiperextension mas.',
    tempo: '2-0-1-1 · sin rebote en el suelo entre repeticiones',
    commonMistakes: [
      'Que la cadera suba antes que el pecho: la carga pasa integra a la espalda.',
      'Separar la barra del cuerpo, alargando el brazo de palanca sobre la columna.',
      'Redondear la lumbar en la fase inicial.',
      'Hiperextender la espalda arriba.',
      'Rebotar los discos en el suelo para encadenar repeticiones.',
    ],
    warningSigns: [
      'La cadera se dispara y los hombros se quedan.',
      'La barra se aleja de las piernas a mitad del recorrido.',
      'La espalda cambia de forma durante la subida.',
      'Notas la zona lumbar mucho mas que las piernas y los gluteos.',
    ],
    safety: [
      'Es el ejercicio del catalogo que mas exige a la columna: la tecnica manda siempre sobre el peso.',
      'No lo lleves al fallo. Con este patron, la ultima repeticion mal hecha cuesta cara.',
      'Si la tecnica se rompe, la serie ha terminado aunque te queden repeticiones en el papel.',
    ],
    hypertrophy: [
      '5–8 repeticiones. Como constructor de masa es bueno, pero su coste de fatiga es alto.',
      'Si buscas solo hipertrofia de cadena posterior, el rumano y el curl femoral dan mas por menos fatiga.',
    ],
    strength: [
      '3–5 repeticiones al 80–90%, con descansos de 3–5 minutos.',
      'Practica la presion abdominal en las series ligeras: es lo que sostiene la columna en las pesadas.',
    ],
    warnings: [
      'CARGA LUMBAR ALTA. Si vienes de una molestia lumbar, no vuelvas directo a este ejercicio.',
    ],
    contraindications: [
      'Dolor lumbar activo o hernia sintomatica. Consulta con un profesional cualificado antes de cargar este patron.',
    ],
    lumbarAdaptation:
      'Con lumbar sensible, en orden: 1) trap bar, que acerca la carga al centro de gravedad y reduce mucho el momento sobre la espalda; 2) hip thrust, que trabaja el gluteo con el torso apoyado; 3) curl femoral, que aisla el isquiotibial sin comprimir la columna.',
  },

  'peso-muerto-trap-bar': {
    authored: true,
    summary:
      'Al quedar dentro de la barra, la carga cae mas cerca de tu centro de gravedad: menos exigencia lumbar por el mismo trabajo.',
    setup: [
      'Barra hexagonal con los agarres altos si buscas menos rango, bajos si buscas mas.',
      'Situate en el centro exacto de la barra.',
    ],
    startPosition: [
      'Pies a la anchura de la cadera, dentro del marco.',
      'Cadera algo mas baja que en el peso muerto convencional: se parece mas a una sentadilla.',
      'Espalda neutra, pecho alto, brazos verticales.',
      'Aire dentro y abdomen presurizado.',
    ],
    execution: [
      'Empuja el suelo con las piernas manteniendo el torso mas vertical que en el convencional.',
      'Cadera y pecho suben a la vez.',
      'Termina de pie sin hiperextender.',
      'Baja con control hasta apoyar los discos.',
    ],
    breathing: 'Aire dentro abajo, mantenlo durante el tiron y expulsa arriba.',
    rangeOfMotion: 'Del suelo a la extension completa. Los agarres altos acortan el recorrido.',
    tempo: '2-0-1-1',
    commonMistakes: [
      'Colocarse descentrado y desequilibrar la barra.',
      'Bajar la cadera tanto que se convierte en una sentadilla mal hecha.',
      'Redondear la espalda al buscar los agarres.',
    ],
    warningSigns: [
      'Un lado de la barra sube antes que el otro.',
      'La espalda pierde su forma al iniciar el tiron.',
    ],
    safety: [
      'Sigue siendo una bisagra cargada: la espalda neutra no es negociable.',
      'Empieza con los agarres altos si tienes poca movilidad de cadera.',
    ],
    hypertrophy: ['6–10 repeticiones. Implica mas cuadriceps que el convencional.'],
    strength: [
      '3–6 repeticiones. Suele permitir mas carga que el convencional con menos estres espinal.',
    ],
    warnings: ['Carga lumbar moderada: menor que el convencional, pero no nula.'],
    contraindications: [
      'Dolor lumbar activo. Cambia a bisagra sin carga hasta que remita y consulta con un profesional sanitario si se mantiene.',
    ],
    lumbarAdaptation:
      'Es en si mismo la adaptacion del peso muerto convencional. Con los agarres altos reduces aun mas el rango y la exigencia inicial.',
  },

  'peso-muerto-piernas-rigidas': {
    authored: true,
    summary:
      'Rodilla casi bloqueada y maximo estiramiento del isquiotibial. Es la version mas exigente de la bisagra.',
    setup: [
      'Barra desde el rack a la altura de la cadera, o desde el suelo con carga ligera.',
      'Considera hacerlo sobre un step solo cuando domines el rango normal.',
    ],
    startPosition: [
      'De pie, barra pegada a los muslos.',
      'Rodillas practicamente extendidas, con una flexion minima que no cambiara.',
      'Espalda neutra, dorsal activo.',
    ],
    execution: [
      'Lleva la cadera hacia atras dejando que la barra baje rozando las piernas.',
      'Baja hasta notar estiramiento intenso en los isquiotibiales.',
      'Vuelve empujando la cadera hacia delante.',
    ],
    breathing: 'Aire dentro arriba, mantenlo durante el recorrido, expulsa al terminar.',
    rangeOfMotion:
      'Lo marca el isquiotibial. Con la rodilla casi recta, ese limite llega mucho antes que en el rumano.',
    tempo: '4-1-1-0 · excentrica muy lenta',
    commonMistakes: [
      'Redondear la lumbar buscando llegar al suelo.',
      'Doblar la rodilla y convertirlo en un rumano.',
      'Separar la barra de las piernas.',
    ],
    warningSigns: [
      'La espalda cambia de forma durante la bajada.',
      'Notas la lumbar antes que los isquiotibiales.',
    ],
    safety: [
      'La rodilla casi recta acorta mucho el margen antes de que la columna empiece a flexionarse.',
      'Carga claramente menor que en el rumano.',
    ],
    hypertrophy: ['8–12 repeticiones con carga ligera y enfasis en el estiramiento.'],
    strength: ['No es la mejor herramienta para fuerza: usa el rumano o el convencional.'],
    warnings: [
      'CARGA LUMBAR ALTA. De los ejercicios que mas rapido castigan un fallo de tecnica.',
    ],
    contraindications: [
      'Sensibilidad lumbar activa o hernia sintomatica. Consulta con un profesional sanitario antes de incluirlo.',
    ],
    lumbarAdaptation:
      'Sustituye por curl femoral sentado: trabaja el isquiotibial en su rango largo sin ninguna carga sobre la columna. Si quieres mantener el patron de cadera, el rumano con rodilla mas flexionada ya es bastante mas amable.',
  },

  'good-morning': {
    authored: true,
    summary:
      'Con la barra en la espalda y el torso inclinado, el brazo de palanca sobre la lumbar es de los mayores que existen.',
    setup: [
      'Barra en la espalda como en una sentadilla, dentro de un rack.',
      'Carga muy conservadora: aqui el peso enganado se paga caro.',
    ],
    startPosition: [
      'Pies a la anchura de la cadera, rodillas ligeramente flexionadas.',
      'Barra apoyada en el trapecio, no en el cuello.',
      'Espalda neutra, abdomen presurizado.',
    ],
    execution: [
      'Lleva la cadera hacia atras inclinando el torso hacia delante.',
      'Baja hasta notar estiramiento en los isquiotibiales, sin pasar de la horizontal.',
      'Vuelve empujando la cadera hacia delante.',
    ],
    breathing: 'Aire dentro arriba, mantenlo durante toda la repeticion, expulsa al terminar.',
    rangeOfMotion:
      'Hasta el estiramiento del isquiotibial o el torso paralelo al suelo, lo que llegue antes.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Inclinarse mas alla de la horizontal.',
      'Redondear la espalda en la parte baja.',
      'Cargar como si fuera una sentadilla.',
    ],
    warningSigns: [
      'La espalda se redondea al bajar.',
      'Las rodillas se doblan cada vez mas para compensar.',
    ],
    safety: [
      'Trabaja dentro de un rack con los seguros altos.',
      'Si dudas del peso, es demasiado.',
    ],
    hypertrophy: ['8–12 repeticiones con carga ligera. No es el mejor ejercicio para ganar masa.'],
    strength: [
      'Util como accesorio de sentadilla y peso muerto, en series de 6–8 con poco peso.',
    ],
    warnings: [
      'CARGA LUMBAR ALTA. La combinacion de barra en la espalda y torso inclinado es la mas exigente del catalogo para la columna.',
    ],
    contraindications: ['Cualquier sensibilidad lumbar. Consulta con un profesional antes de incluirlo.'],
    lumbarAdaptation:
      'Con lumbar sensible, este ejercicio no tiene una version segura equivalente: usa curl femoral sentado para el isquiotibial y hip thrust para el gluteo. Ambos dan el estimulo sin la palanca sobre la columna.',
  },

  hiperextension: {
    authored: true,
    summary:
      'Sube solo hasta la linea del cuerpo. Pasar de ahi convierte un ejercicio util en una hiperextension forzada.',
    setup: [
      'Banco romano ajustado para que el borde quede justo bajo la cadera, no sobre el muslo.',
      'Sin peso hasta dominar el movimiento.',
    ],
    startPosition: [
      'Tobillos bien sujetos, cadera apoyada en el borde.',
      'Cuerpo en linea recta, brazos cruzados en el pecho.',
      'Abdomen firme.',
    ],
    execution: [
      'Baja llevando la cadera hacia atras con la espalda neutra.',
      'Desciende hasta notar estiramiento en los isquiotibiales.',
      'Sube apretando gluteos hasta alinear el cuerpo.',
      'Detente en la linea: no continues hacia arriba.',
    ],
    breathing:
      'Inspira antes de bajar el torso, expulsa a medida que subes hasta la linea del cuerpo.',
    rangeOfMotion:
      'Del estiramiento comodo hasta la alineacion del cuerpo. Nunca por encima de la horizontal.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Hiperextender la espalda arriba buscando mas rango.',
      'Colocar el apoyo sobre el muslo en lugar de bajo la cadera.',
      'Anadir peso antes de controlar el movimiento.',
    ],
    warningSigns: [
      'La espalda se arquea claramente al final.',
      'Notas pinchazo en la zona lumbar al subir.',
    ],
    safety: [
      'Detenerte en la linea del cuerpo es lo que separa un buen ejercicio de cadena posterior de una hiperextension lumbar repetida.',
    ],
    hypertrophy: [
      '12–20 repeticiones sin peso o con un disco ligero al pecho.',
      'Redondeando ligeramente la parte alta y empujando con la cadera se enfatiza el gluteo.',
    ],
    strength: ['No es un ejercicio de fuerza. Usalo como accesorio.'],
    warnings: ['Carga lumbar moderada, y alta si hiperextiendes arriba.'],
    contraindications: ['Molestia lumbar que aparece durante el ejercicio.'],
    lumbarAdaptation:
      'Con lumbar sensible, limita el rango a la mitad superior o cambia a puente de gluteo, que trabaja la cadena posterior con la espalda apoyada en el suelo.',
  },

  /* ══════════════════════════════════════════════════════════════ HOMBRO ══ */

  'press-hombro-sentado': {
    authored: true,
    summary:
      'El respaldo elimina la exigencia lumbar del press de pie: mismo estimulo de hombro, mucha menos compensacion.',
    setup: [
      'Banco con respaldo casi vertical, ligeramente inclinado hacia atras.',
      'Mancuernas que puedas colocar tu solo desde los muslos.',
    ],
    startPosition: [
      'Espalda completa apoyada, pies planos en el suelo.',
      'Mancuernas a la altura de las orejas, codos algo por delante del torso.',
      'Munecas rectas sobre los antebrazos.',
    ],
    execution: [
      'Empuja hacia arriba con un arco leve hacia dentro.',
      'No choques las mancuernas arriba.',
      'Baja controlado hasta que los codos queden a la altura de los hombros.',
    ],
    breathing:
      'Inspira al bajar y expulsa durante el empuje. Al estar sentado, evita apneas largas: la presion sube mas rapido que de pie.',
    rangeOfMotion: 'Codos a la altura de los hombros abajo, extension casi completa arriba.',
    tempo: '3-0-1-0',
    commonMistakes: [
      'Separar la espalda del respaldo para arquear y ayudarse.',
      'Bajar demasiado buscando rango.',
      'Abrir los codos completamente en linea con el torso.',
    ],
    warningSigns: [
      'La lumbar se despega del respaldo.',
      'Una mancuerna se retrasa respecto a la otra.',
    ],
    safety: [
      'Sube las mancuernas impulsando con las rodillas y bajalas a los muslos al terminar.',
    ],
    hypertrophy: ['8–12 repeticiones con bajada controlada.'],
    strength: ['6–8 repeticiones. Menos carga que de pie, pero mas aislamiento del hombro.'],
    warnings: ['Sin riesgos destacables mientras la espalda no se separe del respaldo.'],
    contraindications: ['Molestia de hombro en el rango superior.'],
    lumbarAdaptation:
      'Este ejercicio es la adaptacion lumbar del press militar. Con la espalda apoyada, la compresion sobre la columna es minima.',
  },

  'press-maquina-hombro': {
    authored: true,
    summary:
      'Trayectoria guiada y espalda apoyada: la opcion mas segura para llevar el deltoides cerca del fallo.',
    setup: [
      'Ajusta el asiento hasta que los agarres queden a la altura de los hombros.',
      'Elige agarre neutro si el pronado te molesta.',
    ],
    startPosition: [
      'Espalda pegada al respaldo, pies planos.',
      'Manos en los agarres, codos algo por delante del plano del torso.',
    ],
    execution: [
      'Empuja hacia arriba hasta casi extender.',
      'Baja controlado hasta que los codos lleguen a la altura de los hombros.',
      'No dejes que las placas choquen entre repeticiones.',
    ],
    breathing: 'Expulsa al empujar, inspira al bajar.',
    rangeOfMotion: 'Codos a la altura del hombro abajo, extension casi completa arriba.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Separar la espalda del respaldo.',
      'Bloquear los codos de golpe arriba.',
      'Altura de asiento incorrecta, que cambia el angulo de trabajo.',
    ],
    warningSigns: ['Los hombros se encogen hacia las orejas.', 'La espalda se arquea.'],
    safety: ['Al ser guiada, es una buena opcion para las ultimas series o para trabajar al fallo.'],
    hypertrophy: ['10–15 repeticiones. Muy util para series descendentes.'],
    strength: ['La carga guiada transfiere poco al press libre. Usala como volumen.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia de hombro que no cede al reducir el rango.'],
    lumbarAdaptation: 'Carga lumbar practicamente nula con la espalda apoyada.',
  },

  'press-arnold': {
    authored: true,
    summary:
      'La rotacion anade recorrido y trabajo del deltoides anterior, a cambio de exigir mas al hombro.',
    setup: [
      'Banco con respaldo vertical.',
      'Mancuernas mas ligeras que en el press de hombro normal.',
    ],
    startPosition: [
      'Sentado con la espalda apoyada.',
      'Mancuernas delante del pecho, palmas hacia ti, codos juntos.',
    ],
    execution: [
      'Empuja hacia arriba girando las munecas de forma progresiva.',
      'Termina arriba con las palmas hacia delante y los codos casi extendidos.',
      'Invierte el movimiento con el mismo control al bajar.',
      'La rotacion acompana al recorrido, no ocurre de golpe al final.',
    ],
    breathing: 'Inspira abajo, expulsa el aire durante el empuje.',
    rangeOfMotion: 'Del pecho a la extension completa, con rotacion continua.',
    tempo: '3-0-2-0',
    commonMistakes: [
      'Rotar de golpe al principio o al final en lugar de progresivamente.',
      'Cargar como en un press normal.',
      'Arquear la lumbar para completar el recorrido.',
    ],
    warningSigns: [
      'La rotacion se convierte en un tiron brusco.',
      'Notas la articulacion del hombro mas que el musculo.',
    ],
    safety: [
      'La rotacion bajo carga exige mas al hombro: usa menos peso del que crees.',
      'Si el hombro molesta, el press de hombro normal da un estimulo parecido con menos demanda articular.',
    ],
    hypertrophy: ['10–12 repeticiones con rotacion controlada.'],
    strength: ['No aplica: la rotacion limita la carga.'],
    warnings: ['No es un ejercicio de iniciacion ni para hombros sensibles.'],
    contraindications: ['Molestia de hombro en rotacion bajo carga.'],
    lumbarAdaptation: 'Hazlo siempre sentado con respaldo.',
  },

  'elevacion-polea-lateral': {
    authored: true,
    summary:
      'La polea mantiene tension en la parte baja del recorrido, justo donde la mancuerna no ofrece resistencia.',
    setup: [
      'Polea baja con agarre sencillo.',
      'Situate de lado, con el cable cruzando por delante del cuerpo.',
    ],
    startPosition: [
      'De pie, un pie ligeramente adelantado.',
      'Brazo lejano al cable con el agarre delante del muslo contrario.',
      'Codo con flexion minima y fija, hombro abajo.',
    ],
    execution: [
      'Sube el brazo hacia el lado guiando con el codo.',
      'Detente a la altura del hombro.',
      'Baja en 3 segundos resistiendo la traccion del cable.',
    ],
    breathing:
      'Expulsa al abrir el brazo, inspira mientras la polea lo devuelve al costado.',
    rangeOfMotion:
      'Desde el cruce delante del cuerpo hasta la horizontal. La tension existe desde el primer grado.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Inclinar el torso para ayudar con el peso.',
      'Subir por encima del hombro.',
      'Encoger el trapecio al subir.',
    ],
    warningSigns: [
      'El cuerpo se balancea con cada repeticion.',
      'Notas mas trapecio que deltoide.',
    ],
    safety: ['Carga ligera. El brazo de palanca es largo y el musculo pequeno.'],
    hypertrophy: [
      '12–20 repeticiones por lado.',
      'Complementa bien a las mancuernas: la polea carga la parte baja, la mancuerna la alta.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos destacables mientras la carga permita controlar la bajada.'],
    contraindications: ['Molestia de hombro en abduccion.'],
    lumbarAdaptation: 'De pie con carga ligera la exigencia es minima. Evita inclinar el torso.',
  },

  'elevaciones-frontales': {
    authored: true,
    summary:
      'El deltoides anterior ya trabaja mucho en todos los empujes: aqui basta con poco volumen y carga ligera.',
    setup: [
      'Mancuernas ligeras, un disco o una polea baja.',
      'Espacio libre por delante.',
    ],
    startPosition: [
      'De pie, brazos extendidos delante de los muslos.',
      'Palmas hacia el cuerpo o enfrentadas.',
      'Abdomen firme, costillas abajo.',
    ],
    execution: [
      'Sube el brazo al frente con el codo casi extendido.',
      'Detente a la altura del hombro.',
      'Baja controlado sin dejar caer el peso.',
      'Puedes alternar brazos o subir ambos a la vez.',
    ],
    breathing:
      'Expulsa al levantar el peso al frente, inspira al bajarlo hasta los muslos.',
    rangeOfMotion: 'De los muslos a la altura del hombro. Subir mas implica al trapecio.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Balancear el torso hacia atras para lanzar el peso.',
      'Subir por encima del hombro.',
      'Dedicarle mas volumen del necesario.',
    ],
    warningSigns: [
      'La lumbar se arquea al subir.',
      'El peso sube por impulso y no por contraccion.',
    ],
    safety: ['Carga ligera. Si necesitas balancearte, pesa demasiado.'],
    hypertrophy: [
      '12–15 repeticiones. Suele bastar con 2–3 series semanales: el deltoides anterior ya recibe mucho de los press.',
    ],
    strength: ['No aplica.'],
    warnings: ['Es el musculo del hombro que mas facilmente se sobreentrena.'],
    contraindications: ['Molestia de hombro en flexion.'],
    lumbarAdaptation: 'Apoya la espalda en una pared para eliminar el balanceo.',
  },

  'rotacion-externa-banda': {
    authored: true,
    summary:
      'Trabajo de manguito rotador con carga muy ligera. Su valor esta en la calidad del movimiento, no en el peso.',
    setup: [
      'Banda elastica ligera fijada a la altura del codo.',
      'Una toalla enrollada bajo la axila ayuda a mantener el codo pegado.',
    ],
    startPosition: [
      'De pie de lado a la banda, codo pegado al costado y flexionado a 90 grados.',
      'Antebrazo cruzando por delante del abdomen.',
      'Hombro abajo, lejos de la oreja.',
    ],
    execution: [
      'Rota el antebrazo hacia fuera manteniendo el codo pegado al cuerpo.',
      'Llega hasta donde puedas sin que el codo se separe ni el torso gire.',
      'Vuelve despacio resistiendo la banda.',
    ],
    breathing:
      'Respiracion normal durante toda la serie: la carga es baja y no hace falta presurizar nada.',
    rangeOfMotion:
      'Desde el abdomen hasta donde el hombro rote comodo, sin compensar con el torso.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Separar el codo del costado.',
      'Girar el torso en lugar de rotar el hombro.',
      'Usar una banda demasiado dura.',
    ],
    warningSigns: [
      'El codo se despega del cuerpo.',
      'El torso rota acompanando al brazo.',
    ],
    safety: [
      'Es trabajo preventivo y de calidad de movimiento: la carga alta lo desvirtua por completo.',
      'Muy util como calentamiento antes de cualquier sesion de empuje.',
    ],
    hypertrophy: ['No es su objetivo. 15–20 repeticiones controladas.'],
    strength: ['No aplica.'],
    warnings: ['Si notas pinchazo en el hombro, reduce el rango antes que la tension.'],
    contraindications: ['Dolor de hombro en rotacion: consulta con un profesional si persiste.'],
  },

  /* ══════════════════════════════════════════════════════════ BRAZOS ══════ */

  'curl-mancuerna': {
    authored: true,
    summary:
      'Cada brazo trabaja por su cuenta y la muneca puede girar: mas libertad articular que con barra.',
    setup: ['Mancuernas y espacio para mantener los brazos a los lados.'],
    startPosition: [
      'De pie o sentado, brazos extendidos a los lados.',
      'Palmas hacia delante o neutras al inicio si prefieres supinar durante el recorrido.',
      'Codos pegados al torso, hombros abajo.',
    ],
    execution: [
      'Flexiona el codo subiendo la mancuerna.',
      'Si empiezas en neutro, gira la palma hacia arriba a mitad del recorrido.',
      'Aprieta arriba sin adelantar el codo.',
      'Baja en 3 segundos hasta la extension completa.',
    ],
    breathing:
      'Expulsa al subir e inspira al bajar. Si alternas brazos, respira una vez por cada par de repeticiones para no acelerar el ritmo.',
    rangeOfMotion:
      'Extension completa abajo y flexion maxima arriba. Si supinas durante el recorrido, la palma debe estar del todo hacia arriba antes de llegar al final.',
    tempo: '3-0-1-1',
    commonMistakes: [
      'Balancear el torso para arrancar.',
      'Adelantar los codos al final del recorrido.',
      'Subir ambas mancuernas con impulso alterno.',
    ],
    warningSigns: [
      'La lumbar se arquea al iniciar la subida.',
      'Los hombros se adelantan.',
    ],
    safety: ['Si notas el codo, prueba el agarre neutro o el martillo.'],
    hypertrophy: [
      '10–15 repeticiones. La supinacion durante el recorrido anade trabajo del biceps.',
      'Alternar brazos permite mas concentracion; simultaneo ahorra tiempo.',
    ],
    strength: ['8–10 repeticiones estrictas. El curl no es un ejercicio de fuerza maxima.'],
    warnings: ['Sin riesgos destacables mientras la carga permita controlar la bajada.'],
    contraindications: ['Molestia en el codo o en el tendon del biceps.'],
    lumbarAdaptation: 'Hazlo sentado con respaldo para eliminar cualquier balanceo.',
  },

  'curl-concentrado': {
    authored: true,
    summary:
      'El codo apoyado en el muslo elimina toda posibilidad de impulso: es el curl mas estricto que puedes hacer.',
    setup: ['Un banco y una mancuerna. Nada mas.'],
    startPosition: [
      'Sentado en el borde del banco con las piernas abiertas.',
      'Codo del brazo que trabaja apoyado en la cara interna del muslo.',
      'Brazo extendido con la mancuerna colgando.',
    ],
    execution: [
      'Flexiona el codo subiendo la mancuerna hacia el hombro.',
      'Manten el codo apoyado durante todo el recorrido.',
      'Aprieta un segundo arriba.',
      'Baja en 3 segundos hasta la extension completa.',
    ],
    breathing:
      'Expulsa al flexionar el codo, inspira mientras el brazo se extiende contra el muslo.',
    rangeOfMotion: 'Extension completa abajo, contraccion maxima arriba.',
    tempo: '3-1-1-1',
    commonMistakes: [
      'Despegar el codo del muslo para ayudarse.',
      'Balancear el torso.',
      'Cargar demasiado para una posicion tan estricta.',
    ],
    warningSigns: ['El codo se separa del muslo.', 'El torso se inclina hacia atras.'],
    safety: ['Carga moderada: la posicion no permite compensar.'],
    hypertrophy: [
      '10–15 repeticiones por brazo.',
      'Muy util para corregir asimetrias: empieza siempre por el lado debil.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia de codo.'],
    lumbarAdaptation: 'Sentado y con el torso ligeramente inclinado, la carga lumbar es baja.',
  },

  'patada-triceps': {
    authored: true,
    summary:
      'La contraccion maxima coincide con el punto de mayor resistencia: util al final, no como ejercicio principal.',
    setup: [
      'Mancuerna ligera y un banco donde apoyarse.',
      'La polea baja funciona igual de bien y mantiene tension en todo el recorrido.',
    ],
    startPosition: [
      'Rodilla y mano del mismo lado apoyadas en el banco.',
      'Torso paralelo al suelo, espalda neutra.',
      'Brazo que trabaja con el codo pegado al costado y flexionado a 90 grados.',
    ],
    execution: [
      'Extiende el codo llevando la mancuerna hacia atras.',
      'El brazo queda paralelo al suelo en la extension.',
      'Aprieta el triceps un segundo.',
      'Vuelve controlado a los 90 grados sin mover el codo.',
    ],
    breathing:
      'Expulsa al extender el codo, inspira mientras el antebrazo vuelve a flexionarse.',
    rangeOfMotion: 'De 90 grados a extension completa, sin que el codo se mueva.',
    tempo: '2-1-2-0',
    commonMistakes: [
      'Mover el hombro en lugar del codo.',
      'Balancear la mancuerna hacia atras.',
      'Cargar demasiado para el recorrido.',
    ],
    warningSigns: ['El codo sube y baja durante la serie.', 'El torso rota para acompanar.'],
    safety: ['Carga ligera. Es un ejercicio de contraccion, no de peso.'],
    hypertrophy: [
      '12–20 repeticiones con pausa en la extension.',
      'Va bien como ultimo ejercicio de brazo.',
    ],
    strength: ['No aplica.'],
    warnings: ['Sin riesgos especificos con carga moderada y recorrido controlado.'],
    contraindications: ['Molestia de codo.'],
    lumbarAdaptation:
      'Con la rodilla y la mano apoyadas en el banco, la lumbar queda descargada. La version de pie inclinado si la implica: evitala.',
  },
};
