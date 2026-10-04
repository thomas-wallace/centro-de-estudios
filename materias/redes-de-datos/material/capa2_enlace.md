# Modelo en Capas – Capa 2: Enlace

> **Flujo de datos:** Física → **Enlace** → Red → Transporte → Aplicación

---

## La Capa de Enlace (Capa 2 del Modelo OSI)

1. **Introducción a la capa de enlace**
2. Funciones de la capa de enlace
3. Servicios hacia la capa de red
4. Entramado (Framing)
5. Control y detección de errores
6. Control de flujo
7. Acceso al medio en redes MultiAcceso
8. Protocolos CSMA/CD – CSMA/CA

---

# 01 – Introducción a la capa de enlace

## ¿Para qué sirve la capa de enlace?

1. **Preparar paquetes:** prepara los paquetes de la capa de red (capa 3) para su transmisión, encapsulándolos en tramas.
2. **Controlar el acceso:** controla el acceso a los medios físicos (capa 1) para regular cómo se transmiten los datos.

## Repaso: Encapsulado

(Diapositiva de repaso del proceso de encapsulado entre capas.)

## ¿Para qué sirve la capa de enlace? (detalle)

- **Servicio a la capa superior:** brinda un enlace de servicio a la capa de red.
- **Direccionamiento físico:** se le añade información sobre el direccionamiento físico (direcciones **MAC**).
- **Acceso al medio:** determina quién puede usar el medio para manejo de colisiones.
- **Encapsulación de datos:** se encapsulan los paquetes de datos formando tramas.

### Estructura de la Unidad de Datos (Trama)

```
            3. Capa de Red
                  ↑
┌─────────────┬───────────────┬─────────┐
│ ENCABEZADO  │    Paquete    │ TRÁILER │
│             │    (Datos)    │         │
└─────────────┴───────────────┴─────────┘
                  ↓
            1. Capa Física
```

## Objetivo principal

Se encarga de lograr una comunicación eficiente entre dos equipos **"adyacentes"**, ocultando a la capa de red los problemas de la capa física (Capa 1).

### Problemas de la capa física resueltos

- Errores del medio físico
- Retardo de los canales
- Diferencia de velocidades

## Capa de Enlace en Dispositivos Finales (NIC)

### Hardware y software en la NIC

#### Hardware de la NIC

La tarjeta de interfaz de red (**NIC**) actúa como el transceptor físico y lógico.

- **Controlador MAC:** circuito que implementa las funciones de encapsulado/desencapsulado de tramas, direccionamiento MAC y control del acceso al medio.
- **DMA:** mecanismo que permite transferir datos entre la NIC y la RAM sin que la CPU tenga que realizar directamente cada transferencia.
- **Búfer FIFO:** memoria de almacenamiento rápido que previene la pérdida de datos durante picos de tráfico entrante.
- **Interrupciones (IRQ):** mecanismo lógico que avisa a la CPU principal cuando una trama nueva ha sido recibida y copiada a la RAM.

#### Software

El sistema operativo del host interactúa con la NIC mediante **drivers**.

- **Firmware:** software almacenado en la memoria de la NIC que controla el funcionamiento interno del controlador de red. Se encarga de inicializar y configurar la NIC, gestionar las colas y buffers de transmisión y recepción, controlar el acceso al medio y coordinar determinadas funciones de procesamiento de las tramas.

## Capa de Enlace en Routers y Switches

### ¿Cómo opera el hardware y software de red?

#### Hardware especializado (ASIC/NIC)

En los switches y routers, el procesamiento de la capa de enlace se implementa directamente en circuitos físicos para garantizar el máximo rendimiento:

- **ASICs y FPGAs:** chips dedicados que procesan y conmutan tramas a la velocidad del cable (*wire-speed*), sin saturar la CPU principal.
- **Puertos y PHY:** el transceptor físico que maneja la codificación de señales, preámbulos y la detección de colisiones o errores a nivel de bits.
- **Búferes de memoria:** almacenamiento rápido en la tarjeta para gestionar colas de tramas durante congestiones de tráfico.

#### Software y firmware de control

El sistema operativo de red (como Cisco IOS) y los drivers controlan el comportamiento inteligente de los enlaces:

- **Sistema operativo de red y firmware:** software que comunica el sistema operativo con los controladores físicos de los puertos de red.
- **Protocolos de control:** algoritmos lógicos críticos como **Spanning Tree Protocol (STP)** para evitar bucles de capa 2 o **LACP** para agregación de enlaces.
- **Tablas de direcciones MAC:** software de gestión que mantiene de forma dinámica el mapa de puertos y direcciones físicas asociadas.

---

# 02 – Funciones de la capa de enlace

1. Brindar servicios a la capa de red (Capa 3)
2. Entramado (Enmarcado o Framing)
3. Control y detección de errores
4. Control de flujo
5. Acceso al medio

---

# 03 – Servicios hacia la capa de red

## Servicio no confiable, no orientado a conexión

**No garantiza** entrega confiable.

- **Detección y descarte:** se detectan los errores de la transmisión y se descartan las tramas erróneas.
- **Sin retransmisión:** las tramas perdidas o erróneas no se vuelven a enviar.
- **Sin confirmación:** las tramas que llegan correctamente no se confirman al emisor.
- **Tramas duplicadas:** no se detectan ni se descartan posibles duplicados.
- **Orden de llegada:** se entregan a la capa superior exactamente en el orden en que se reciben.
- **Sin control de flujo:** no se regula la velocidad de transmisión entre emisor y receptor.

Además:

- **Sin fases de conexión:** cada trama se considera de forma independiente al resto, sin necesidad de establecer o finalizar un enlace previo.
- **Uso recomendado:** redes con tasas de errores muy bajas (las más comunes hoy en día) donde se prioriza la velocidad de transmisión.
- **Ejemplo:** Ethernet.

## Servicio confiable, no orientado a conexión

**Garantiza** la entrega confiable de tramas.

- **Detección y descarte:** se detectan los errores de la transmisión y se descartan las tramas erróneas.
- **Retransmisión:** todas las tramas perdidas o erróneas se pueden retransmitir.
- **Sin duplicados:** se detectan y descartan las tramas duplicadas.
- **Orden de llegada:** se entregan a la capa superior exactamente en el orden en que se reciben.
- **Control de flujo:** se realiza control de flujo entre emisor y receptor.

Además:

- **Control de errores:** técnicas de detección, numeración de tramas y confirmación de tramas OK con retransmisión.
- **Ejemplo:** WiFi.

## Servicio confiable, orientado a conexión

**Garantiza** la entrega confiable de tramas.

- **Detección y descarte:** se detectan los errores de la transmisión y se descartan las tramas erróneas.
- **Retransmisión:** todas las tramas perdidas o erróneas se pueden retransmitir.
- **Sin duplicados:** se detectan y descartan las tramas duplicadas.
- **Orden de llegada:** se entregan a la capa superior ordenados.
- **Control de flujo:** se realiza control de flujo entre emisor y receptor.
- **Conexión:** establecimiento de conexión.

Además:

- **Control de errores:** técnicas de detección, numeración de tramas y confirmación de tramas OK con retransmisión.
- **Ejemplo:** IoT, redes de sensores.

## Resumen comparativo

| Característica | No confiable, no orientado a conexión | Confiable, no orientado a conexión | Confiable, orientado a conexión |
|---|---|---|---|
| Detección y descarte de tramas erróneas | Sí | Sí | Sí |
| Retransmisión | No | Sí | Sí |
| Confirmación (ACK) | No | Sí | Sí |
| Detección de duplicados | No | Sí | Sí |
| Entrega en orden | En el orden en que se reciben | En el orden en que se reciben | Ordenada |
| Control de flujo | No | Sí | Sí |
| Establecimiento de conexión | No | No | Sí |
| Ejemplo | Ethernet | WiFi | IoT / Red de sensores |

---

# 04 – Entramado (Framing)

## Estructura de la trama

Los datos transitan por el medio físico encapsulados, para lo cual se les agrega:

1. **Header** (encabezado del protocolo de enlace)
2. **Datos** (procedentes de la capa superior – Capa 3)
3. **Trailer** (cola de la trama)

**PDU = TRAMA = FRAME**

```
┌─────────────┬───────────────┬─────────┐
│   HEADER    │     DATOS     │ TRAILER │
└─────────────┴───────────────┴─────────┘
   Encapsulación en la Capa de Enlace de Datos
```

## Delimitación de tramas

Para delimitar el inicio y fin de cada trama o frame, se utilizan principalmente las siguientes técnicas:

1. **Cuenta de caracteres:** usa un campo en el encabezado para especificar la cantidad de caracteres que le siguen en la trama.
2. **Inserción de caracteres o patrones:** delimita el inicio y fin mediante secuencias específicas de bits o caracteres especiales de control.

### Estructura de formateo de datos para la transmisión con patrones de inicio y fin

```
┌────────────────────────────────────────────────────┐
│  ENCABEZADO  │     Paquete (Datos)     │  TRÁILER  │
└────────────────────────────────────────────────────┘

Encabezado: [Inicio de trama | Dirección | Tipo | Control]
Datos:      [DATOS]
Tráiler:    [Detección de errores | Detener trama]

  1 0 1 0 ........................ 1 0 0 1
  ↑                                       ↑
  Un patrón de bits específico            Otro patrón de bits específico
  denota el inicio de una trama           denota el final de una trama
```

## Inserción de patrones de inicio y fin (Bit Stuffing)

- **Patrón delimitador:** todas las tramas comienzan y finalizan con un patrón conocido: `01111110`.
- **Transmisor (inserción):** si la capa de enlace encuentra **cinco bits 1 consecutivos** en los datos, inserta automáticamente un **bit 0** de relleno al final.
- **Receptor (extracción):** cuando se reciben cinco bits 1 seguidos de un 0, el receptor borra automáticamente dicho bit de relleno.

### Visualización del flujo de datos

El gráfico muestra la inserción de bits 0 de relleno en el flujo transmitido y su posterior eliminación por el receptor para recuperar la información original.

```
                 Bandera de inicio                      Bandera de fin
Flujo original de datos:
  01111110 0110 11111111111111 10010 01111110

Flujo de datos transmitido:
  01111110 0110 11111 0 11111 0 11111 0 10010 01111110
                      ↑       ↑       ↑
                  Bits a cero de relleno

Flujo de datos interpretado por el receptor:
  01111110 0110 11111111111111 10010 01111110
```

---

# 05 – Control y detección de errores

## Perturbaciones de la señal

Necesidad de mecanismos de control en medios físicos:

- **Atenuación:** pérdida de la fuerza y potencia de la señal a medida que viaja a través del medio de transmisión.
- **Distorsión:** deformación de la señal debido a la diferencia en la velocidad de propagación de sus componentes de frecuencia.
- **Ruido:** señales electromagnéticas no deseadas que se acoplan al medio, interfiriendo con la señal original transmitida.

### Objetivo de las técnicas de detección

Determinar si un bloque de datos transmitido a través del medio físico ha sufrido alteraciones debido a las perturbaciones en el trayecto.

## Servicios confiables y no confiables

Las técnicas de detección de errores se aplican a nivel de la capa de enlace, **tanto en servicios confiables como no confiables**.

| Confiables | No confiables |
|---|---|
| Se detectan los errores de la transmisión y se descartan las tramas erróneas. | Se detectan los errores de la transmisión y se descartan las tramas erróneas. |
| Se establecen mecanismos para retransmitir las tramas erróneas de forma segura. | No se retransmiten las tramas erróneas (se delega a capas superiores). |

## Tipos de errores (ej. por ruido)

- **Errores de bits individuales:** un único bit se invierte en el frame debido a perturbaciones y ruido en el canal (cambio de 0 a 1, o de 1 a 0).
- **Errores de ráfaga (burst):** dos o más bits cambian en el frame. No necesariamente son consecutivos, afectando un segmento completo de la transmisión.

## Detección

Técnicas por tipos de errores para comprobar la integridad de los datos.

### Métodos de comprobación

- **Bits de paridad:** técnica básica que solo se puede aplicar a errores individuales.
- **CRC (Redundancia Cíclica):** fácil implementación y el método más utilizado en telecomunicaciones.
- **Checksum:** suma de verificación ampliamente utilizada para validar la integridad de los frames.

## Detección de errores: CRC y Checksum

Ejemplos prácticos de comprobación de integridad en la transmisión de datos.

### Ejemplo 1: Checksum (suma de verificación)

**Criterio:** suma de bloques de 8 bits y complemento a 1.

Se envían dos bytes de datos originales:

- Byte 1: `00001011` (11 en decimal)
- Byte 2: `00000110` (6 en decimal)

1. **Suma binaria de los datos:** `00001011 + 00000110 = 00010001` (17)
2. **Generación del Checksum (complemento a 1):** invertir los bits del resultado anterior: `00010001 → 11101110` (checksum generado)
3. **Validación en el receptor:** suma total incluyendo el checksum: `00010001 + 11101110 = 11111111`. **¡Todo unos!** Significa que no se detectaron errores.

### Ejemplo 2: CRC (Redundancia Cíclica) – versión 1

**Criterio:** división polinómica binaria (XOR).

**Datos (D):** `1011` | **Generador divisor (G):** `101` (grado 2)

1. **Preparación de los datos:** añadir tantos ceros a la derecha como el grado del divisor. Datos extendidos: `101100`
2. **División binaria (XOR repetitivo):** `101100` entre `101` → `101 XOR 101 = 000` (bajar dígitos) → operación sucesiva resulta en residuo: `11`
3. **Trama transmitida (Datos + CRC):** sustituir los ceros añadidos por el residuo obtenido. Trama final a transmitir: `101111`
4. **Validación en el receptor:** se divide la trama `101111` entre `101`. Si el residuo es `00`, la transmisión es correcta.

> Nota: transcripto tal como figura en la diapositiva; el residuo de `101100 ÷ 101` en módulo 2 es en realidad `01`. El ejemplo siguiente está resuelto paso a paso y es consistente.

### Ejemplo 2: CRC (Redundancia Cíclica) – versión 2 (paso a paso)

**Criterio:** división binaria mediante operaciones XOR.

**Datos (D):** `1101` | **Generador (G):** `1011` (grado 3)

1. **Preparación de datos (añadir 3 ceros):** datos extendidos `1101000`
2. **División binaria XOR (paso a paso):**
   - `1101 ⊕ 1011 = 0110` (se baja 0 → `1100`)
   - `1100 ⊕ 1011 = 0111` (se baja 0 → `1110`)
   - `1110 ⊕ 1011 = 0101` (se baja 0 → `1010`)
   - `1010 ⊕ 1011 = 0001` → **residuo (CRC): `001`**
3. **Trama transmitida (Datos + CRC):** trama final `1101001`
4. **Validación en el receptor:** `1101001 ÷ 1011` da un residuo de `000`. Sin errores.

## Corrección de errores

Código de Hamming: detección y ubicación precisa del error en la transmisión.

### Configuración inicial – Ejemplo: Hamming(7,4)

Dentro de los datos a transmitir se insertan bits de paridad en lugares estratégicos.

- **Datos originales:** `1011` (D1=1, D2=0, D3=1, D4=1)
- **Trama con huecos para paridades:** `_ _ 1 _ 0 1 1`

### Cálculo de paridades

**Criterio:** paridad par.

- **P1** (pos. 1) → cubre bits 1, 3, 5, 7: (P1, D1, D2, D4) = (?, 1, 0, 1) → 2 unos → ya es par → **P1 = 0**
- **P2** (pos. 2) → cubre bits 2, 3, 6, 7: (P2, D1, D3, D4) = (?, 1, 1, 1) → 3 unos → impar → **P2 = 1**
- **P4** (pos. 4) → cubre bits 4, 5, 6, 7: (P4, D2, D3, D4) = (?, 0, 1, 1) → 2 unos → ya es par → **P4 = 0**

### Resultado de la transmisión

Se transmite la trama final: `0110011`. El receptor recalcula la paridad: si coinciden no hubo error, de lo contrario se identifica y corrige la posición exacta.

## Detección vs. corrección

| | Detección de errores | Corrección de errores |
|---|---|---|
| Sigla | **ARQ:** Automatic Repeat Request | **FEC:** Forward Error Correction |
| Funcionamiento | El destino sabe que ocurrió un error pero no sabe cuál. Puede o no comunicarlo al origen; el origen retransmite. | El destino detecta el error y lo corrige de forma autónoma. |

---

# 06 – Control de flujo

## El problema

El transmisor genera tramas a más velocidad de las que puede procesar el receptor. ¿Cómo evitar que el emisor sature al receptor?

### Reglas de funcionamiento

Los protocolos de esta capa pueden incorporar mecanismos que regulan la cantidad o el momento en que el transmisor puede enviar tramas, adaptando el envío a la capacidad del receptor.

### Métodos implementados

1. **Parada y Espera:** el emisor aguarda la confirmación antes de enviar la siguiente trama.
2. **Ventana Deslizante:** permite el envío múltiple de tramas optimizando el ancho de banda.

## Parada y Espera

- Es el protocolo más sencillo: el transmisor envía una trama y no puede enviar la siguiente hasta haber recibido la confirmación (**ACK**) correspondiente por parte del receptor.
- De esta manera, el receptor mantiene el control absoluto sobre el flujo de datos, simplemente reteniendo o demorando las confirmaciones según su capacidad de procesamiento.

### Ventaja

Este sistema es eficiente si se envían pocas tramas de gran tamaño.

### Desventajas

En general las tramas suelen ser pequeñas debido a:

- Tamaño limitado de la memoria del receptor.
- Probabilidad de error mayor en tramas largas.
- Necesidad de evitar retardos excesivos a los demás nodos si el medio es compartido.

## Ventana Deslizante

### Protocolo de Ventana Deslizante

Permite al emisor enviar varias tramas (N) antes de recibir una confirmación (ACK), mejorando significativamente el desempeño de la transmisión en la red.

### Funcionamiento y parámetros

- **Tamaño de ventana (N):** define la cantidad de tramas permitidas sin confirmación. Requiere de un vínculo **full dúplex**.
- **Confirmación acumulativa:** el ACK lleva el número del último frame recibido correctamente.
- **Deslizamiento:** con el ACK de la trama 1, una ventana de N=8 se desliza para abarcar las posiciones de la 2 a la 9, transmitiendo de inmediato la trama 9.
- **Control de errores:** los paquetes sin confirmar se mantienen en buffer. Si expira el temporizador individual de una trama, se inicia su retransmisión.

```
(a) Estado inicial de la ventana deslizante
   [ 1  2  3  4  5  6  7  8 ]  9  10 ...

(b) Estado de la ventana una vez deslizada
     1 [ 2  3  4  5  6  7  8  9 ] 10 ...
```

---

# 07 – Acceso al medio en redes MultiAcceso (MA)

1. **El problema:** problema de acceso al medio y métodos básicos para regular y coordinar la transmisión de múltiples nodos sobre un canal físico compartido.
2. **Protocolo CSMA/CD:** acceso múltiple con escucha de portadora y detección de colisiones para mejorar la eficiencia y evitar la pérdida de información en la red.

## Problema de acceso al medio

### Colisiones en el medio

Cuando múltiples nodos transmiten en un mismo medio físico de forma simultánea, las señales se mezclan y dejan de ser interpretables. Esto provoca una **colisión** entre tramas, lo que resulta en la pérdida completa de la información transmitida.

### Objetivos de control

Los métodos de acceso al medio compartido buscan:

- **Regular el acceso:** organizar las transmisiones para tratar de impedir o reducir al mínimo las colisiones entre tramas.
- **Eficiencia del canal:** aprovechar al máximo la capacidad de transmisión y los recursos disponibles en el medio.

## Métodos básicos – ¿Cómo controlo el acceso?

| Método | Descripción | Ejemplos |
|---|---|---|
| **Controlado** | Cada nodo tiene su propio tiempo para utilizar el medio. No hay colisiones. Ejemplo: redes celulares. | TDMA (Time-Division Multiple Access), FDMA (Frequency-Division Multiple Access), CDMA (Code-Division Multiple Access) |
| **Contención** | Todos los nodos compiten de forma activa por el uso del medio compartido, existiendo riesgo de interferencia. | Ethernet (acceso compartido por cable) |

## Acceso controlado

### TDMA – Multiplexión por división en el tiempo

- Sólo transmite una estación a la vez.
- Transmisión ordenada sin colisiones.
- Los dispositivos esperan estrictamente su turno.
- Uso de redes deterministas (paso de tokens).

| Método | Características | Ejemplo |
|---|---|---|
| Acceso controlado | Sólo transmite una estación a la vez; los dispositivos que desean transmitir deben esperar su turno; sin colisiones; algunas redes deterministas utilizan el paso de tokens | Token Ring, FDDI |

```
"Tengo que enviar un paquete       "No tengo nada      "Es mi turno para enviar.
 pero no es mi turno. Esperaré."    para enviar."       Enviaré ahora."
        [PC] ─────────────────────── [PC] ───────────────────── [PC]
                            Medios compartidos
```

### CDMA – Multiplexión por división de código

- Cada transmisor emplea un código matemático único para codificar su señal.
- Múltiples estaciones transmiten simultáneamente sobre la misma frecuencia.
- Los receptores usan el mismo código exclusivo para decodificar la señal deseada.
- Evita colisiones físicas al separar las señales de manera lógica y algorítmica.

### FDMA – Multiplexión por división en frecuencia

- El canal se divide en distintas bandas de frecuencia.
- Cada estación transmite en su frecuencia asignada de forma exclusiva.
- Transmisión simultánea y continua sin interferencias entre canales.
- Uso común en sistemas de comunicación por radio y satélite.

## Acceso por contención

### CSMA – Carrier Sense Multiple Access

- Cualquier dispositivo puede acceder al medio siempre que haya datos para enviar.
- Se denomina **contención** debido a que los equipos de la red se contienen hasta que haya una oportunidad para enviar los datos.

---

# 08 – Protocolos CSMA/CD – CSMA/CA

Acceso por contención: resolución de colisiones y control de transmisión en redes Ethernet y Wireless.

## CSMA/CD – Ethernet 802.3 (Collision Detection)

- Si el medio está libre, envía los datos (*Carrier Sense* – detección de portadora).
- Si detecta colisión, detiene la transmisión y envía una señal de congestión (**jamming**).
- Luego, la estación espera un tiempo aleatorio e intenta la retransmisión (**backoff**).

## CSMA/CA – Redes Wireless 802.11 (Collision Avoidance)

- Diseñado para prevenir colisiones en entornos donde la detección directa no es posible.
- La estación escucha el medio y, si está libre, espera un tiempo de **backoff** aleatorio antes de transmitir.
- Luego de transmitir, espera un **ACK** (acuse de recibo).
- Si el ACK no llega, interpreta que hubo un problema y espera un tiempo aleatorio para retransmitir (backoff).

| | CSMA/CD | CSMA/CA |
|---|---|---|
| Red | Ethernet 802.3 | Wireless 802.11 |
| Estrategia | Detección de colisiones | Evitación de colisiones |
| Si hay colisión / sin ACK | Jamming + backoff aleatorio | Backoff aleatorio y retransmisión |

---

# Comentarios / Preguntas

(Diapositiva de cierre para comentarios y preguntas.)

---

# Key Points – Capa de Enlace

**Funciones de la Capa de Enlace (Capa 2):**

- **Brindar servicios a la capa de red:** entender qué son los servicios con y sin confirmación.
- **Entramado:** qué es el entramado y cómo se hace la delimitación.
- **Control y detección de errores.**
- **Control de flujo:** problema-solución: parada y espera, ventana deslizante.
- **Acceso al medio:** entender los problemas consecuencia del uso de un medio compartido y los dos métodos básicos de control de acceso (controlado y contención). Protocolo de acceso por contención = CSMA. Entender la diferencia entre CD y CA.
