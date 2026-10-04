# Modelo en Capas – Capa 1: Física

> **Flujo de datos:** **Física** → Enlace → Red → Transporte → Aplicación

---

## La capa Física

1. **Introducción**
2. Conceptos básicos
3. Transmisión de señales
4. Transmisión analógica y digital
5. Codificación y modulación
6. Key Points

---

## Modelo de referencia – Capa física

```
Host A            Router 1          Router 2          Host B
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│ Aplicación │ ◄── Protocolo de capa Aplicación ───────► │ Aplicación │
│ Transporte │ ◄── Protocolo de capa Transporte ───────► │ Transporte │
│ Red        │    │ Red        │    │ Red        │    │ Red        │
│ Enlace     │    │ Enlace     │    │ Enlace     │    │ Enlace     │
│ Física     │════│ Física     │════│ Física     │════│ Física     │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
      ══ Protocolo de capa Física (Medio de Transmisión) ══
```

Los protocolos de Aplicación y Transporte son extremo a extremo (Host A – Host B); los routers intermedios solo implementan Red, Enlace y Física.

---

# 01 – Introducción

## Introducción

- La capa física se ocupa de la **transmisión de bits** a lo largo de un canal de comunicación (dispositivos directamente conectados).
- Su diseño está orientado a lograr que cuando un extremo envía un bit con valor 1, éste se reciba en el otro extremo como un bit con ese valor, y no como un bit de valor 0.
- Una transmisión exitosa depende de la **calidad de la señal** en el receptor. Ésta es afectada por las características físicas del medio de transmisión y el ambiente al que está sometido.

## Introducción (resumen)

| Tema | Descripción |
|---|---|
| **Transmisión de bits** | La capa física se ocupa de la transmisión de bits a lo largo de un canal de comunicación entre dispositivos directamente conectados. |
| **Diseño** | Diseñado para que cuando un extremo envía un bit con valor 1, este se reciba exactamente con el mismo valor en el otro extremo, y no como 0. |
| **Factores de éxito** | La transmisión exitosa depende de la calidad de la señal, afectada por las propiedades físicas del medio y las condiciones ambientales. |

---

# 02 – Conceptos básicos

## Sistema de comunicación

```
 TRANSMISOR (Tx)          MEDIO DE TRANSMISIÓN          RECEPTOR (Rx)
     (PC)          ───────────────────────────────►      (Router)
   1100011                                                1100011
```

| Componente | Función |
|---|---|
| **Transmisor (Tx)** – ej.: PC | Adapta la información a transmitir al medio de transmisión generando señales. |
| **Medio de transmisión** | Transporta las señales que contienen la información hasta el sitio donde está el receptor. |
| **Receptor (Rx)** – ej.: Router | Toma la señal del medio, la interpreta y la entrega a su destinatario. |

## Señales

**Señal:** representación física de los datos o el mensaje a transmitir.

| Tipo | Descripción |
|---|---|
| **Señal eléctrica** | Se propaga por un conductor eléctrico. |
| **Señal de radio** | Señal electromagnética que se propaga por el aire o guías de onda. |
| **Señal óptica** | Señal de luz que se propaga por el aire o un medio guiado como la fibra óptica. |

## Señal analógica o continua

- La intensidad de la señal varía de forma continua a lo largo del tiempo.
- Toma valores en un conjunto infinito.

```
 A (amplitud)
 │    ╭─╮        ╭──╮
 │  ╭─╯ ╰╮    ╭──╯  ╰╮
 │──╯     ╰────╯       ╰──  t
```

**Amplitud de la señal:** variación continua tomando un conjunto infinito de valores a lo largo del tiempo.

## Señal digital o discreta

- La intensidad de la señal mantiene un nivel constante por un período de tiempo y luego cambia a otro nivel constante.
- Toma valores discretos en un conjunto finito.

```
 Nivel alto  ┐   ┌───┐   ┌──
             │   │   │   │
 Nivel bajo ─┘───┘   └───┘
     flanco de subida ↑   ↓ flanco de bajada
```

- **Señal digital ideal** vs. **transición e impulso real** (los flancos reales no son verticales).
- Fuente de la figura: Wikipedia.

## Dominio temporal y dominio de frecuencia

- **Dominio temporal:** señal periódica con período **T = 1 ms**.
- **Dominio de frecuencia:** componente a **F = 1 kHz**.

Una señal periódica, que se repite en el tiempo, tiene asociada la **frecuencia de repetición** (cuántas veces por segundo).

## Espectro y ancho de banda de una señal

| # | Concepto | Descripción |
|---|---|---|
| 01 | **Espectro** | El espectro de una señal es el rango de frecuencias que contiene. |
| 02 | **Ancho de banda absoluto** | El ancho de banda analógico absoluto es el ancho del espectro y las variaciones en un período de tiempo. |
| 03 | **Ancho de banda efectivo** | La banda relativamente pequeña en la cual está contenida la mayor parte de la energía de la señal. Ej.: voz humana, 4 kHz. |
| 04 | **Multiplexación** | En un mismo medio físico pueden viajar distintas señales de igual o distinto ancho de banda simultáneamente. |

---

# 03 – Transmisión de señales

## Transmisión de señales

La **transmisión** es la comunicación de datos por medio de la propagación y procesamiento de señales. En este proceso es fundamental diferenciar dos elementos clave:

| Elemento | Descripción |
|---|---|
| **Datos** | Representan las entidades que tienen un significado o aportan información específica para ser procesada o transmitida. |
| **Señales** | Constituyen la representación física y el vehículo de transporte de los datos. Pueden presentarse de forma eléctrica, electromagnética u óptica. |

## Otros elementos a considerar

### Factores en la transmisión

1. **Ruido e interferencia:** señales adicionales no deseadas que se introducen entre el Tx (transmisor) y el Rx (receptor), alterando la señal original.
2. **Propagación:** desplazamiento de la energía (bits) a través del medio físico. Su velocidad varía por el canal y la frecuencia, experimentando:
   - Atenuación
   - Distorsión
3. **Ancho de banda:** rango de frecuencias que el canal físico puede soportar de manera efectiva para la transmisión de datos.

### Límite de Shannon

Capacidad máxima teórica para un canal de comunicación lineal:

```
C = B × log₂(1 + S/N)
```

- **C** = capacidad máxima del canal en bits por segundo (bps).
- **B** = ancho de banda del canal en Hertz (Hz) / frecuencia máxima.
- **S** = potencia de la señal útil (*signal power*).
- **N** = potencia del ruido de interferencia (*noise power*).
- **S/N** = relación señal a ruido (SNR).

## Ruido e interferencias

### Conceptos clave

- **Relación Señal a Ruido (SNR):** siempre es importante mantenerla lo más alta posible para evitar errores de transmisión.
- **Corrupción de bits:** un exceso de ruido puede transformar un 1 en un 0 (o un 0 en un 1), destruyendo los datos por completo.

| Tipo de señal | Efecto del ruido |
|---|---|
| **Señal digital** | La distorsión por ruido puede alterar y corromper los valores binarios. |
| **Señal analógica** | El ruido se suma directamente a la señal original degradando la onda. |

## Ruido e interferencias – Tipos

| Tipo | Descripción | Ejemplos / efecto |
|---|---|---|
| **Ruido térmico** | También conocido como *ruido blanco*. Se distribuye uniformemente en todo el espectro. No se puede evitar, pero por lo general es relativamente insignificante en comparación con las señales. | – |
| **Ruido impulsivo** | Es impredecible, de corta duración y posee una gran amplitud. | Interruptores eléctricos, encendido y apagado de motores, etc. |
| **Interferencia** | Señales externas que se acoplan en el medio de transmisión, interfiriendo la señal original. | Artefactos de iluminación, motores eléctricos, sistemas de radio. |
| **Diafonía** | Se produce cuando las señales de líneas físicamente adyacentes se acoplan entre sí. | Interferencia electromagnética mutua entre cables o canales cercanos. |

## Durante la propagación las señales sufren…

### Atenuación

- Durante la propagación la amplitud de la señal disminuye con la distancia.
- Todo medio es afectado de forma distinta.
- Se puede mejorar cambiando de medio o utilizando **repetidores**.
- La potencia de la señal recibida tiene que ser suficiente para ser detectada.

### Distorsión

- La velocidad de propagación varía con la frecuencia.
- La atenuación varía con la frecuencia.
- **Consecuencia:** las señales se deforman cuando atraviesan un medio de transmisión.

## Ancho de banda de transmisión

### Conceptos clave

- Es la medición de la cantidad de información que puede fluir desde un lugar hacia otro en un período de tiempo determinado.
- La unidad de medición del ancho de banda es **bits por segundo (bps)**.
- La **velocidad real** a la cual se pueden transmitir los datos está limitada por el transmisor, el receptor, el medio, etc.

### Ejemplo práctico

Pendrive de 128 GB viajando a Buenos Aires desde Montevideo en 3 horas.

Velocidad de transferencia:

```
128 · 1024 · 1024 · 1024 · 8
────────────────────────────  ≈  101,81 Mbps
          3 · 3600
```

> **Ejercicio:** ¿Cuánto tiempo es necesario para transferir el contenido con un enlace de 10 Mbps?

---

# 04 – Transmisión analógica y digital

## Transmisión de señales analógicas

- **Reproducción fiel:** permite una reproducción fiel y exacta de la señal original en condiciones de transmisión óptimas.
- **Compatibilidad:** la transmisión analógica de datos se adecúa con facilidad y naturalidad a los sistemas y canales ya existentes.
- **Efecto del ruido:** los amplificadores intermedios amplifican la señal junto con el ruido. Sin reconstrucción de datos, la señal se debilita en trayectos largos.

## Transmisión de información digital

- **Origen digital:** los datos transmitidos son digitales por naturaleza o analógicos ya digitalizados.
- **Sin acumulación:** el ruido no es acumulativo en los puntos de regeneración, al reconstruirse los datos.
- **Cuantificación:** existe ruido de cuantificación al representar señales analógicas con digitales.
- **Sincronismo:** se requiere mantener la misma información de tiempo entre emisor y receptor.

## Transmisión de información digital (cont.)

- **Integridad:** integridad total de los datos durante el proceso de transmisión.
- **Inmunidad:** inmunidad al ruido, con la capacidad de regenerar la señal original.
- **Seguridad:** transmisión segura y privada mediante encriptación y autenticación.
- **Integración:** permite la integración eficiente de distintos tipos de datos.

---

# 05 – Codificación y modulación

## Transmisión

### Acondicionamiento de señal

**Primer problema:** expresar los datos y acondicionarlos al medio de transmisión (Tx). Involucra procesos fundamentales de **codificación** y **modulación** para adaptar la información al canal físico.

### Método de transporte

**Segundo problema:** definir el método que se debe utilizar para transportar los datos.

- **Señal banda base:** contiene los datos directamente en su banda de frecuencias original.
- **Señal portadora:** señal que se utiliza para transportar el mensaje en el medio de transmisión.

## Codificación

### Proceso de conversión

- **Definición:** significa convertir los datos binarios en una forma que se pueda desplazar a través de un enlace de comunicaciones físico.
- **Propósito:** adaptar la información lógica (1s y 0s) para que pueda ser transmitida por los distintos medios de transmisión de manera efectiva.

### Representación física

**Conversión a señales:** consiste en transformar los bits en fenómenos reales y físicos según el medio:

- **Pulso eléctrico:** en un cable de cobre.
- **Pulso luminoso:** en una fibra óptica.
- **Ondas electromagnéticas:** en el espacio libre.

## Ejemplos: codificación / modulación

### Banda base

Figuras de la diapositiva:

- Secuencia de bits `0 1 1 0 0 0 1 1 0 1 0 0` representada con dos niveles (Pegel 1 / Pegel 2).
- Código **NRZ-L**.
- Codificación **Manchester** (según G. E. Thomas y según IEEE 802.3), con las señales de reloj (*Clock*) y datos (*Data*) para la secuencia `1 0 1 0 0 1 1 1 0 0 1 1`.
- Captura de Ethernet 10BASE-T con dirección MAC codificada en Manchester (`0D Hex = 0000,1101 Binary`).

### Modulación (portadora)

- Información binaria transmitida y su modulación **ASK**, **FSK** y **PSK**.
- **8-QAM** (2 amplitudes, 4 fases): cada símbolo codifica 3 bits (`101 100 001 000 010 011 110 111`).

## Interpretando señales digitales…

### Requisitos de interpretación

- **Sincronización:** tiempo de bits/símbolos (inicio y fin).
- **Umbrales:** identificación de niveles y fases de la señal.

### Factores de degradación

- **Relación Señal/Ruido (SNR):** determina la claridad ante el ruido.
- **Ancho de banda:** limitación física del medio de transmisión.

| Canal | Descripción |
|---|---|
| **Canal ideal** | Puntos de decisión claramente definidos en el espacio de fase (diagrama de constelación). |
| **Canal con ruido** | Efecto de dispersión que dificulta la correcta interpretación de bits. |

---

# 06 – Comentarios y Key Points

## Comentarios

Preguntas.

## Key Points – Capa Física

**Conceptos:**

- Función de la capa física
- Sistemas de transmisión – componentes
- Señales – definición – tipos de señales usadas
- Señales analógicas y digitales – definición
- Ancho de banda de una señal – definición
- Ancho de banda de transmisión – definición
