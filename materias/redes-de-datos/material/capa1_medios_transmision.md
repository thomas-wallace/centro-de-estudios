# Modelo en Capas – Capa 1: Física – Medios de Transmisión

> **Flujo de datos:** **Física** → Enlace → Red → Transporte → Aplicación

---

## Índice

1. **Sistema de comunicación y medios de transmisión**
2. **Medios guiados:** cable coaxial, par de cobre (UTP, FTP, STP), Ethernet IEEE 802.3
3. **Medios guiados:** fibra óptica
4. **Medios no guiados:** espectro de frecuencias, microondas, redes celulares, enlaces satelitales
5. Key Points

---

# 01 – Sistema de comunicación y medios de transmisión

## Sistema de comunicación

```
 TRANSMISOR (Tx)        MEDIO DE TRANSMISIÓN         RECEPTOR (Rx)
┌──────────────┐  1100011  ┌───────────────────┐  1100011  ┌──────────────┐
│      PC      │ ────────► │   SEÑAL DIGITAL   │ ────────► │    Router    │
└──────────────┘           │      1100011      │           └──────────────┘
                           └───────────────────┘
```

## Medios de transmisión

**Cualquier medio capaz de llevar información de la fuente al destino.**

| N.º | Medio | Descripción |
|---|---|---|
| 01 | **Cable UTP** | Cable de par trenzado estándar para redes de datos locales. |
| 02 | **Cable coaxial** | Alta protección contra interferencias, ideal para TV y banda ancha. |
| 03 | **Fibra óptica** | Transmisión por pulsos de luz con velocidad y ancho de banda masivos. |
| 04 | **Enlaces radio** | Conexión inalámbrica terrestre directa de punto a punto. |
| 05 | **Satélite** | Comunicación inalámbrica de gran alcance global mediante satélites. |

## Clasificación de medios de transmisión

| Guiados | No guiados |
|---|---|
| Coaxial | Infrarrojos (IR) |
| Par de cobre | Radio Frecuencia (RF) |
| Fibra óptica | Microondas |

---

# 02 – Medios guiados

## Medios guiados

- Cable coaxial
- Par de cobre
- Fibra óptica

## Cable coaxial – Distintos tipos y aplicaciones

### Estructura del cable

*(Diapositiva con imágenes del cable coaxial y su estructura.)*

### Banda base – Z = 50 Ω

- **Transmisión digital:** utilizado principalmente en viejas redes LAN.
- **Aplicaciones comunes:** antenas de radio, TV profesional, radioaficionados, estaciones base de celulares a antenas, antenas Yagi, parabólicas o sectoriales.

### Banda ancha – Z = 75 Ω

- **Transmisión analógica:** ideal para televisión por cable y distribución de audio y video.
- **Conexión local:** enlace de corto alcance para equipos de transmisión.
- **Rendimiento:** ancho de banda de 500 MHz (hasta 1 GHz con cables modernos).

---

## Par de cobre – Tipos y características

### Cable plano (telefonía)

- **Cortas distancias:** limitado a enlaces de alcance reducido.
- **Interferencia:** altamente propenso a problemas de ruido electromagnético y acople capacitivo debido a la falta de trenzado.

### Par trenzado

- **Inmunidad mejorada:** mayor protección contra el ruido y la diafonía respecto al cable plano.
- **Variantes del estándar:**
  - **UTP** (Unshielded Twisted Pair)
  - **FTP** (Foiled Twisted Pair)
  - **STP** (Shielded Twisted Pair)

## Cable UTP – Características y rendimiento

### Estructura del cable

*(Diapositiva con imágenes de la estructura del cable.)*

### Características del cable

- **Sin blindaje:** entre cada una de las parejas de cables no existe un medio de separación física.
- **Bajo costo:** es una solución de cableado sumamente económica y eficiente.
- **Uso común:** utilizado casi siempre en redes locales (LAN) de corta distancia.

### Rendimiento y factores

- **Alta velocidad:** soporta tasas de transmisión de hasta 1/10 Gbps en entornos LAN.
- **Atenuación:** al estar más expuestos, la señal se degrada si no se coloca un repetidor.
- **Variables de calidad:** su comportamiento depende del paso del trenzado y calibre del alambre.

## Cable FTP – Par trenzado apantallado

### Estructura del cable

*(Diapositiva con imágenes de la estructura del cable.)*

### Características de diseño

- **Separación física:** los pares trenzados están separados entre ellos por plástico o material no conductor.
- **Apantallamiento global:** una pantalla de aluminio envuelve a todo el grupo de pares (no es individual).

### Rendimiento y comparativa

- **Frente a STP:** no cuenta con tan buenas prestaciones como los cables STP de blindaje individual.
- **Frente a UTP:** ofrecen una notable mejora frente a los UTP en cuanto a distancia y aislamiento de señal.

## Cable STP – Par trenzado blindado individual

### Características de diseño

- **Blindaje individual:** cada uno de los pares trenzados está rodeado de una cubierta de protección hecha de aluminio.
- **Protección superior:** ofrece un excelente aislamiento contra interferencias electromagnéticas externas en entornos ruidosos.

### Rendimiento y aplicaciones

- **Altas prestaciones:** se utilizan en redes de altas prestaciones que requieren gran ancho de banda, baja latencia y bajas tasas de error.
- **Mayor distancia y costo:** aunque son cables más costosos, permiten cubrir mayores distancias de transmisión sin necesidad de usar repetidores.

### Estructura del cable

*(Diapositiva con imágenes de la estructura del cable.)*

---

## Guía de referencia: familias y categorías de cables de red

| Familia de cable | Categoría | Norma ISO/IEC | ¿Qué implica esta variante en su diseño? | Velocidad máxima |
|---|---|---|---|---|
| **UTP** (sin blindaje) | Cat 5e | U/UTP | El más básico. 4 pares trenzados de cobre recubiertos solo por el plástico exterior. | 1 Gbps (100 m) |
| UTP | Cat 6 | U/UTP | Añade una cruceta plástica central interna para separar físicamente los pares. | 1 Gbps (100 m); 10 Gbps (< 55 m) |
| UTP | Cat 6A | U/UTP | El cable es mucho más grueso. El plástico interno aísla del Alien Crosstalk sin usar metal. | 10 Gbps (100 m) |
| UTP | Cat 7/7A/8 | No existe | **¡Prohibido por norma!** Exige blindaje metálico obligatorio. | No aplica |
| **FTP** (lámina global) | Cat 5e | F/UTP | Una sola lámina de aluminio envuelve a los 4 pares juntos para frenar ruido externo. | 1 Gbps (100 m) |
| FTP | Cat 6 | F/UTP | Combina la cruceta plástica interna con la lámina de aluminio global externa. | 1 Gbps (100 m); 10 Gbps (< 55 m) |
| FTP | Cat 6A | F/UTP o U/FTP | Puede llevar lámina global (F/UTP) o una lámina independiente por cada par (U/FTP). | 10 Gbps (100 m) |
| FTP | Cat 7 | F/FTP | Doble lámina de aluminio: una global exterior y otra independiente para cada par de hilos. | 10 Gbps (100 m) |
| **STP** (malla + lámina) | Cat 6A | S/FTP | Variante industrial rara. Malla trenzada de cobre global exterior + lámina por cada par. | 10 Gbps (100 m) |
| STP | Cat 7 | S/FTP | Obligatorio por norma. Malla metálica global de cobre y lámina en cada par. | 10 Gbps (100 m) |
| STP | Cat 7A | S/FTP | Obligatorio por norma. Malla global más densa de cobre. Soporta hasta 1 GHz. | 10 Gbps (100 m) |
| STP | Cat 8 | S/FTP | Obligatorio por norma. Blindaje masivo de cobre para 2 GHz. Reduce distancia. | 25 a 40 Gbps (30 m) |

---

## Ethernet IEEE 802.3 – Características físicas de la transmisión

### Cable coaxial

| Estándar | Velocidad | Medio |
|---|---|---|
| 802.3 (10Base5) | 10 Mb/s | Coaxial grueso |
| 802.3a (10Base2) | 10 Mb/s | Coaxial fino |

### Par trenzado

| Estándar | Velocidad | Medio |
|---|---|---|
| 802.3i (10Base-T) | 10 Mb/s | Par trenzado |
| 802.3u (100Base-TX) | 100 Mb/s | Par trenzado |
| 802.3ab (1000Base-T) | 1 Gb/s | Par trenzado |
| 802.an (10GBase-T) | 10 Gb/s | Par trenzado (2006) |

### Fibra óptica

| Estándar | Velocidad | Medio |
|---|---|---|
| 802.3j (10Base-FL) | 10 Mb/s | Fibra óptica |
| 802.3u (100Base-FX/SX) | 100 Mb/s | Fibra óptica |
| 802.3z (1000Base-SX/LX) | 1 Gb/s | Fibra óptica |
| 802.3ae (10GBase-SR/LR…) | 10 Gb/s | Fibra óptica |

## Ethernet 802.3 – Nomenclatura

### 1. Velocidad de datos

Indica el ancho de banda nominal de la conexión física.

- **10** — 10 Mbps
- **100** — 100 Mbps (Fast Ethernet)
- **1000 / 1G** — 1 Gbps (Gigabit)
- **10G** — 10 Gbps

### 2. Transmisión

Define el método de propagación de la señal por el medio.

- **BASE** — Baseband (banda base). Señal digital sin modular. Estándar absoluto en LAN.
- **BROAD** — Broadband (banda ancha). Canal multiplexado (en desuso en Ethernet local).

### 3. Medio / alcance

Identifica el tipo de cable físico o la distancia límite.

- **T** — Twisted Pair (par trenzado de cobre como Cat 6A o 7).
- **X** — Codificación especial para conexiones de alta velocidad.
- **S / L / E** — Fibra óptica (Short, Long, Extended: alcance para distintas distancias).

## IEEE 802.3 – Desglose de 100Base-T

| Parte | Significado | Descripción |
|---|---|---|
| **100** | Velocidad | Velocidad de transmisión de 100 Mbps (Megabits por segundo). |
| **Base** | Transmisión | Transmisión en banda base: se transmite una señal sin modular. |
| **T** | Medio | Uso de cableado de par trenzado (Twisted Pair). |

---

# 03 – Fibra óptica

## Fibra óptica – Componentes

### Estructura del cable

#### Núcleo y elementos conductores

- **Núcleo:** funciona como refuerzo para evitar la rotura y deformación del cable.
- **Hilos de fibra:** el elemento conductor real por donde viajan la luz y los datos.
- **Buffer y cladding:** revestimiento protector (gel) que evita que la luz se escape.

#### Capas de protección y aislamiento

- **Capas aislantes:** aislante fabricado en material dieléctrico no conductor.
- **Armadura:** construida en material liviano e ignífugo de alta resistencia (ej. Kevlar).
- **Recubrimiento exterior:** capa de PVC o plástico resistente para protección ambiental estándar.

*(Diapositivas siguientes: fotografías de distintos cables de fibra óptica, y el esquema "Cómo funciona la fibra óptica" con sus tres capas: **núcleo**, **revestimiento** y **recubrimiento**. Ref: https://makeagif.com/gif/avances-tecnologicos-fibra-optica-xbf2QE)*

## Fibra óptica – Funcionamiento

```
 Transmisor              Fibra óptica              Receptor
 (Fuente de luz)                                   (Detector de luz)
 Convierte la señal      ┌───────────────┐         Convierte la luz
 eléctrica de entrada ─► │ reflexión     │ ──────► en señal eléctrica
 en una óptica           │ total interna │         (salida)
 (Tranceiver)            └───────────────┘
 Entrada eléctrica                                 Señal eléctrica
 (Salida)                                          (salida)
```

### Ventanas ópticas dentro del espectro

| Ventana | Longitud de onda | Se utiliza en |
|---|---|---|
| 1.ª ventana (MM) | 800 – 900 nm | 850 nm |
| 2.ª ventana (MM, SM) | 1250 – 1350 nm | 1300 nm |
| 3.ª ventana (SM) | 1500 – 1600 nm | 1550 nm |

Referencia del espectro (mayor frecuencia / menor longitud de onda → menor frecuencia / mayor longitud de onda): Ultravioleta 400 nm, Violeta 455 nm, Azul 490 nm, Verde 550 nm, Amarillo 580 nm, Naranja 620 nm, Rojo 750 nm (espectro visible); Infrarrojo 800 nm, 850 nm, 1300 nm, 1550 nm (fibras ópticas); microondas; RF.

## Fenómeno de reflexión total interna

- **Núcleo (n₁):** medio de mayor índice.
- **Cubierta (n₂):** medio de menor índice.
- **Haz reflejado:** no se refracta luz hacia n₂.
- **Interfaz** entre dos medios.

### ¿Por qué no se escapa la luz?

La cubierta y el núcleo están fabricados con distintos tipos de vidrio que poseen diferentes índices de refracción. Esta variación obliga a que la luz se refleje internamente de forma constante al incidir sobre la frontera de ambos medios.

### Ley de Snell y ángulo crítico

```
n₁ · sen(θc) = n₂ · sen(90°)
```

- **n₁:** índice de refracción del núcleo.
- **n₂:** índice de refracción del revestimiento o cubierta.

El **ángulo crítico (θc)** es el ángulo de incidencia mínimo necesario para que ocurra la reflexión interna total.

## Tipos de fibra

| | **Multimodo** | **Monomodo** |
|---|---|---|
| Propagación | Propaga varios modos o caminos | Propaga un solo modo o camino |
| Núcleo | 62.5 μm ó 50 μm | 8 a 10 μm |
| Cubierta | 125 μm | 125 μm |
| Fuente de luz | LEDs de baja intensidad | LASER de alta intensidad |
| Alcance | Máxima longitud recomendada: 2 Km (850 nm) | Máxima longitud teórica: 10 Km (sin repetidores) |
| Uso | Transmisiones de más corto alcance; más baratas y fáciles de instalar | Largo alcance y alta velocidad (hasta 800 Gbps) |

### Fibras – Multimodo

- Tiene un núcleo grande (fácil de acoplar).
- Muchos rayos de luz (o modos) se pueden propagar simultáneamente. Cada modo sigue su propio camino.
- Luz generada por LEDs de baja intensidad.
- La máxima longitud recomendada del cable es de 2 Km (850 nm).
- Se usa para transmisiones de más corto alcance, siendo además más baratas y fáciles de instalar.

### Fibras – Monomodo

- Tiene un núcleo más pequeño (referencia: cabello humano, 100 μm).
- Solo se propaga un rayo de luz (o modo).
- Luz generada por LASER de alta intensidad.
- La máxima longitud teórica es de 10 Km (sin repetidores).
- Se usa para transmisiones de largo alcance y alta velocidad (hasta 800 Gbps).

## Nuevos estándares de fibras

| Estándar IEEE | Longitud | Tipo de fibra |
|---|---|---|
| 400GBASE-SR16 | 100 m | multimodo |
| 400GBASE-SR8 | 100 m | multimodo |
| 400GBASE-DR4 | 500 m | monomodo |
| 400GBASE-FR8 | 2 km | monomodo |
| 400GBASE-LR8 | 10 km | monomodo |
| 800GBASE-SR8 | 60-100 m | multimodo |
| 800GBASE-DR8 | 500 m | monomodo |
| 800GBASE-FR8 / LR8 | 2 / 10 Km | monomodo |

## Fibra óptica – Conectores

### Conector LC (Lucent / Little Connector)

- **Origen:** desarrollado por Lucent Technologies.
- **Características:** ajuste similar a un RJ45 (tipo push and pull). Más seguro y compacto que el SC, permitiendo mayores densidades en racks, paneles y proyectos FTTH.
- **Rendimiento óptico:** compatible con fibras monomodo y multimodo. Presenta pérdidas promedio muy bajas de apenas 0,10 dB.

### Conector ST (Straight Tip)

- **Origen:** desarrollado en EE.UU. por AT&T. Ampliamente utilizado en entornos profesionales, redes corporativas y aplicaciones militares.
- **Características:** diseño similar en forma al conector japonés FC, pero incorpora un sistema de ajuste por bayoneta similar al de un conector BNC.
- **Rendimiento óptico:** se utiliza principalmente en fibras multimodo, con pérdidas de inserción típicas que rondan los 0,25 dB.

### Conector FC (Ferrule Connector)

- **Origen:** desarrollado por Nippon Telegraph and Telephone, fue el primero con férula cerámica. Su uso decrece frente a SC y LC.
- **Características:** roscado con fijación muy resistente a vibraciones. Ideal para aplicaciones en movimiento, instrumentos de precisión y CATV.
- **Óptica:** fibras monomodo con pérdidas de inserción de ~0,3 dB.

### Conector SC (Subscriber Connector)

- **Origen:** desarrollado por Nippon Telegraph and Telephone. Su bajo costo de fabricación lo ha convertido en el más popular.
- **Características:** ajuste rápido a presión, compacto y de alta densidad. Amplio uso en FTTH, telefonía, televisión por cable, etc.
- **Óptica:** fibras monomodo y multimodo con pérdidas de ~0,25 dB.

### Resumen comparativo

| Conector | Origen | Fibra | Pérdida típica | Ajuste |
|---|---|---|---|---|
| LC | Lucent Technologies | Monomodo y multimodo | ~0,10 dB | Push and pull (tipo RJ45) |
| ST | AT&T (EE.UU.) | Principalmente multimodo | ~0,25 dB | Bayoneta (tipo BNC) |
| FC | Nippon Telegraph and Telephone | Monomodo | ~0,3 dB | Roscado |
| SC | Nippon Telegraph and Telephone | Monomodo y multimodo | ~0,25 dB | Presión rápida |

## Fibra óptica – Ventajas y desventajas

### Ventajas

- Gran ancho de banda respecto de otros medios.
- Inmune a ruido electromagnético.
- Transmisión a largas distancias sin necesidad de repetidores.
- Ideal para cableado vertical de LANs y otras aplicaciones en redes de transmisión nacionales e internacionales.

### Desventajas

- Despliegue en terrenos "difíciles".
- Corte de cables.
- Costo para alcanzar grandes distancias, respecto de una solución inalámbrica.

## Fibra óptica – Cable submarino y mapa mundial

*(Diapositivas con imágenes.)*

- **Estructura y tendido de cable submarino con repetidores:**
  - Estructura del cable: armadura de acero, cubierta de polietileno, tubo metálico con conductor, fibras ópticas.
  - Proceso de tendido: barco cablero ("continuous cable, continuous stern") y **repetidores ópticos** aprox. cada 60-100 km.
  - Multiplexación por División de Longitud de Onda (**WDM**) permite múltiples canales de datos por fibra.
  - Escalabilidad para aumentar la capacidad con actualizaciones de equipos en los extremos.
  - Eficiencia espectral óptima para maximizar el uso de cada fibra.
  - Capacidad de transmisión: inicial (ej. 100 Tbps), total potencial (ej. 250+ Tbps), velocidad de transmisión (ej. 400 Gbps por canal).
- **Estructura de un cable de fibra multi-hilo:** Optical Fiber Core, Cladding, Protective Buffer, Aramid Yarn Strength Member, Insulation Layer, Outer Polyethylene Jacket.
- **ANTEL – Conectividad Internacional:** cables submarinos hacia EE.UU. (Ashburn, Virginia Beach, Boca Ratón, Miami), Brasil (São Paulo, Río de Janeiro, Santos, Fortaleza) y Argentina/Uruguay/Chile (Buenos Aires, Pando, Maldonado, Las Toninas, Santiago; Bicentenario, Unisur 2.0, Tannat, Monet).
- **Fibra óptica – Mapa mundial** de cables submarinos (se destaca el cable **Tannat**).

---

# 04 – Medios no guiados

## Medios no guiados

- **Infrarrojo**
- **Radiofrecuencia**
- **Microondas**

### Radio enlace terrestre

- Microondas digitales direccionales.
- Medios omni-direccionales (redes celulares).

### Radio enlace satelital

- Satélites geoestacionarios: 36.000 Km.
- Satélites LEO y MEO: 750 Km y 15.000 Km.

## Espectro de frecuencias

### Espectro electromagnético – Bandas de radiofrecuencia

Clasificación del espectro y sus aplicaciones principales.

| Banda | Rango | Aplicaciones |
|---|---|---|
| **MF** | 300 KHz a 3 MHz | Radio AM |
| **HF** | 3 MHz a 30 MHz | Banda ciudadana, radioaficionados |
| **VHF** | 30 MHz a 300 MHz | Radio FM, televisión |
| **UHF** | 300 MHz a 3 GHz | Radio enlaces terrestres, redes celulares |
| **SHF** | 3 GHz a 30 GHz | Radio enlaces microondas, comunicación vía satélite |

### Tabla del espectro de frecuencias

| Nombre del rango | Abrev. | Frecuencia | Longitud de onda | Servicios comunes | Características de las ondas |
|---|---|---|---|---|---|
| Extremely Low Frequency | ELF | < 3 Hz | > 100.000 km | Comunicaciones submarinas militares | Alta penetración, muy baja velocidad de datos |
| Super Low Frequency | SLF | 3 – 30 Hz | 100.000 – 10.000 km | Comunicaciones militares | Penetran agua y tierra profundamente |
| Ultra Low Frequency | ULF | 30 – 300 Hz | 10.000 – 1.000 km | Comunicaciones mineras y submarinas | Poca atenuación en la tierra |
| Very Low Frequency | VLF | 3 – 30 kHz | 100 – 10 km | Navegación, submarinos | Ondas estables, buena propagación terrestre |
| Low Frequency | LF | 30 – 300 kHz | 10 – 1 km | Radio navegación (LORAN), NDB, radio AM | Poca atenuación, sigue la curvatura terrestre |
| Medium Frequency | MF | 300 – 3.000 kHz | 1 km – 100 m | Radio AM | Propagación terrestre y nocturna por ionósfera |
| High Frequency | HF | 3 – 30 MHz | 100 – 10 m | Radio de onda corta, comunicaciones aéreas y marinas | Reflejada por la ionósfera, ideal para larga distancia |
| Very High Frequency | VHF | 30 – 300 MHz | 10 – 1 m | Radio FM, TV (canales bajos), radio aeronáutica | Línea de vista, baja interferencia |
| Ultra High Frequency | UHF | 300 – 3.000 MHz | 1 m – 10 cm | TV digital, celulares, GPS, Wi-Fi (2.4 GHz) | Mayor capacidad de datos, menor alcance |
| Super High Frequency | SHF | 3 – 30 GHz | 10 – 1 cm | Radar, satélites, Wi-Fi (5 GHz), microondas | Alta direccionalidad, requiere línea de vista |
| Extremely High Frequency | EHF | 30 – 300 GHz | 1 cm – 1 mm | Comunicaciones satelitales, radares militares, 5G mmWave | Alta velocidad, muy corto alcance, afecta la lluvia |
| Terahertz | THz | 300 GHz – 3 THz | 1 mm – 100 μm | Investigación científica, seguridad, imagen médica | Altamente atenuadas por la atmósfera |

## Ondas de radiofrecuencia (RF)

### Desde 30 MHz hasta 1 GHz

- Transmisión de radio AM (530 kHz a 1700 kHz, MF) y FM (88 a 108 MHz, VHF).
- Radio marítima.
- Televisión.
- Teléfonos inalámbricos.

### Desde 2 GHz hasta 40 GHz – Microondas

- Telefonía móvil.
- Comunicaciones por satélite.
- Redes LAN inalámbricas.

### Infrarrojos

- Conexiones de datos locales (PAN).

## Microondas

### Enlaces punto a punto

Los radioenlaces de datos se utilizan especialmente en zonas donde el tendido de fibra óptica no resulta viable.

#### Línea de vista (LoS)

- Requiere una trayectoria totalmente libre de obstáculos entre emisor y receptor.
- Se ve limitada por la curvatura de la Tierra.
- Límites de distancia práctica: de 30 a 50 km en bandas bajas, y aún menor en bandas altas.

#### Sensibilidad atmosférica

- A frecuencias elevadas (especialmente EHF), el clima genera fuerte atenuación por lluvia y humedad.
- En la banda de 60 GHz, las moléculas de oxígeno absorben intensamente la señal.
- Esta absorción extrema limita el alcance efectivo a aproximadamente 1 km.

#### Requisitos de antena

- Exige el uso de antenas direccionales que deben estar sumamente alineadas.
- Los tipos de antena más comunes en estos sistemas son las de tipo parabólica.
- También se emplean configuraciones de panel con guía de onda para dirigir el haz.

### Microondas – Enlace dedicado

- Conexión de Internet por antena para zonas rurales y empresas.
- Infraestructura basada en radioenlace microondas directo.
- Velocidades de transferencia simétricas de hasta 100 Mbps.
- **Capacidad máxima:** 100 Mbps (velocidad de canal dedicado).

---

## Redes celulares

*(Diapositiva con la arquitectura 2G.)*

### Evolución tecnológica

Relación entre la evolución de las generaciones, frecuencias utilizadas y técnicas de acceso al medio.

| Generación | Frecuencia | Acceso al medio | Características |
|---|---|---|---|
| **1G** | 800 MHz | FDMA (frecuencia) | Voz analógica, sin seguridad. Canales estrechos de 30 kHz. Cada usuario con canal exclusivo. |
| **2G** | 900 / 1800 / 1900 MHz | TDMA / CDMA (tiempo/código) | Voz digital y SMS básicos. Mayor disponibilidad de bandas. Compartición por tiempo o código. |
| **3G** | 2100 MHz | WCDMA (banda ancha) | Voz y datos móviles. Mejora en velocidad y eficiencia. Más espectro asignado por usuario. |
| **4G** | 700 MHz – 2.6 GHz | OFDMA (frec. ortogonal) | Datos de alta velocidad (IP). 700 MHz: gran cobertura. 2.6 GHz: capacidad urbana. Subportadoras paralelas. |
| **5G** | Sub-6 GHz y mmWave | OFDMA + MIMO / BF | IoT masivo y latencia < 1 ms. mmWave (> 24 GHz) para velocidad extrema. Multiplexación espacial pura. |

### Evolución – comparativa de generaciones

Comparativa de generaciones, frecuencias, tecnologías y capacidades de transmisión.

| Gen. | Año | Frecuencias | Tecnología | Velocidad | Detalles |
|---|---|---|---|---|---|
| **1G** | 1980 | 800-900 MHz (VHF/UHF) | Voz analógica | ~2.4 kbps (solo voz) | Sistema analógico sin cifrado de seguridad. |
| **2G** | 1990 | 900/1800 MHz (GSM), 850/1900 MHz | Voz digital, SMS, datos básicos | Hasta 384 kbps (EDGE) | Digitalización de voz y datos. Introducción de SMS. |
| **3G** | 2000 | 850/900/1900/2100 MHz | Voz y datos móviles | Hasta 42 Mbps (HSPA+) | Redes basadas en paquetes, videollamadas y web. |
| **4G (LTE)** | 2010 | 700-2600 MHz (varía por país) | Datos de alta velocidad | Hasta 1 Gbps (LTE Advanced) | Red 100% IP, alta eficiencia espectral y baja latencia. |
| **5G** | Desde 2020 | Sub-6 GHz y mmWave (24-100 GHz) | IoT masivo, VR/AR, ultra banda ancha | Hasta 10 Gbps, latencia < 1 ms | Massive MIMO, beamforming, network slicing. |

### Redes celulares 1G

Primera generación de tecnología celular móvil comercial basada en transmisión analógica.

- **Período:** 1970 - 1980
- **Sistema:** AMPS (Advanced Mobile Phone System)
- **Servicios:** sólo voz
- **Tecnología:** analógica
- **Velocidad:** 1 kbps a 2.4 kbps
- **Core network:** PSTN (Red Telefónica Conmutada)

#### Parámetros de RF

- **Multiplexación:** FDMA (Acceso Múltiple por División de Frecuencia)
- **Conmutación:** conmutación de circuitos
- **Frecuencia:** 800 - 900 MHz
- **Ancho de banda:** canales estrechos de 30 kHz

#### Capacidad y desafíos

- **Espectro de canales:** capacidad total para 832 canales dúplex. 21 canales reservados para el establecimiento de llamada; resto dedicado a comunicación de voz.
- **Seguridad y calidad:** malas comunicaciones de voz. Ninguna seguridad: las llamadas de voz se reproducen de forma abierta en las torres de radio.

### Redes celulares 2G

Segunda generación de tecnología celular móvil, caracterizada por la transición a la transmisión digital.

- **Período:** 1980 - 1990
- **Tecnología:** digital (voz y datos limitados)
- **Velocidad:** 14 kbps a 64 Kbps
- **Frecuencias y multiplexación:** GSM: 850 - 1900 MHz (TDMA); CDMA: 825 - 849 MHz (CDMA)
- **Conmutación:** circuitos

#### Estándares globales

- **GSM:** Sistema Global para Comunicaciones Móviles. Estándar dominante.
- **IS-95 (CDMA):** primer estándar celular basado en CDMA, adoptado en América y Asia.
- **JDC & iDEN:** JDC (TDMA) utilizado en Japón. iDEN es una red propietaria móvil de Nextel.

#### Servicios disponibles

- **Voz y mensajería:** voz digital con mayor seguridad y calidad, además del nacimiento del SMS.
- **Funciones de llamada:** identificación, llamada en espera, retención y transferencia de llamadas.
- **Conectividad:** soporte para roaming internacional, llamadas en conferencia y bloqueo.

### Redes celulares 2.5G y 2.7G

Generaciones de transición hacia la conmutación de paquetes y mayores velocidades de transmisión de datos.

- **Período:** 2000 - 2003
- **Tecnología:** red de paquetes para datos de alta velocidad.
- **Frecuencias:** 850 - 1900 MHz
- **Conmutación:** conmutación de paquetes
- **Multiplexación:** GMSK (GPRS) y 8-PSK (EDGE)

#### Estándares globales

- **GPRS (2.5G):** General Packet Radio Service. Introducción de paquetes. Velocidad hasta 115 Kbps.
- **EDGE (2.7G):** Enhanced Data rates for GSM Evolution. Evolución digital de datos. Velocidad hasta 384 Kbps.

#### Servicios disponibles

- **Mensajería y web:** inicio del soporte para MMS, SMS, correo electrónico, navegación WAP y acceso web.
- **Multimedia y chat:** pulsar para hablar, videoconferencia, entretenimiento, juegos móviles y directorios de búsqueda.

### Redes celulares 3G

Tercera generación de tecnología celular móvil, introduciendo banda ancha para servicios de datos y multimedia.

- **Año:** 2000
- **Velocidad:** 384 Kbps a 2 Mbps
- **Frecuencia:** aprox. 1.8 a 2.5 GHz
- **Ancho de banda:** 5 a 20 MHz
- **Multiplexación:** TDMA, CDMA

#### Estándares globales

- **UMTS (WCDMA):** Universal Mobile Telecommunications System. Basado en interfaz de radio WCDMA.
- **CDMA 2000:** basado en tecnología CDMA (IS-95) estándar 2G, estandarizada por 3GPP2.
- **WCDMA:** Wideband Code Division Multiple Access.

#### Servicios disponibles

- **Telefonía y voz:** telefonía móvil de voz convencional optimizada y de mayor claridad.
- **Internet de alta velocidad:** acceso a Internet móvil de alta velocidad y acceso fijo inalámbrico.
- **Multimedia avanzada:** llamadas de video, chat, videoconferencias y televisión móvil.

### Redes celulares 4G

Cuarta generación de tecnología celular móvil, introduciendo banda ancha móvil de alta velocidad y optimización de datos.

- **Período:** inicio 2008 - 2010
- **Velocidad:** 100 Mbps en movimiento / 1 Gbps inmóvil
- **Ancho de banda:** 5-20 MHz (opcional hasta 40 MHz)
- **Frecuencias y acceso:** nuevas frecuencias. OFDM, MC-CDMA, CDMA, LAS-Red-LMDS

#### Estándares globales

- **LTE (LTE-TDD / LTE-FDD):** estándar Long-Term Evolution en modalidades de dúplex por división de tiempo y frecuencia.
- **WiMAX Móvil:** tecnología 802.16m estandarizada formalmente por el IEEE.

#### Servicios disponibles

- **Acceso móvil avanzado:** acceso móvil web, telefonía IP, servicios de juegos, televisión móvil HD y televisión 3D.
- **Multimedia y datos:** videoconferencia, computación en la nube, flujos de difusión múltiples (DVB) y soporte óptimo para dispositivos portátiles.

### Redes celulares 5G

Quinta generación de tecnología celular móvil, diseñada para proporcionar velocidades de datos ultra altas, latencia extremadamente baja y conectividad masiva.

- **Inicio:** 2015
- **Velocidad:** 1 a 10 Gbps
- **Ancho de banda:** 10 Gbps
- **Frecuencia:** 3 a 300 GHz
- **Multiplexación:** CDMA y BDM

#### Arquitectura y estándares

- **Tecnología OWA:** capa física y de enlace basada en Open Wireless Architecture.
- **Estándares:** banda ancha IP LAN / WAN / PAN y WWWW.
- **Infraestructura:** totalmente virtualizada, permitiendo un sistema de costes bajo y escalable.

#### Rendimiento y eficiencia

- **Muy alta velocidad:** velocidades de datos Gigabit, cobertura de alta calidad y soporte multi espectro.
- **Eficiencia de red:** reducción de alrededor del 90% en el consumo de energía de la red, optimizando los recursos.

---

## Enlaces satelitales

Sistemas de comunicación espacial para la transmisión de datos, voz y difusión a escala global.

### Utilizado en

- **Televisión y radio:** sistemas de difusión comercial y distribución de señal masiva a nivel global.
- **Telefonía de larga distancia:** enlaces troncales intercontinentales y soporte para zonas remotas o aisladas.
- **Redes corporativas e Internet:** conectividad empresarial privada, enlaces redundantes e infraestructura troncal de Internet.

### Órbitas satelitales

- **GEO (geosíncrona):** satélites de órbita alta. Ideales para televisión y comunicaciones de cobertura constante sobre un punto fijo.
- **MEO (media):** posicionamiento y navegación. Base del Sistema de Posicionamiento Global (GPS).
- **LEO (baja):** sistemas de baja latencia y alta velocidad como las constelaciones Iridium y Starlink.

### GEO (Geostationary Earth Orbit)

Órbita geoestacionaria: tecnología clave para telecomunicaciones y observación constante.

- **Altura aproximada:** 35.786 km
- **Tiempo orbital:** 24 horas (los satélites se mueven de manera sincronizada con la rotación de la Tierra).

**Características**

- **Vista estacionaria:** permanecen fijos sobre un punto específico de la Tierra.
- **Cobertura global:** solo se necesitan 3 satélites para cubrir casi todo el planeta.
- **Latencia y costo:** latencia alta (~600 ms). Satélites de gran tamaño y costo elevado.

**Ejemplos de uso**

- **TV satelital:** sistemas de difusión comercial como DirecTV y Dish Network.
- **Enlaces VSAT:** conectividad de datos e internet corporativo en áreas remotas.
- **Meteorología:** monitoreo ambiental con satélites como GOES y Meteosat.

### MEO (Medium Earth Orbit)

Órbita media terrestre: el equilibrio ideal entre cobertura y latencia.

- **Altura aproximada:** 2.000 a 35.000 km
- **Tiempo orbital:** 6 a 12 horas

**Características**

- **Menos satélites:** requiere menor cantidad de satélites que LEO para lograr cobertura total.
- **Latencia media:** ofrece una latencia intermedia, estimada habitualmente entre 70 y 100 ms.
- **Balance óptimo:** presenta un excelente punto de equilibrio entre cobertura y latencia.

**Ejemplos de uso**

- **Sistemas GNSS:** es la órbita de referencia para la navegación global por satélite.
- **GPS (EE. UU.):** el sistema de geolocalización y posicionamiento global más extendido.

### LEO (Low Earth Orbit)

Órbita baja terrestre: baja latencia y constelaciones dinámicas en constante movimiento.

- **Altura aproximada:** 200 a 2.000 km
- **Tiempo orbital:** 90 a 120 min (los satélites completan su órbita rápidamente, dando muchas vueltas a la Tierra por día).

**Características**

- **Baja latencia:** tiempos de respuesta muy rápidos, estimados en un rango de 20 a 40 ms.
- **Cobertura reducida:** requiere del lanzamiento de grandes constelaciones de satélites para cobertura global.
- **Menor costo:** los costos de fabricación y lanzamiento son considerablemente más bajos.

**Ejemplos de uso**

- **Satélites de Internet:** redes de banda ancha de alta velocidad como Starlink (SpaceX) o OneWeb.
- **Observación de la Tierra:** captura de imágenes meteorológicas avanzadas y monitoreo de factores ambientales.
- **Defensa y seguridad:** sistemas de comunicaciones militares altamente seguros y de baja latencia.

### Comparativa de órbitas

| Órbita | Altura aproximada | Tiempo orbital | Latencia | Ejemplos |
|---|---|---|---|---|
| **GEO** | 35.786 km | 24 horas | ~600 ms | DirecTV, Dish Network, VSAT, GOES, Meteosat |
| **MEO** | 2.000 a 35.000 km | 6 a 12 horas | 70 a 100 ms | GNSS, GPS |
| **LEO** | 200 a 2.000 km | 90 a 120 min | 20 a 40 ms | Starlink, OneWeb, Iridium |

## Ejemplo: Proyecto Iridium

**Constelación y terminal Iridium**

- **(a)** Los satélites forman 6 órbitas polares alrededor de la Tierra para garantizar una cobertura global y continua sin zonas muertas.
- **(b)** El terminal telefónico portátil se comunica directamente con la red satelital de órbita baja (LEO), permitiendo llamadas de voz en cualquier punto del planeta.

### Enlaces satelitales – Aplicaciones

- **Aplicaciones marítimas:** conectividad crítica y de seguridad para embarcaciones mercantes y recreativas en alta mar, operando fuera de la cobertura de redes terrestres.
- **Aviación:** soporte esencial de comunicaciones de voz y datos en cabina para vuelos comerciales y privados en rutas transoceánicas y polares.
- **Comunicaciones móviles:** telefonía satelital directa y transmisión de datos portátil para brigadas de rescate, investigadores y usuarios en zonas aisladas o situaciones de emergencia.

## Ejemplo: Internet satelital

### Características principales

- **Velocidad y costo:** lento (máx. 20 Mbps) y de costo elevado comparado con opciones terrestres.
- **Latencia elevada:** < 600 ms de latencia frente a los > 10 ms del servicio tradicional.
- **Sensibilidad climática:** propenso a interferencias y pérdidas de señal debido a factores climáticos.
- **Presencia en Latinoamérica:** disponible principalmente en Colombia, Brasil, México y Chile.

## Ejemplo: Starlink

### Red y cobertura

- **Constelación LEO (baja órbita):** operan a ~550 km de altura para conexiones veloces. Actualmente hay más de 10.600 satélites en órbita.
- **Cobertura en Latinoamérica:** casi total. Opera en Argentina, Paraguay, Colombia, México, Ecuador, Chile, Perú, Brasil, llegando a más de 150 países a nivel mundial.

### Rendimiento

- **Velocidades de descarga:**
  - Estándar: 100 Mbps a 200 Mbps
  - Premium / Max: hasta 400 Mbps
- **Latencia (ping):** 25 a 60 ms en tierra. Ideal y perfectamente apta para videollamadas y juegos online.

### Costos

- **Kit Estándar:** UYU 15.990 (hogar)
- **Kit Mini:** UYU 8.050 (portátil / moderado)
- **Planes:** UYU 1.500 a 4.500

## Enlaces satelitales – Ventajas y desventajas

### Ventajas

- **Alcance en zonas remotas:** acceso garantizado en áreas rurales o de difícil infraestructura terrestre.
- **Apropiado para broadcast:** ideal para difusión masiva como televisión y radio.
- **Complemento óptico:** excelente respaldo y extensión para redes de fibra óptica.

### Desventajas

- **Baja capacidad:** limitaciones importantes en el ancho de banda disponible.
- **Alto costo:** elevado precio económico por cada bloque de ancho de banda.
- **Retardo (latencia):** demora de cientos de milisegundos en el viaje de ida y vuelta al satélite.

---

# 05 – Key Points – Medios

- Clasificación de medios (guiado y no guiado).
- Coaxial.
- Par trenzado: qué cable es mejor y cuál peor, categorías.
- Fibra: cómo funciona (tipos), ventajas y desventajas vs otros medios.
- No guiados (satelital o terrestre).
