# Introducción a las Redes de Datos

> **Clase 01a:** Introducción · Componentes de la red · Clasificación de redes

---

## Índice

1. **¿Para qué se utilizan las redes de datos?**
2. Definición de red de datos
3. Clasificación de redes (según topología y según tamaño)
4. Componentes de una red (sistemas finales, redes de acceso, núcleo, protocolos)
5. Intercambio de información (unicast, multicast, broadcast)
6. Conmutación de circuitos vs. conmutación de paquetes
7. Protocolos y organismos de estandarización
8. Key Points

---

# 01 – Introducción

## ¿Para qué se utilizan las redes de datos?

| N.º | Uso | Descripción |
|---|---|---|
| 01 | **Comunicación** | Como medio de comunicación entre personas. |
| 02 | **Intercambio de datos** | Para intercambiar datos entre dispositivos y aplicaciones. |
| 03 | **Compartir recursos** | Para compartir almacenamiento, cómputo, cámaras, sensores, etc. |
| 04 | **Compartir información** | Acceso y distribución de datos compartidos de forma directa. |
| 05 | **Trabajo colaborativo** | Facilita la cooperación y sinergia de equipos en tiempo real. |
| 06 | **Entretenimiento** | Acceso a servicios de ocio y multimedia locales y globales. |
| 07 | **Teletrabajo** | Conectividad para realizar actividades laborales a distancia. |
| 08 | **Sistemas distribuidos** | Implementación de alta disponibilidad y tolerancia a fallos. |

## Definición – Red de datos

- **Conjunto de dispositivos y equipos informáticos** conectados entre sí mediante dispositivos físicos.
- **Envío y recepción de datos** por medio de impulsos eléctricos, ondas electromagnéticas o cualquier otro transporte físico.
- **Diseñado con el fin común** de compartir información, recursos tecnológicos y ofrecer diversos servicios de red.

---

# 02 – Clasificación de Redes

## Clasificación de redes según topología

```
  ESTRELLA                 MALLA                    ANILLO

   o   o   o              o ─── o                  o ───── o
    \  |  /               │╲   ╱│                 /         \
     \ | /                │ ╲ ╱ │                o           o
 o ─── o ─── o            │  ╳  │                 \         /
     / | \                │ ╱ ╲ │                  o ───── o
    /  |  \               │╱   ╲│
   o   o   o              o ─── o
  (nodo central)      (todos con todos)       (cada nodo con dos vecinos)
```

### Topología en Estrella

**Ventajas**

- **Fácil gestión de nodos:** es muy simple añadir o remover un dispositivo con solo conectar o desconectar el cable físico.
- **Tolerancia a fallos:** si un nodo o su cable se dañan, solo ese equipo se ve afectado; el resto de la red sigue comunicándose con normalidad.
- **Costo eficiente:** presenta un costo significativamente menor de implementación y mantenimiento comparado con una topología en malla.

**Desventaja principal**

- **Punto único de falla:** si el elemento central (switch o hub) falla, toda la red queda completamente incomunicada y fuera de servicio.

### Topología en Malla

**Ventajas**

- **Robustez:** robustez ante fallas múltiples.
- **Eficiencia:** camino "más corto" entre nodos adyacentes.

**Desventajas**

- **Complejidad de enlaces:** se requieren múltiples links físicos o lógicos, `n(n-1)/2` en toda la red.
- **Desperdicio potencial:** eventual desperdicio de ancho de banda en algunos links (o requiere ingeniería de tráfico adicional).
- **Interfaces:** mayor número de interfaces en nodos (`n-1`).
- **Escalabilidad:** no escala al crecer la cantidad de nodos de la red.

### Topología en Anillo

**Ventajas**

- **Tolerancia a fallos simples:** ofrece un camino alternativo de transmisión ante la desconexión de un enlace.
- **Bajo costo:** requiere menos enlaces (`n`) y menos interfaces (2 por nodo) en comparación con una red totalmente mallada.

**Desventajas**

- **Mantenimiento disruptivo:** para añadir o remover un nodo es necesario abrir físicamente el anillo, interrumpiendo temporalmente el servicio.
- **Sobrecarga de tráfico:** los nodos de paso deben soportar tanto el tráfico de datos propio como el de los demás pares de la red.

### Resumen comparativo

| Topología | Enlaces | Interfaces por nodo | Punto crítico |
|---|---|---|---|
| Estrella | Uno por nodo hacia el centro | 1 (el nodo central tiene n) | Elemento central (punto único de falla) |
| Malla | `n(n-1)/2` | `n-1` | No escala |
| Anillo | `n` | 2 | Agregar/quitar nodos interrumpe el servicio |

## Clasificación de redes – según el tamaño

| Sigla | Nombre | Alcance |
|---|---|---|
| **PAN** | Personal Área Network | Dispositivos personales (Bluetooth, USB, infrarrojo) |
| **LAN** | Local Área Network | Dentro de un edificio (switches, wifi) |
| **MAN** | Metropolitan Área Network | Extensión de LAN a campus, complejo, ciudad |
| **WAN** | Wide Área Network | Red a nivel nacional, internacional |

```
   PAN  ⊂  LAN  ⊂  MAN  ⊂  WAN
```

*(La lámina muestra además una figura con un globo terráqueo (WAN) que conecta redes MAN y LAN, y un esquema "RED PAN" con dispositivos Bluetooth alrededor de una PC y un notebook.)*

## LAN vs WAN

| | **LAN** | **WAN** |
|---|---|---|
| **Cobertura** | Dentro de un edificio o de un campus | Se extiende por una región usando redes públicas (de proveedores) |
| **Dueño de la infraestructura** | Una persona o empresa | Un proveedor de servicio |
| **Ejemplos** | Redes hogareñas, oficinas, laboratorio, facultad, etc. | Redes privadas de empresas, redes sobre Internet, etc. |

---

# 03 – Componentes de una Red

> Referencia bibliográfica de la sección: *Computer Networking: A Top-Down Approach*.

## Componentes de una Red

**Hardware, software, medios de transmisión, protocolos.**

| N.º | Componente | Descripción |
|---|---|---|
| 01 | **Hosts o sistemas finales** | Móviles, PCs, servidores, cámaras, sensores, impresoras, etc. |
| 02 | **Redes de acceso** | Red de fibra óptica (FTTH), red de cobre (ej. ADSL), red inalámbrica, módems, equipos de acceso (en el proveedor). |
| 03 | **Núcleo de la red** | Routers, equipos de transmisión, redes ópticas terrestres y submarinas, sistemas de transmisión inalámbricos. |
| 04 | **Protocolos** | Control, gestión, transporte de datos. |

## Sistemas finales

Los componentes clave que constituyen la infraestructura de un host.

### Hardware

- **Dispositivos de usuario final:** notebooks, PCs, dispositivos móviles, impresoras, entre otros.
- **Servidores dedicados:** sistemas de aplicaciones, bases de datos y almacenamiento masivo.
- **Conectividad de red:** adaptadores de red (inalámbricos, cobre u ópticos) gestionados por firmware y software.

### Software

- **Sistema operativo:** actúa como el intermediario fundamental, proveyendo todo el software de red base requerido para la comunicación.
- **Integración con aplicaciones:** permite que los programas del usuario final accedan y utilicen los recursos y protocolos de red de forma transparente.

## Sistemas finales – Modelo cliente–servidor

*Modelo cliente–servidor y arquitectura de red de aplicación distribuida.*

- **Aplicación distribuida:** hay una instancia de software ejecutándose en cada sistema. El **servidor** brinda un servicio; el **cliente** lo solicita y recibe.
- La mayoría del intercambio de datos en Internet sigue este modelo de comunicación activa.
- **Ejemplos:** email, web (HTTP), transferencia de archivos (FTP).

*Diagramas obtenidos en https://www.researchgate.net*

## Sistemas finales – Modelo Peer-to-peer (P2P)

*Modelo Peer-to-peer (P2P) y compartición descentralizada de archivos.*

### Conexión directa entre pares

```
 PLAYER 1 (HOST/SERVER) ─────────── PLAYER 4
          │                    ╲
          │                      ╲
       PLAYER 2                  PLAYER 3
```

Los pares (jugadores) se conectan directamente entre sí, sin un servidor dedicado intermedio.

### Protocolo de distribución BitTorrent

```
                 archivo .torrent ◄──── Web server
                       │
                       ▼
 Downloader ── Announce ──────► Tracker
            ◄─ Response (peer list) ──
     │  ▲
 Pieces  Pieces ◄──────► Seed
     ▼  │
  (otros pares)
```

- El *downloader* obtiene el archivo `.torrent` desde un servidor web.
- Consulta al **tracker** (*Announce* / *Response – peer list*) para conocer a los demás pares.
- Intercambia **piezas** (*Pieces*) con el **seed** y con otros pares.

*Diagramas obtenidos en https://www.researchgate.net*

## Intercambio de información

Diferentes métodos de transmisión de datos en redes.

| Método | Descripción |
|---|---|
| **Unicast** | Envío uno a uno, de forma unidireccional o bidireccional, entre dos nodos específicos. |
| **Multicast** | Envío de uno a varios receptores específicos, requiriendo una suscripción previa del host. |
| **Broadcast** | Envío masivo y simultáneo de información a todos los integrantes de la red. |

## Redes de acceso

Conectan los sistemas finales con la red. Los enlaces hacia el cliente se implementan sobre distintos medios físicos:

- **Par de cobre**
- **Cable coaxial**
- **Fibra óptica**
- **Radioenlaces**

### Evolución de la red de acceso

*Evolución de la red de acceso (fuente: Telecom): Cobre ⇒ Fo + cobre (NGN) ⇒ Fo (FTTH, PON).*

- **Digital subscriber line (DSL):** sobre el par de cobre, desde la central/nodo, pasando por cable multipar primario y secundario, caja de distribución y bloque terminal hasta el hogar.
  - Cobre: **Voz + Datos a 6 Mbps**.
  - Fibra + cobre (NGN): **Voz + Datos + Video ⇒ 20 Mbps**.
  - Fibra hasta el hogar (FTTH, PON): fibra desde la central hasta el cliente.
- En DSL el espectro se divide en bandas: telefonía (PSTN), subida (*upstream*) y bajada (*downstream*), esta última la de mayor ancho (hasta 1104 kHz).

### Evolución del acceso (ancho de banda vs. tiempo)

| Año | Tecnología | Velocidad | Aplicaciones |
|---|---|---|---|
| 1998 | Módem | 19,2 Kbps | e-mail |
| ~1999 | Módem | 33 Kbps | e-mail, Web |
| ~2000 | Módem (máxima velocidad dial up) | 56 Kbps | e-mail, Web, FTP, mensajería instantánea, download centralizado, radios on-line, gaming |
| 2001 (inicio banda ancha) | ADSL | 256 Kbps | e-mail, Web, FTP, mensajería instantánea, download centralizado, radios on-line, gaming, VoIP |
| 2005 | ADSL | 5 Mbps | + streaming audio y video, VPN |
| 2007 | ADSL | 20 Mbps (**1000 veces más rápido que con el 1.er módem dial up**) | + broadcast TV, video on demand, HDTV, video telephony |

**Gigabit Passive Optical Network (GPON):** 2,5 Gbps downstream / 1,25 Gbps upstream.

## Núcleo de las redes

### Interconexión de redes de acceso

Interconectan las diferentes redes de acceso para que los sistemas finales puedan intercambiar datos entre sí.

### Conectividad global

Se conectan a otras redes para extender la conectividad (ej. Internet).

### Modelos de intercambio de datos

| Modelo | Ejemplos |
|---|---|
| **Conmutación de circuitos** | Telefonía convencional; ATM (Asynchronous Transfer Mode) |
| **Conmutación de paquetes** | Internet; redes Ethernet |

## Conmutación de circuitos

- **Uso exclusivo:** cada flujo de información utiliza un circuito reservado mientras dura la comunicación.
- **Capacidad asegurada:** la capacidad de transmisión de cada circuito es totalmente fija y está garantizada.
- **Ruta estable:** el camino en la red es fijo, lo que permite que el retardo sea predecible y estable.

```
 Sistema de 3 circuitos: ■ ● ▲

 ■ ■ ■ ──┐                                        ┌── ■ ■ ■
 ● ● ● ──┤► [ MUX ] ═══ Circuitos (3 canales) ═══► [ DEMUX ] ├── ● ● ●
 ▲ ▲ ▲ ──┘                                        └── ▲ ▲ ▲
        Multiplexor                           Demultiplexor
```

> **Multiplexión:** técnica de combinar varias señales o flujos de datos para transmitirlos simultáneamente a través de un mismo medio.

## Conmutación de paquetes

- **Multiplexado estadístico:** se utiliza un multiplexado estadístico que permite que la suma de las velocidades de los canales de entrada supere la velocidad del canal de salida.
- **Ventaja:** mejor aprovechamiento del ancho de banda.
- **Desventaja:** aparecen los fenómenos de retardo variable y pérdida de paquetes.

### Multiplexación estadística

```
 Notebook 1 ──200 Mbps──┐
                         ├─► [ Router inalámbrico ] ──50 Mbps──► Internet
 Notebook 2 ──200 Mbps──┘          │
                              Cola o buffer de paquetes
```

- **Cola o buffer de paquetes:** en espera de ser enviados por la interfaz de salida.
- Escenario de la lámina: dos equipos transmiten a 200 Mbps cada uno hacia un router inalámbrico con conexión a Internet de 50 Mbps.

## Conmutación de paquetes (cont.)

Si a un equipo le llegan `x1` paquetes/s y puede enviar `x2` paquetes/s, dependiendo de la relación entre ambos puede ocurrir:

- **Pérdidas de paquetes individuales:** ocurre cuando el buffer/cola se llena por completo.
- **Retardos en la cola:** los paquetes esperan su turno en el buffer para ser enviados.
- **Variación del retardo:** diferencias en los tiempos de espera entre un paquete y otro.

> **Simulación interactiva:** la lámina incluye un enlace "Acceder a la simulación en línea".

### Circuitos vs. paquetes

| Aspecto | Conmutación de circuitos | Conmutación de paquetes |
|---|---|---|
| Recursos | Circuito reservado (uso exclusivo) | Compartidos (multiplexado estadístico) |
| Capacidad | Fija y garantizada | Aprovechamiento del ancho de banda |
| Ruta | Fija | Variable |
| Retardo | Predecible y estable | Variable; posible pérdida de paquetes |
| Ejemplos | Telefonía convencional, ATM | Internet, Ethernet |

---

# 04 – Protocolos

## ¿Qué es un protocolo?

> Un protocolo define el **formato** y el **orden** de los mensajes intercambiados entre dos o más entidades que se comunican, así como las **acciones** que se toman en la transmisión y/o recepción de un mensaje.
>
> *Tomado de: Computer Networking – Kurose, Ross*

## Organismos de estandarización

Los protocolos son definidos por distintos organismos de estandarización.

| Organismo | Nombre | Descripción | Ejemplo |
|---|---|---|---|
| **ITU** | International Telecommunication Union | Sector de Normalización de Telecomunicaciones (ITU-T) que coordina estándares globales. | Estándar global |
| **IETF** | Internet Engineering Task Force | Comunidad abierta que define y promueve la arquitectura de Internet. | RFC 791 (IP) – "Ver RFC 791" |
| **IEEE** | Institute of Electrical & Electronics Engineers | Desarrolla estándares para redes locales, metropolitanas y otras tecnologías. | 802.11 (WiFi) – "Ver IEEE 802.11" |
| **ISO** | International Organization for Standardization | Federación mundial que define estándares industriales y de interconexión. | IS-IS protocol – "Descargar Protocolo" |

---

# 05 – Key Points – Introducción 01a

- **Modelos:** Cliente–Servidor – Peer to peer.
- **Intercambio de información:** Uni, Multi, Broadcast.
- **Red de acceso:** Par de cobre, Fibra, Coaxial, Radio.
- **Diferencia entre** conmutación de circuitos vs. paquetes.
- **Clasificación de redes:**
  - Por tamaño (LAN, WAN, etc.).
  - Por topología (estrella, malla, anillo), ventajas/desventajas, usos.
