# Modelo en Capas – Capa 2: Enlace – Protocolo Ethernet

> **Flujo de datos:** Física → **Enlace** → Red → Transporte → Aplicación

---

## Protocolo Ethernet

Estructura y contenido del módulo:

1. **Protocolo Ethernet**
2. Otros conceptos

---

# 01 – Protocolo Ethernet

## Ejemplo de protocolos utilizados en cada capa

Capas: Aplicación, Transporte, Red, Enlace.

### Repaso: Encapsulado

```
Aplicación   ·······················  APP DATA  ·····················>  Aplicación
Transporte   ················  [TH][AH][ APP DATA ]  ·············>  Transporte
Red          ·········  [NH][TH][AH][ APP DATA ]  ················>  Red
Enlace       ··  [DH][NH][TH][AH][ APP DATA ][CRC]  ·············>  Enlace
Física       <·················  bits  ·····················>      Física
```

- **AH:** cabecera de aplicación. **TH:** cabecera de transporte. **NH:** cabecera de red. **DH:** cabecera de enlace (Data Link). **CRC:** control de errores al final de la trama.

## Introducción

### Protocolo Ethernet

Ethernet está definido por los protocolos de la capa de **Enlace de Datos** y de la capa **Física**, interactuando directamente con el hardware para asegurar la transmisión.

- **Estándar LAN:** El protocolo más utilizado en redes por ser sumamente económico.
- **Acceso al Medio:** Implementa el mecanismo de control de acceso **CSMA/CA**.
- **Estructura de Capas:** Dividido en las subcapas **LLC (802.2)** y **MAC (802.3)**.

```
Application
Presentation
Session
Transport
Network
Data Link  ─ LLC ─ 802.2 ┐
           ─ MAC ─ 802.3 ├─ Ethernet
Physical   ─────── 802.3 ┘
```

*"Ethernet is defined by Data Link layer and Physical layer protocols."*

---

## LLC – Logical Link Control

### ¿Qué es la LLC?

**LLC** (Control de Enlace Lógico) es la sección de software de la Capa 2 que actúa como un puente de software entre la Capa 3 (Red) y el hardware de red. Su única función es etiquetar el paquete recibido con un código identificador (**SAP** o **SNAP**) para especificar qué protocolo de software lo originó. La LLC no interactúa con el medio físico ni realiza el entramado; esa tarea le corresponde por completo a la subcapa inferior, llamada **MAC**.

### Tareas principales

- Nexo con la capa superior (independiente de la física).
- Agrega la cabecera de control al paquete de red.
- Identifica el protocolo de la capa de red.
- Maneja el control de flujo y errores según servicio a Capa 3.

### Estructura y encapsulación

```
Capa de Red:        Packet
Capa de Enlace:     [LLC | Packet]             ← subcapa LLC
                    [MAC | LLC | Packet | MAC] ← subcapa MAC (cabecera y cola)
```

**PDU Format (LLC):**

```
┌────────┬────────┬─────────────┬────────────────────────┐
│  DSAP  │  SSAP  │   Control   │ Information (User Data)│
│ 8 bits │ 8 bits │ 8 o 16 bits │        Variable        │
└────────┴────────┴─────────────┴────────────────────────┘
```

**SSAP** y **DSAP** identifican los puntos de acceso al servicio de origen y destino, permitiendo que LLC entregue los datos a la entidad correspondiente de la capa superior. El campo de **control** indica la operación LLC que debe realizarse.

### Servicios

Las entidades que se comunican y hablan un determinado **protocolo**, utilizan para esta comunicación los **servicios** de las capas inferiores.

### Primitivas de servicio

Se denominan **primitivas** de servicio al conjunto de operaciones que los procesos de una determinada capa disponen para comunicarse con la entidad par.

- **REQUEST (solicitud):** La capa de red pide a la capa de enlace que realice una operación (ej. enviar un paquete).
- **INDICATION (indicación):** La capa de enlace informa a la capa de red receptora que ocurrió un evento (ej. llegó un paquete).
- **RESPONSE (respuesta):** La capa de red receptora responde a una indicación. Usado en servicios orientados a conexión o confirmados.
- **CONFIRM (confirmación):** La capa de enlace informa a la capa de red emisora el resultado de la solicitud.

### Relación de servicios

- **No confirmado:** `DATA.request` → `DATA.indication`
- **Confirmado:** Utiliza `request`, `indication`, `response`, `confirm`
- **Orientado a conexión:** Incluye además `CONNECT` (req, ind, resp, conf) y `DISCONNECT`

```
Capa de red      Capa de enlace     Capa de enlace     Capa de red
(Emisor)         (Emisor)           (Receptor)         (Receptor)
   │ DATA.request ─►│                    │                   │
   │                │──── TRAMA ────────►│                   │
   │                │                    │─ DATA.indication ►│
   │                │                    │◄─ DATA.response ──│
   │                │◄──── ACK ──────────│                   │
   │◄─ DATA.confirm─│                    │                   │
```

### Mapeo de primitivas a Sockets

Relación entre el flujo de primitivas genéricas y la implementación en Python (Berkeley Sockets).

| Flujo teórico genérico | Implementación en Python |
|---|---|
| **1. REQUEST:** el cliente solicita el inicio del servicio o de la conexión. | `socket.connect((host, port))` – inicia la solicitud activa de conexión hacia el servidor. |
| **2. INDICATION:** se notifica a la entidad receptora que hay una acción solicitada. | `conn, addr = socket.accept()` – el servidor bloqueado detecta y acepta la conexión entrante. |
| **3. RESPONSE:** la entidad receptora responde a la petición iniciada. | `conn.sendall(data)` / `conn.recv()` – intercambio de datos donde el servidor responde al requerimiento. |
| **4. CONFIRM:** se notifica al iniciador que la respuesta fue procesada. | `socket.recv(1024)` – el cliente recibe la confirmación y procesa los datos de retorno. |

### Tipos de servicio LLC

| Tipo | Características |
|---|---|
| **LLC Tipo 1** | No orientado a conexión y no confirmado |
| **LLC Tipo 2** | Orientado a conexión y confirmado |
| **LLC Tipo 3** | No orientado a conexión, pero confirmado |

---

## MAC – Media Access Control

### Implementación

El control de acceso a los medios se implementa mediante **hardware**.

- **Componente clave:** Tarjeta de Interfaz de Red (NIC)

### Funciones principales

- **Encapsulación de datos:**
  - Delimitación de frames
  - Direccionamiento
  - Detección de errores
- **Control de acceso a medios:**
  - Acceso múltiple con detección de colisiones (**CSMA/CD**)

### Trama IEEE 802.3 con LLC (802.2)

```
┌──────────┬───────┬────┬────┬────────┬──────┬──────┬─────────┬──────────────┬─────┬───────────┐
│ Preamble │ Start │ DA │ SA │ Length │ DSAP │ SSAP │ Control │ Network Data │ FCS │    End    │
│          │ Delim.│    │    │        │      │      │         │ (43–1497 B)  │     │ Delimiter │
└──────────┴───────┴────┴────┴────────┴──────┴──────┴─────────┴──────────────┴─────┴───────────┘
```

- **DA** (6 bytes) = Destination Address
- **SA** (6 bytes) = Source Address
- **Length** (2 bytes) = Length of Data/LLC
- **DSAP** (1 byte) = Destination Service Access Point
- **SSAP** (1 byte) = Source Service Access Point
- **Control** (1–2 bytes) = Unnumbered/Supervisory Control
- **Network Data:** 43 a 1497 bytes
- **Frame Check Sequence (FCS):** CRC-32, 4 bytes, calculado sobre LLC y datos

---

## Campos DA o SA

### Definición y estructura (dirección MAC)

- Identificadores únicos\* de toda tarjeta de red en el mundo.
- Es un identificador de 12 dígitos hexadecimales (separados de a dos).
- Se compone de dos partes:
  - **Primeros 6 dígitos:** Propios del fabricante (**OUI**).
  - **Últimos 6 dígitos:** Identificador de nuestro aparato.

**Repositorio de fabricantes de Wireshark:** https://gitlab.com/wireshark/wireshark/-/raw/master/manuf

**Utilidad de búsqueda OUI de Wireshark:** https://www.wireshark.org/tools/oui-lookup.html

> \***Nota:** Está grabada de fábrica en la tarjeta de red de los equipos, pero se puede modificar mediante software.

## Campos Length

*(La diapositiva repite el mismo contenido que "Campos DA o SA": definición y estructura de la dirección MAC, repositorio de fabricantes y utilidad OUI de Wireshark, y la misma nota.)*

- Identificadores únicos\* de toda tarjeta de red en el mundo.
- Es un identificador de 12 dígitos hexadecimales (separados de a dos).
- **Primeros 6 dígitos:** Propios del fabricante (OUI). **Últimos 6 dígitos:** Identificador de nuestro aparato.

> \***Nota:** Está grabada de fábrica en la tarjeta de red de los equipos, pero se puede modificar mediante software.

## Dirección MAC – 48 bits (6 bytes)

Normalmente se expresan en hexadecimal:

```
00-08-73-4c-9f-9b
00000000-00001000-01110010-01001100-10011111-10011011
```

| Tipo | Descripción |
|---|---|
| **Unicast** | Identifica UN sólo equipo. Ejemplo: `00-08-73-4c-9f-9b`. Identificable por primer byte par. |
| **Broadcast** | Frame recibido por TODOS los equipos de la LAN. Ejemplo: `ff-ff-ff-ff-ff-ff` |
| **Multicast** | **IANA IPv4 Multicast MAC Address:** `01-00-5E` bit 25=0 y últimos 23 bits iguales a la dirección IPv4 de multicast (224.0.0.0 a 239.255.255.255). **IANA IPv6 Multicast MAC Address:** `33-33-33`, últimos 32 bits iguales a la dirección IPv6 de multicast. |

---

## Trama Ethernet II (o versión 2)

### ¿Qué cambia en Ethernet II?

- **No utiliza la subcapa LLC:** la identificación del protocolo superior ya no se realiza mediante **DSAP/SSAP (SAP de LLC)**.
- **Utiliza EtherType:** este campo indica directamente qué protocolo de nivel superior está encapsulado en el payload, por ejemplo IPv4, IPv6 o ARP.
- **Desaparece el campo Length:** los dos bytes que en 802.3 indicaban la longitud del payload pasan a utilizarse como **EtherType**.
- **El payload puede incluir padding:** Ethernet II entrega el **payload completo**. El protocolo encapsulado determina qué parte de esos datos le corresponde, utilizando su propia información de longitud.

### Comparación de estructuras (IEEE 802.3 vs Ethernet II)

Tamaño de los campos en bytes:

| Formato | Campos |
|---|---|
| **IEEE 802.3** | Preamble (7) · Start of Frame delimiter (1) · Destination Address (6) · Source Address (6) · Length/Type (2) · 802.2 Header and Data (46 a 1500) · Frame Check Sequence (4) |
| **Ethernet (II)** | Preamble (8) · Destination Address (6) · Source Address (6) · Type (2) · Data (46 a 1500) · Frame Check Sequence (4) |

## Trama Ethernet II (Estructura y campos)

```
┌──────────┬───────┬────┬────┬───┬──────────────┬─────┬───────────┐
│ Preamble │ Start │ DA │ SA │ T │ Network Data │ FCS │    End    │
│          │ Delim.│    │    │   │ 46–1500 bytes│     │ Delimiter │
└──────────┴───────┴────┴────┴───┴──────────────┴─────┴───────────┘
```

**Ethernet or 802.3 Header:**

- **DA** (6 bytes) = Destination Address
- **SA** (6 bytes) = Source Address
- **T** (2 bytes) = "Type" of Protocol framed by this packet
- **Network Data:** 46 a 1500 bytes
- **Frame Check Sequence:** 4 bytes

> **Encapsulación de datos:** En el campo "Network Data" se lleva encapsulada la información de las capas superiores.

### Primeros 8 bytes

**Preámbulo**

- Es un **patrón de 0 y 1** de 7 bytes de largo.
- Sus funciones son:
  - Que se detecte que comienza una transmisión.
  - Sincronización.
  - Preparación para interpretar los bits de la trama.

**SOF (Start of Frame)**

Campo de un byte que marca el final del preámbulo y el comienzo exacto de la trama MAC. Permite al receptor identificar que los bits siguientes corresponden a la dirección MAC de destino.

### Campos DA y SA

- **DA** = Destination address (Dirección de destino)
- **SA** = Source address (Dirección de origen)

En este campo se especifican las **direcciones físicas (MAC)** de las máquinas de envío y de destino de la trama.

**Dirección de origen vs. destino**

- La dirección de origen (**SA**) es una dirección única.
- La de destino (**DA**) dependerá del tipo de envío:
  - A una sola máquina (unicast/broadcast)
  - A un grupo de máquinas (multicast)
  - A todos los nodos de la red (broadcast)

### Campo Type → EtherType

**Función principal:** Especifica el **protocolo de capa superior** (capa 3) que recibe los datos una vez que se ha completado el procesamiento a nivel de Ethernet.

**Ejemplos comunes**

| Tipo | Protocolo |
|---|---|
| `0x0800` | IP |
| `0x0806` | ARP |

**Estructura de la trama (Ethernet Type II Frame, 64 a 1518 bytes):**

```
├── MAC Header (14 bytes) ─────────────────────┤├─ Data ────────────┤├─ CRC ───────┤
[Destination MAC Address][Source MAC Address][EtherType][ Payload        ][CRC Checksum]
 80 00 20 7A 3F 3E        80 00 20 20 3A AE   08 00      IP, ARP, etc.     00 20 20 3A
                                                         (46–1500 bytes)   (4 bytes)
```

*Tomado de: http://en.wikipedia.org/wiki/Ethernet*

### Campo Data y frames especiales

**Datos y Runt Frames**

- **Datos (y relleno):** Se indican los datos enviados en la trama.
- **Runt frames:** Si la cantidad de datos no es suficiente para completar una trama mínima de 64 bytes, se insertan bytes de relleno hasta alcanzar ese tamaño. De lo contrario, el receptor descartará la trama.

**Giants y Jumbo Frames**

- **Giants (Jumbo Frame):** Frames de tamaño mayor al máximo de 1500 bytes de carga útil del campo de datos (MTU). Ej: MTU = 4074, 7418 o 9000.

### Campo Frame Check Sequence → FCS

**Función y cálculo**

El campo FCS proporciona un mecanismo de **detección de errores**.

El transmisor, para el cálculo del **Chequeo de Redundancia Cíclico (CRC)**, incluye:

- Dirección de Destino (DA)
- Dirección de Origen (SA)
- Campo Tipo (T)
- Datos

**Resultado de largo fijo:** Este cálculo produce un resultado de **4 bytes**, el cual se escribe directamente en el campo FCS.

```
Mensaje original ──► [ CRC ] ──► Suma de control
Mensaje enviado  = [ Mensaje original | Suma de control ]
```

---

## Frame Ethernet

Hasta aquí el armado del frame, ahora veamos:

- **Flujo de transmisión:** Con todo lo visto al momento, ¿cómo es ese flujo?
- **Recepción en destino:** ¿Qué pasa cuando ese frame llega a destino?

### Envío de frames Ethernet

| Paso | Etapa | Detalle |
|---|---|---|
| 1 | **Preparación** | **Relleno de datos:** si el frame tiene menos de 60 bytes, se completa con relleno (padding). **Cálculo CRC:** se calcula y agrega la secuencia de verificación para detectar errores. |
| 2 | **Acceso al medio** | **Carrier Sense:** se monitorea el canal para verificar si está libre antes de transmitir. **Espera activa:** si el medio está ocupado, espera 96 bit times y vuelve a intentar. |
| 3 | **Transmisión** | **Envío de datos:** comienza la transmisión de bits si el canal se encuentra libre. **Escucha de colisión:** se monitorea activamente el medio mientras se transmite. |
| 4 | **Colisiones** | **Señal de Jam:** si ocurre una colisión, se envía una señal "Jam" para notificar a la red. **Algoritmo Backoff:** se calcula un retraso aleatorio antes de volver al paso 2. |

### Recepción de frames Ethernet

| Paso | Etapa | Detalle |
|---|---|---|
| 1 | **Sincronización** | **Carrier detectado:** se detecta y monitorea la portadora física en el medio. **Inicio de frame:** espera el byte delimitador (...10101011) para sincronizar. |
| 2 | **Validación** | **Tamaño reglamentario:** verifica que tenga entre 64 y 1518 bytes. **Formato e integridad:** comprobación de CRC y número de bytes entero. **Errores:** si falla, se incrementa el contador de errores. |
| 3 | **Destinatario** | **Dirección física:** se analiza la dirección MAC destino del frame. **Filtro de entrada:** debe coincidir con la local, de broadcast o multicast activa. |
| 4 | **Procesamiento** | **Entrega:** si es correcto y para esta estación, se envía a la capa de red superior. **Descarte:** el frame se elimina si no cumple con la validación o destinatario. |

### Envío y Recepción de frames Ethernet

*(Diapositiva con imagen no disponible en el PDF: solo el título.)*

---

## Modos de funcionamiento

| Modo | Característica | Detalle |
|---|---|---|
| **Half Duplex** | con CSMA/CD | Se transmite en **un sentido** a la vez. Se utiliza **CSMA/CD** para tratar la contención y resolver conflictos en el medio compartido. |
| **Full Duplex** | Alto rendimiento | Se utiliza principalmente en **enlaces punto a punto**. Ambas estaciones pueden transmitir de **manera simultánea**. **No hay colisiones**, optimizando el ancho de banda. |
| **Auto-negociación** | Configuración automática | Permite adaptar la **velocidad** de transmisión de forma automática. Selecciona el mejor **modo duplex** soportado por ambos extremos del enlace. |

## Nemotécnica – Identificador IEEE

```
  10      Base       T
  │        │         └─ Información sobre el medio físico (Par trenzado)
  │        └─ Tipo de señalización utilizada (Base Band: significa que a través
  │           del medio sólo se presta un servicio: transportar señales Ethernet)
  └─ Rapidez de transmisión (10 Mega bits por segundo)
```

### Ejemplos comunes

- **10base**T (10 Mbps, Par Trenzado)
- **100base**Tx (100 Mbps, Fast Ethernet)
- **1000base**Lx (1 Gbps, Fibra Óptica)
- **10Gbase**-LR / **100Gbase**-ER4 (Alta velocidad)

### Significado de los sufijos

**Cableado de cobre**

- **T** — Twisted pair (Par trenzado)

**Fibra óptica**

- **S** — Short wave (Láser de onda corta sobre multimodo MM)
- **L** — Long wave (Láser de onda larga sobre monomodo SM)
- **LR / ER4** — Long Reach / Extended Reach (Hasta 25Gbps por canal)

**Codificación**

- **X** — Codificación de línea tipo 4B/5B

## Ethernet – Denominaciones y velocidades

| Denominación | Velocidad | Estándar |
|---|---|---|
| Ethernet | 10 Mbps | IEEE 802.3 |
| Fast Ethernet | 100 Mbps | IEEE 802.3u |
| Gigabit | 1000 Mbps | IEEE 802.3z / ab |
| 10 Gigabit | 10 Gbps | IEEE 802.3ae |
| 25 Gigabit | 25 Gbps | 802.3bq-2016\* |
| 40 Gigabit | 40 Gbps | 802.3ba-2010 |
| 100 Gigabit | 100 Gbps | 802.3ba-2010 |

\*802.3bq-2016

## Ethernet – Types of Ethernet

| Ethernet Type | Bandwidth | Cable Type | Duplex | Maximum Distance |
|---|---|---|---|---|
| 10Base-5 | 10 Mbps | Thicknet Coaxial | Half | 500 m |
| 10Base-2 | 10 Mbps | Thinnet Coaxial | Half | 185 m |
| 100Base-TX | 10 Mbps | Cat3/Cat5 UTP | Half | 100 m |
| 100Base-TX | 100 Mbps | Cat5 UTP | Half | 100 m |
| 100Base-FX | 200 Mbps | Cat5 UTP | Full | 100 m |
| 100Base-FX | 100 Mbps | Multimode Fiber | Half | 400 m |
| 1000Base-T | 200 Mbps | Multimode Fiber | Full | 2 km |
| 1000Base-TX | 1 Gbps | Cat5e UTP | Full | 100 m |
| 1000Base-SX | 1 Gbps | Cat6 UTP | Full | 100 m |
| 1000Base-LX | 1 Gbps | Multimode Fiber | Full | 550 m |
| 10GBase-CX4 | 1 Gbps | Single-Mode Fiber | Full | 2 km |
| 10GBase-T | 10 Gbps | Twin-axial | Full | 100 m |
| 10GBase-LX4 | 10 Gbps | Cat6a/Cat7 UTP | Full | 100 m |
| 10GBase-LX4 | 10 Gbps | Multimode Fiber | Full | 300 m |
| 10 Mbps | 10 Gbps | Single-Mode Fiber | Full | 10 km |

*(Tabla tal como figura en la diapositiva original, imagen de la fuente "Types of Ethernet".)*

## Estándares más utilizados

### Gigabit Ethernet (1 Gbps)

| Estándar | Medio | Distancia | Uso |
|---|---|---|---|
| **1000Base-T** | UTP Cat.5e o + | 100 m | LAN (barato) |
| **1000Base-Sx** | Fibra MM, Short Wave | 500 m | LAN, servidores, backbone |
| **1000Base-Lx** | Fibra SM, Long Wave | 5000 m (5 Km) | LAN (larga distancia) |

### 10/25 Gb Ethernet (10/25 Gbps)

| Estándar | Medio | Distancia | Uso |
|---|---|---|---|
| **10Base-T** | UTP Cat.6a o + | 100 m | Datacenter o LAN |
| **10Base-SR y LR** | Fibra MM y SM | 400 m y 10 Km | Datacenter y WAN |
| **25Base-T** | UTP Cat.8 > | 30 m | Datacenter o LAN |
| **25Base-SR y LR** | Fibra MM y SM | 100 m y 10 Km | Datacenter y WAN |

### 40/100 Gb Ethernet

Actualmente a nivel de proveedores de servicio o entre datacenters.

---

## Redes LAN cableadas – Ejemplo

(Diagrama: servidores, laptop y varios clientes conectados a un hub/switch central en forma de estrella.)

- **Físicamente – Topología estrella:** La distribución física de los cables se organiza en forma de estrella desde un nodo central.
- **Lógicamente – Todos contra todos:** Funciona como un medio compartido donde los equipos están conectados lógicamente todos contra todos.
- **Capa Física – Centro HUB\*:** El centro de la estrella es un repetidor multipuerto de **capa 1** llamado **HUB**\*.
- **Conectividad – Tarjeta de red:** Los equipos individuales disponen de un adaptador de comunicación llamado **tarjeta de red**.

## Dispositivo HUB

**Hub: Unidad de Capa 1**

- **Regeneración de señal:** Amplifican y regeneran las señales de transmisión para mantener la integridad de los datos.
- **Medio compartido:** Funcionamiento **half duplex**, lo que implica un canal de comunicación bidireccional no simultáneo.
- **Eficiencia económica:** Permite una interconexión económica y sencilla de múltiples equipos en la red local.

## Tarjeta de red

**Modelo de referencia y conexión**

- **Dispositivo de Capa 2 y 1:** Opera en la capa de enlace de datos, encargándose del direccionamiento físico.
- **Interfaz de conexión (NIC):** Posee una o más interfaces físicas (Network Interface Card) para conectar el equipo.
- **Chipset integrado:** Todas las tarjetas incluyen un circuito integrado especializado que controla el flujo de datos.

## Tarjeta de red fibra

### SFP & conectividad

- **Conexión de fibra:** La fibra se conecta a un transceptor mediante un conector **LC duplex**.
- **SFP (Transceptor):** Small Form-factor Pluggable Transceiver.
- **Características comunes:**
  - **Bidireccional:** Una fibra transmite (Tx) y la otra recibe (Rx).
  - **Hot-Swap:** Idéntico en ambos extremos (NIC y Switch/Router).

### Variantes

- **Velocidad de transmisión:**
  - 1Gb SFP
  - 10Gb SFP+
  - 40Gb QSFP
  - 100Gb QSFP+
- **Tipo de fibra:** Multimodo o monomodo dependiendo de la distancia requerida.
- **SFP/SFP+ RJ-45:** Conversión para cable de cobre (Cat 7 o 8).

---

# 02 – Otros conceptos

## Dominio de Broadcast (Difusión)

### ¿Qué es un Dominio de Difusión?

Un área lógica en una red donde todos los nodos conectados pueden transmitir "directamente" a cualquier otro nodo dentro de la red.

```
            Laptop    Laptop
               ↑         ↑
Laptop ──►  [ Switch ]  ──► Laptop
               ↓         ↓
            Laptop    Laptop

(Mensaje de broadcast: el switch lo reenvía a todos los equipos)
```

## Dominio de Colisión

### ¿Qué es un Dominio de Colisión?

Un segmento físico de una red donde es posible que los frames de un equipo puedan colisionar con otros.

```
   PC ──Data──►  ✸ Data Collision ✸  ◄──Data── PC
 ═══════════════════╤═══════════════════════════  (medio compartido)
                  Server
```

---

## Comentarios / Preguntas

*(Diapositiva de cierre: "Comentarios – Preguntas".)*

## Key Points – Protocolo Ethernet

- **Estándares más utilizados:**
  - Nemotécnica.
  - Casos de uso común de cada estándar.
- **Trama Ethernet:**
  - Distintos campos, qué contienen y para qué sirve cada uno.
  - Qué es una dirección MAC, cómo está compuesta y para qué sirve.
- **Flujo** – Lógica del envío y recepción de un frame.
- Concepto de dominios de **Broadcast** y de **Colisión**.
