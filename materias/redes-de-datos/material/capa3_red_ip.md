# Modelo en Capas – Capa 3: Red

> **Flujo de datos:** Física → Enlace → **Red** → Transporte → Aplicación

---

## Capa de red: comunicación entre hosts

Su lugar en el modelo por capas y el alcance del servicio que brinda.

### Modelo por capas

| Capa | Función | Relación |
|---|---|---|
| **Capa de Transporte (4)** | Utiliza la red para comunicar los procesos de los hosts extremos. | ↓ solicita el servicio |
| **Capa de Red (3)** | Direcciona y encamina paquetes entre el host origen y el destino. | ↓ usa servicios por salto |
| **Capa de Acceso (2–1)** | Mueve cada frame hasta el siguiente nodo del camino. | |

### Alcance de cada servicio

```
HOST ORIGEN ──── ROUTER 1 ──── ROUTER 2 ──── HOST DESTINO

CAPA DE RED:     ═══════════════════════════════════════►
                 (una comunicación lógica de extremo a extremo)

CAPA DE ACCESO:  ─────────►   ─────────►   ─────────►
                 (tres transmisiones independientes, una por enlace)
```

> **La red resuelve el camino completo; el acceso, cada salto.**

## La capa de red: procesamiento y selección de ruta

Los hosts usan todas las capas; cada router procesa el paquete y decide el siguiente salto.

```
                    ┌── ROUTER B ──┐   (ruta elegida)
HOST ORIGEN ── ROUTER A            ROUTER D ── HOST DESTINO
                    └── ROUTER C ──┘   (alternativa)
```

- **Hosts (origen y destino):** procesan todas las capas (Aplicación, Transporte, Red, Acceso 2–1).
- **Routers:** procesan solo Red y Acceso (2–1).

1. La capa de red entrega paquetes entre el origen y el destino, aunque atraviesen varias redes.
2. Cada router consulta la IP destino y su tabla de enrutamiento para elegir el siguiente salto.

## Tareas de la capa de red

| # | Tarea | Descripción |
|---|---|---|
| 01 | **Direccionamiento** | Asignación de identificadores únicos para localizar dispositivos en la red. |
| 02 | **Enrutamiento** | Determinación de la ruta óptima que deben seguir los datos hacia su destino. |
| 03 | **Forwarding** | Transferencia de paquetes desde la interfaz de entrada a la de salida del router. |
| 04 | **Fragmentación** | División de paquetes grandes para adaptarse al límite de la red física (MTU). |

## Arquitectura genérica de un enrutador

El plano de control decide las rutas; el plano de datos reenvía los paquetes.

```
PLANO DE DATOS · HARDWARE

INTERFACES DE ENTRADA (1…N)                              INTERFACES DE SALIDA (1…N)
┌──────────┐  ┌────────────────┐  ┌───────────┐  ┌─────────┐  ┌────────────┐  ┌────────────────┐  ┌──────────┐
│   Line   │→ │ Data Link Proc.│→ │  Lookup,  │→ │Switching│→ │  Queuing   │→ │ Data Link Proc.│→ │   Line   │
│Termination│ │(Protocol,      │  │Forwarding,│  │ Fabric  │  │  (Buffer   │  │(Protocol,      │  │Termination│
│          │  │ Decapsulation) │  │  Queuing  │  │         │  │ Management)│  │ Encapsulation) │  │          │
└──────────┘  └────────────────┘  └───────────┘  └────┬────┘  └────────────┘  └────────────────┘  └──────────┘
─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────
PLANO DE CONTROL · SOFTWARE                     ┌─────┴─────┐
                                                │  Routing  │  Procesador de enrutamiento:
                                                │ Processor │  calcula rutas y mantiene
                                                └───────────┘  la tabla de forwarding
```

### Componentes

**Interfaces de entrada**

- **Funciones:** Ejecuta funciones de la capa física y de enlace de datos.
- **Forwarding:** Consulta la tabla para determinar la interfaz de salida.
- **Colas:** Almacena paquetes si la velocidad de la matriz es insuficiente.

**Switch Fabric**

- **Núcleo central:** Conecta físicamente las interfaces de entrada con las de salida.
- **Tecnologías clave:** memoria compartida, bus dedicado, crossbar.

**Interfaces de salida**

- **Encolamiento:** Almacenamiento de paquetes para ser enviados por una interfaz.
- **Funciones:** Ejecuta funciones de la capa física y de enlace de datos.
- **Bidireccional:** Suelen ubicarse en la misma placa que la entrada correspondiente.

**Routing Processor**

- **Algoritmos:** En la arquitectura tradicional, implementa los protocolos y algoritmos de ruteo.
- **Tablas:** Se encarga de calcular y mantener las tablas de forwarding del enrutador.

### Tipos de conmutación (switching fabric)

| | 1. Por Memoria | 2. Por Bus | 3. Por Red (Crossbar) |
|---|---|---|---|
| **Mecanismo** | El paquete se copia en la memoria y se redirige al puerto de salida. | El puerto de entrada transfiere el paquete directo al de salida por un bus compartido. | Red en malla de múltiples buses que conecta dinámicamente cualquier entrada con cualquier salida. |
| **Evolución / Ventaja** | Antes por CPU central; hoy por chips en tarjetas de línea (line cards). | La CPU principal no interviene en la transferencia de datos. | Permite conmutación en paralelo (múltiples paquetes cruzando al mismo tiempo). |
| **Limitación** | El ancho de banda de memoria limita la velocidad (rendimiento < B/2). | Solo pasa un paquete a la vez. Si el bus está ocupado, el paquete se bloquea. | — |

---

## La capa de Red – Temas

1. **Circuitos virtuales y Datagramas:** conceptos fundamentales y diferencias en la conmutación de paquetes dentro de la infraestructura de la capa de red.
2. **Protocolo Internet Protocol (IP):** Encabezado IP, Direccionamiento IP, Subnetting.

---

# 01 – Circuitos Virtuales y Datagramas

## Enrutamiento

| | Redes de Datagramas | Circuitos Virtuales (CV) |
|---|---|---|
| **Características de ruteo** | Ruteo en función de la dirección de destino del datagrama. | Ruteo en función del identificador del circuito virtual (CV). |
| **Ejemplos** | Redes IP. | Redes MPLS, ATM, Frame Relay. |

## Redes de Circuitos Virtuales (CV)

### Establecimiento y Ruta

Antes de transmitir, se establece una conexión lógica denominada **Circuito Virtual (CV)**.

- Mismo origen y destino comparten la misma ruta.
- Garantiza que todos los paquetes sigan idéntico camino secuencial.

### Configuración

La infraestructura de red configura de forma dinámica el circuito usando protocolos de encaminamiento.

- Los caminos se estructuran en base a la información de routing.
- Se crean y actualizan tablas de conmutación en cada nodo de la ruta.

### Decisión y Conmutación

Cada conmutador o router intermedio decide el próximo salto del paquete analizando dos parámetros clave:

- **Identificador (ID) del CV:** Permite etiquetar el flujo de datos.
- **Tabla de conmutación de CV:** Cruza el ID con el puerto de salida óptico/físico.

### Sensibilidad a Fallas

Ante fallas de infraestructura, todos los caminos y circuitos que transitan por el enrutador afectado deben restablecerse y reconectarse por completo.

### QoS y Control de Congestión

Garantizar los parámetros de Calidad de Servicio (QoS) y evitar escenarios de congestión resulta más sencillo al predefinir las rutas lógicas del flujo.

### Arquitectura de Conexión

Flujo de paquetes a través de un circuito virtual establecido:

1. Solicitud de conexión (origen → red)
2. Llamada entrante (red → destino)
3. Aceptación (destino → red)
4. Conexión establecida (red → origen)
5. Envío de datos (origen)
6. Recepción de datos (destino)

Primero se realiza el **establecimiento** y luego fluyen los **datos** siempre por el mismo camino.

## Redes de Datagramas

- **Dirección:** Cada **datagrama** contiene de manera explícita la dirección de destino en su cabecera.
- **Conmutación:** Los conmutadores deciden el próximo nodo en base a la dirección de destino del datagrama y la tabla de conmutación interna.
- **Autonomía:** Cada decisión de ruteo es completamente **independiente** de un datagrama a otro.

### Servicio de Red No Orientado a Conexión

- **Enrutamiento:** Ante una falla en la red, los paquetes subsiguientes escogen de manera autónoma un camino alternativo.
- **QoS:** Implementar calidad de servicio (QoS) y un control de congestión eficiente resulta altamente complejo.
- **Sin conexión:** Funciona como un servicio **NO ORIENTADO A CONEXIÓN**, tratando cada paquete de forma independiente.

*Diagrama: el Equipo A envía el Paquete 1 y el Paquete 2 hacia el Equipo B, y cada uno toma un camino distinto a través de la red.*

### Topología y Envío de Datagramas

*Diagrama: el Server A envía datos (encapsulación por capas OSI: Application → Transport → Network → Data Link → Physical), los paquetes viajan por distintos routers de la red y el Server B los recibe (desencapsulación en orden inverso).*

---

# 02 – Protocolo Internet Protocol (IP)

## Protocolo IP – Características Principales

1. **Capa de red:** El protocolo IP (definido formalmente por la IETF en especificaciones como RFC 791 y RFC 8200) constituye actualmente el único estándar oficial de direccionamiento lógico en la Capa 3, operando como la arquitectura de direccionamiento global unificada sobre la cual converge todo el tráfico de Internet.
2. **Alcance global:** Se encuentra implementado en todos los dispositivos y equipos que conforman la red.
3. **Versiones:** La versión estándar actual es **IPv4**, coexistiendo con un despliegue creciente y activo de **IPv6** en entornos de nube.

**Nombre de la PDU:** Paquete

*Modelo "reloj de arena": Applications → HTTP/FTP/SMTP → TCP/UDP → **IP** (cintura) → protocolos de capa de enlace → protocolos de capa física.*

## Protocolo IP – Características del Servicio y Confiabilidad

1. **No orientado a conexión:** Funciona como una red de datagramas. Cada paquete se trata de manera independiente sin establecimiento previo de una ruta fija.
2. **Mejor esfuerzo (best effort):** El protocolo hace su mayor esfuerzo por entregar los datos, pero no garantiza que todos los paquetes lleguen a su destino final.
3. **No confiable y sin garantías:** No se realiza ninguna acción ante la pérdida de paquetes. Asimismo, no se asegura un límite en el delay ni un throughput específico.
4. **Capas superiores:** Debido a la simplicidad y falta de garantías del protocolo IP, la responsabilidad de resolver estos problemas recae en las capas superiores de la red.

---

## Protocolo IP – Subtemas

1. **Encabezado IP**
2. Direccionamiento IP
3. Subnetting

---

# Encabezado IP

### IPv4 Header

```
 0       4       8              16  19                     31
┌───────┬───────┬───────────────┬──────────────────────────┐
│Version│ HLen  │ Type of Svc   │     Total length (16)    │
│  (4)  │  (4)  │     (8)       │                          │
├───────┴───────┴───────────────┼─┬──┬──┬──────────────────┤
│      Identification (16)      │0│DF│MF│Fragment Offset(13)│
├───────────────┬───────────────┼─┴──┴──┴──────────────────┤
│ Time to live  │  Protocol (8) │   Header checksum (16)   │
│     (8)       │               │                          │
├───────────────┴───────────────┴──────────────────────────┤
│                 Source IP Address (32)                   │
├──────────────────────────────────────────────────────────┤
│               Destination IP Address (32)                │
├──────────────────────────────────────────────────────────┤
│                 Options (0 – 40 bytes)                   │
├──────────────────────────────────────────────────────────┤
│                          Data                            │
└──────────────────────────────────────────────────────────┘
```

## Campos más importantes

### ToS (Type of Service)

Se usa para **DiffServ** a través del **DSCP** (Quality of Service).

### Largo Total

Especifica la longitud total del paquete, incluyendo el **encabezado IP**.

### Time To Live (TTL)

Campo de 8 bits para evitar que los paquetes circulen infinitamente:

- **El transmisor lo setea** inicialmente al origen del envío.
- **Se decrementa en uno** cada vez que atraviesa un router.
- **Cuando llega a 0**, el paquete es automáticamente descartado.

## DiffServ

Etapas de QoS: **Clasificación y marcado** (tráfico sin clasificar; COS, DSCP, ACL, NBAR) → **Encolamiento y priorización** (Policing, Shaping, CBWFQ + LLQ) → **Herramientas de enlace** (compresión, fragmentación e intercambio).

> QoS: políticas de encolamiento WRED, LLQ, etc.

| Valor decimal | Valor DSCP | Nombre DSCP | Clase de servicio |
|---|---|---|---|
| 10 | 001 010 | AF11 | High-Throughput Data |
| 12 | 001 100 | AF12 | High-Throughput Data |
| 14 | 001 110 | AF13 | High-Throughput Data |
| 18 | 010 010 | AF21 | Low-Latency Data |
| 20 | 010 100 | AF22 | Low-Latency Data |
| 22 | 010 110 | AF23 | Low-Latency Data |
| 26 | 011 010 | AF31 | Multimedia Streaming |
| 28 | 011 100 | AF32 | Multimedia Streaming |
| 30 | 011 110 | AF33 | Multimedia Streaming |
| 34 | 100 010 | AF41 | Multimedia Conferencing |
| 36 | 100 100 | AF42 | Multimedia Conferencing |
| 38 | 100 110 | AF43 | Multimedia Conferencing |
| 0 | 000 000 | CS0 | Standard (Default/Best Effort) |
| 8 | 001 000 | CS1 | Low-Priority Data |
| 16 | 010 000 | CS2 | OAM (Operations, Administration, and Management) |
| 24 | 011 000 | CS3 | Broadcast Video |
| 32 | 100 000 | CS4 | Real-Time Interactive |
| 40 | 101 000 | CS5 | Signaling |
| 48 | 110 000 | CS6 | Network Control |
| 56 | 111 000 | CS7 | Reserved |
| 46 | 101 110 | EF | Telephony |

### Protocol (Protocolo)

Identifica al protocolo de la capa de transporte que requiere los servicios de la capa de red. El mensaje del protocolo está encapsulado en el paquete IP.

| Valor | Protocolo |
|---|---|
| 1 | ICMP (Internet Control Message Protocol) |
| 2 | IGMP |
| 4 | IP-in-IP encapsulation |
| 6 | TCP (Transmission Control Protocol) |
| 17 | UDP (User Datagram Protocol) |

## Fragmentación

### Límite de Transmisión (MTU)

La capa de enlace impone el tamaño máximo del paquete IP permitido sin fragmentación, denominado **Maximum Transmission Unit (MTU)**.

**Ejemplo típico:**

```
Ethernet MTU = 1500 bytes
```

**Proceso de fragmentación:** Si el tamaño del paquete excede la MTU de la red, se debe **fragmentar** en el origen o trayecto y **reensamblar** en el destino final.

*Diagrama: la PC origen genera un datagrama de 1500 bytes en la Red A; el enlace entre redes (R-A3 ↔ R-B3) tiene MTU de 600 B, por lo que el paquete se fragmenta. Cada fragmento lleva su propia cabecera IP.*

### Campos involucrados

- **Identificador:** Identificador del paquete fragmentado, permitiendo al destino asociar los fragmentos de un mismo datagrama.
- **Flags:** Banderas que controlan o identifican la fragmentación:
  - **DF** (Don't Fragment): Impide la fragmentación.
  - **MF** (More Fragments): Indica que quedan fragmentos por recibir.
- **Fragment Offset:** Cuando se fragmenta, indica la posición exacta en que se inserta el paquete recibido, medido en unidades de 8 bytes.

## Fragmentación de Paquetes IP – Ejemplo práctico

División de un datagrama de 4028 bytes.

### Paquete inicial (origen) – Total: 4028 bytes

| IP | ICMP | Datos ICMP |
|---|---|---|
| 20 B | 8 B | 4000 B |

**Detalles de encapsulación:**

- La **cabecera IP** añade 20 bytes de control de red.
- La **cabecera ICMP** de 8 bytes va dentro de los datos IP.
- Los **datos puros** a transmitir son 4000 bytes.
- El tamaño total supera la MTU típica de 1500 bytes.

### Fragmentos

| Fragmento | Contenido | Protocolo | ID | Bit MF | Offset | Tamaño total |
|---|---|---|---|---|---|---|
| **1** | 20 B (IP) + 8 B (ICMP) + 1472 B (datos) | ICMP | 98765 | 1 (hay más fragmentos) | 0 (0 bytes / 8) | 1480 B |
| **2** | 20 B (IP) + 1480 B (datos) | ICMP | 98765 | 1 (hay más fragmentos) | 1480 (185 × 8) | 1480 B |
| **Final** | 20 B (IP) + 1048 B (datos) | ICMP | 98765 | 0 (último fragmento) | 2960 (370 × 8) | 1048 B |

### Dirección IP de Origen y Destino

**Campo de 32 bits.** Campos obligatorios que identifican de manera única los hosts remitente y receptor para el enrutamiento del paquete.

### Opciones IPv4

**Poco utilizadas (variable).** Se emplean rara vez para pruebas de red o seguridad. Un ejemplo es el registro de los routers por los que pasa el paquete.

---

## Protocolo IP – Subtemas

1. Encabezado IP
2. **Direccionamiento IP**
3. Subnetting

---

# Direccionamiento IP

## Direcciones IPv4

**Concepto clave:**

- Identificador único asignado a las interfaces de red de hosts, servidores y routers.
- Representado en **notación de punto decimal**: compuesto por **4 bytes (32 bits)** separados por puntos.

| Octeto | Binario | Decimal |
|---|---|---|
| Byte 1 | `00001100` | 12 |
| Byte 2 | `00001011` | 11 |
| Byte 3 | `00001010` | 10 |
| Byte 4 | `00001001` | 9 |

Dirección resultante: **`12.11.10.9`**

## Tipo de Direcciones IP – Organismos de Asignación

### Gestión Global (ICANN / IANA)

La Autoridad de Números Asignados en Internet (IANA), como parte de la ICANN, es la encargada de la asignación global de los bloques de direcciones IP a los diferentes registros regionales del mundo.

### Distribución Regional (LACNIC)

El territorio de América Latina y el Caribe está bajo la coordinación de LACNIC, el registro regional que asegura la correcta distribución de recursos de Internet en nuestra región.

### Registros Regionales (RIR)

**IANA** delega en cinco registros regionales:

| RIR | Región | Registros nacionales (ejemplos) |
|---|---|---|
| **LACNIC** | América Latina | NIC México, NIC Brasil |
| **ARIN** | América del Norte | — |
| **RIPE NCC** | Eurasia / Medio Oriente | — |
| **AFRINIC** | África | — |
| **APNIC** | Asia / Pacífico | APJII (Indonesia), KRNIC (Corea), CNNIC (China), TWNIC (Taiwán), JPNIC (Japón), VNNIC (Vietnam) |

## Clases de Direcciones IPv4

Las direcciones IPv4 se organizan en **5 clases** dependiendo de los primeros **4 bits**.

- **Clase A:** Primeros **8 bits** de red, últimos 24 bits de hosts. Empieza por binario **"0"**.
- **Clase B:** Primeros **16 bits** de red, últimos 16 bits de hosts. Empieza por binario **"10"**.
- **Clase C:** Primeros **24 bits** de red, últimos 8 bits de hosts. Empieza por binario **"110"**.

### Distribución de Red y Host

| Clase | 1er byte | 2do byte | 3er byte | 4to byte | 1er byte (binario) | 1er byte (decimal) |
|---|---|---|---|---|---|---|
| A | RED | HOST | HOST | HOST | `0xxxxxxx` | 1–127 |
| B | RED | RED | HOST | HOST | `10xxxxxx` | 128–191 |
| C | RED | RED | RED | HOST | `110xxxxx` | 192–223 |
| D | *multidifusión* | | | | `1110xxxx` | 224–239 |
| E | *investigación* | | | | `11110xxx` | 240–247 |

### Rangos por clase

| Clase | Bits iniciales | Dirección inicio | Dirección fin |
|---|---|---|---|
| A | `0` | 1.0.0.0 | 126.0.0.0 (0 y 127 reservados) |
| B | `10` | 128.0.0.0 | 191.255.0.0 |
| C | `110` | 192.0.0.0 | 223.255.255.0 |
| D | `1110` | 224.0.0.0 | 239.255.255.0 |
| E | `11110` | 240.0.0.0 | 255.255.255.0 |

## Agrupación en Redes IP

### Estructura de la Dirección IP

- **Porción de Red:** Identifica el segmento de red lógico al que pertenece el dispositivo.
- **Porción de Host:** Identifica el dispositivo físico específico dentro de esa subred.

### Regla de Conectividad

Si dos equipos tienen exactamente la **misma porción de red**, entonces están en la **misma red IP** y se comunican directamente sin requerir saltos adicionales de enrutamiento.

**Ejemplo:** un router con tres interfaces conecta tres redes:

| Red | Interfaz del router | Hosts |
|---|---|---|
| 223.1.1.x | 223.1.1.4 | 223.1.1.1, 223.1.1.2, 223.1.1.3 |
| 223.1.2.x | 223.1.2.9 | 223.1.2.1, 223.1.2.2 |
| 223.1.3.x | 223.1.3.7 | 223.1.3.1, 223.1.3.2 |

### Segmentación

Los **routers** actúan como fronteras lógicas, separando distintas **redes IP** (numeración) a través de sus interfaces físicas y lógicas.

| Interfaz | Dirección |
|---|---|
| Eth0 | 223.1.2.9 |
| Eth1 | 223.1.3.27 |
| Eth2 | 223.1.1.4 |

### Escalabilidad

Los dispositivos no requieren conocer la ubicación exacta de cada host, sino únicamente **cómo llegar a cada red**.

## Direcciones reservadas en cada red

### Dirección de Red

- La **primera** dirección de cualquier red.
- Representada por todos **ceros** en la porción de host.

### Dirección de Broadcast

- La **última** dirección de cualquier red.
- Representada por todos **unos** en la porción de host.

*Ejemplo: en la red `192.168.5.0/24`, un mensaje enviado a la IP de broadcast `192.168.5.255` llega a todos los equipos (192.168.5.1 a 192.168.5.6).*

## Ejemplos: direcciones de red y de broadcast

| | Clase A: `12.0.0.0` | Clase C: `192.168.5.0` |
|---|---|---|
| **Rango** | 12.0.0.0 – 12.255.255.255 | 192.168.5.0 – 192.168.5.255 |
| **Dirección de red** | 12.**0.0.0** | 192.168.5.**0** |
| **Dirección de broadcast** | 12.**255.255.255** | 192.168.5.**255** |

## Tipo de Direcciones IP

### Tipos de Direccionamiento

- **Unicast:** Comunicación uno a uno. Identifica un único dispositivo. Ej: `192.168.1.1`
- **Broadcast:** Comunicación uno a todos los hosts de la red. Ej: `192.168.1.255`
- **Multicast:** Comunicación uno a un grupo específico de hosts. *IPs reservadas especiales.*

### Clases de Direcciones IPv4

- **Clases A, B y C:** Son destinadas para la comunicación de tipo **Unicast**.
- **Clase D:** Se reserva de manera exclusiva para direcciones de **Multicast**.
- **Clase E:** Se encuentra **reservada** para fines de investigación (IETF).

### Otra clasificación

- **Direcciones privadas:** Se usan solo para redes internas (como empresas u hogares). Funcionan como «barreras» de seguridad para impedir que cualquier persona acceda desde el exterior.
- **Direcciones públicas:** Son visibles y accesibles desde todo Internet. Permiten la comunicación externa de cualquier dispositivo fuera de su red local.

### Rangos de Direcciones (IPv4)

**Rangos privados:**

| Clase | Dirección inicio | Dirección fin |
|---|---|---|
| A | 10.0.0.0 | 10.255.255.255 |
| B | 172.16.0.0 | 172.31.255.255 |
| C | 192.168.0.0 | 192.168.255.255 |

**Rangos por clase:**

| Clase | Dirección inicio | Dirección fin |
|---|---|---|
| A | 0.0.0.0 | 126.255.255.255 |
| B | 128.0.0.0 | 191.255.255.255 |
| C | 192.0.0.0 | 223.255.255.255 |
| D | 224.0.0.0 | 239.255.255.255 |
| E | 240.0.0.0 | 254.255.255.255 |

## Herramienta: `ipconfig`

### Configuración en Windows

- **Diagnóstico de interfaz:** Permite realizar la verificación de los parámetros IP configurados de manera activa en cada interfaz de red de su PC.
- **Información detallada:** Use la variante **`ipconfig /all`** para visualizar detalladamente las propiedades de red de cada adaptador.

### Salida del comando

```
C:\>ipconfig

Configuración IP de Windows

Adaptador Ethernet Conexión de área local      :

        Sufijo de conexión específica DNS :
        Dirección IP. . . . . . . . . . . : 192.168.1.2
        Máscara de subred . . . . . . . . : 255.255.255.0
        Puerta de enlace predeterminada   :
```

## Investigue: Dirección IP

Conectado a una red inalámbrica, abra una terminal de comandos en su PC y responda las siguientes preguntas:

1. **¿Cuántas interfaces?** ¿Cuántas interfaces de red tiene su equipo y de qué manera se identifican dentro del sistema?
2. **IP y máscara:** ¿Qué dirección IP y máscara de subred tiene configurada activamente en cada una de las interfaces?
3. **Otros dispositivos:** Identifique al menos dos dispositivos que se encuentren conectados y pertenecientes a su misma red.

> 💡 **Sugerencia:** El comando `ipconfig` en la consola del sistema le será de gran utilidad para resolver estas preguntas.

---

## Comentarios / Preguntas

---

# Key Points – Capa 3 (Red)

- **Circuitos virtuales (orientado) y datagramas (no orientado a conexión):** diferencias fundamentales, ventajas y desventajas de ambas modalidades.
- **Protocolo Internet Protocol (IP):** encabezado IP, campos más importantes, concepto de fragmentación, cómo se fragmenta un paquete IP y qué campos involucra.
- **Direccionamiento IP:** notación de dirección IP, porción de red/host. Direcciones reservadas (red y broadcast), cómo calcularlas. Clases de direcciones (A, B, C), en qué se diferencian. Tipos de direcciones (privadas, públicas), en qué se diferencian. Reconocer los rangos de IPs privadas (10.0… 172.16… 192.168…).
