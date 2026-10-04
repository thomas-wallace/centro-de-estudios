# Modelo en Capas – Capa 3: Red

> **Flujo de datos:** Física → Enlace → **Red** → Transporte → Aplicación

---

## La capa de Red – Otros Protocolos

1. Address Resolution Protocol (ARP)
2. Internet Control Message Protocol (ICMP)
3. Dynamic Host Configuration Protocol (DHCP)

---

# 01 – Address Resolution Protocol (ARP)

## Introducción

Supongamos que un equipo quiere enviar un paquete IP con destino a otra máquina en el mismo segmento Ethernet.

| Host de Origen | → Envío de Paquete IP → | Host de Destino |
|---|---|---|
| `192.168.1.1/24` | | `192.168.1.3/24` |

> **¿Cómo el equipo conoce la dirección MAC del host de destino?**

## Address Resolution Protocol (ARP)

El protocolo ARP se utiliza para **encontrar la dirección de hardware (MAC)** de destino una vez conocida la **dirección IP** del equipo de destino.

### ARP Request (Broadcast)

**¿Quién tiene esta IP?**

Es un mensaje de difusión enviado a toda la red preguntando: *"El que tenga esta IP, que me diga su MAC"*.

### ARP Reply (Unicast)

**Yo tengo esa IP, esta es mi MAC**

Es una respuesta directa (unicast). **Sólo lo responde** el equipo que tiene esa dirección IP configurada, enviando su dirección MAC.

## Mensaje – ARP Request

Escenario de ejemplo:

| Equipo | MAC | IP |
|---|---|---|
| A | `00:e0:4c:9b:e1:de` | `192.168.1.1` |
| B | `af-af-af-99-99-99` | `192.168.1.9` |
| C | `00:0d:29:42:31:0c` | `192.168.1.3` |

- **Pedido de ARP – Broadcast**
- ¿Quién tiene la IP `192.168.1.3`?
- MAC destino: `ff:ff:ff:ff:ff:ff`

El mensaje llega a todos los equipos del segmento.

## Mensaje – ARP Reply

- **Respuesta de ARP – unicast** (de C hacia A)
- Esta es mi MAC: `00:0d:29:42:31:0c`

## Secuencia de mensajes ARP "Request" y "Reply"

### 1. ARP Request (Solicitud)

```
Frame 147 (42 bytes on wire, 42 bytes captured)
Ethernet II, Src: RealtekS_9b:e1:de (00:e0:4c:9b:e1:de), Dst: Broadcast (ff:ff:ff:ff:ff:ff)
Address Resolution Protocol (request)
    Hardware type: Ethernet (0x0001)
    Protocol type: IP (0x0800)
    Hardware size: 6
    Protocol size: 4
    Opcode: request (0x0001)
    Sender MAC address: RealtekS_9b:e1:de (00:e0:4c:9b:e1:de)
    Sender IP address: 192.168.1.1 (192.168.1.1)
    Target MAC address: 00:00:00_00:00:00 (00:00:00:00:00:00)
    Target IP address: 192.168.1.3 (192.168.1.3)
```

### 2. ARP Reply (Respuesta)

```
Frame 148 (60 bytes on wire, 60 bytes captured)
Ethernet II, Src: Cisco_42:31:0c (00:0d:29:42:31:0c), Dst: RealtekS_9b:e1:de (00:e0:4c:9b:e1:de)
Address Resolution Protocol (reply)
    Hardware type: Ethernet (0x0001)
    Protocol type: IP (0x0800)
    Hardware size: 6
    Protocol size: 4
    Opcode: reply (0x0002)
    Sender MAC address: Cisco_42:31:0c (00:0d:29:42:31:0c)
    Sender IP address: 192.168.1.3 (192.168.1.3)
    Target MAC address: RealtekS_9b:e1:de (00:e0:4c:9b:e1:de)
    Target IP address: 192.168.1.1 (192.168.1.1)
```

> Luego que el equipo averiguó la MAC… **¿Qué hace con la misma?**

## Tabla dinámica de ARP

### Asociaciones Aprendidas

Todo dispositivo mantiene una **tabla dinámica de ARP** en la que almacena temporalmente las relaciones aprendidas:

**Dirección IP ↔ Dirección MAC**

### Optimización de Tráfico

Si se requiere comunicar con un destino antes de que expire su entrada, **no se repite el pedido de ARP**.

El sistema optimiza el tiempo de respuesta tomando el dato directamente de la tabla local.

## Herramienta: `arp`

### Comandos de Diagnóstico

Utilizada en **Windows y Linux** para ver y manipular la tabla de traducción de direcciones IP a MAC de la PC.

| Comando | Descripción |
|---|---|
| `arp -a` | Muestra la tabla de ARP completa. |
| `arp -d` | Borra una entrada específica. |
| `arp -s` | Agrega una asociación estática. |

### Consola: `arp -a`

```
C:\>arp -a

Interfaz: 192.168.1.2 --- 0x2
  Dirección IP          Dirección física      Tipo
  192.168.1.1           00-50-54-7c-f0-9b     dinámico
```

**Interpretación de la Tabla ARP:**

- **Dirección IP:** Destino de la red local (ej. 192.168.1.1).
- **Dirección física:** Dirección MAC única de la interfaz.
- **Tipo dinámico:** La asociación fue aprendida automáticamente.

## Gratuitous ARP

### Generación Autónoma

Es generado de forma proactiva por el propio dispositivo de la red sin necesidad de una solicitud previa de otro host.

- **Origen propio:** El dispositivo anuncia o actualiza su información de forma voluntaria.
- **Actualización rápida:** Evita inconsistencias en las tablas ARP de los switches de la red.

### Wireshark: Gratuitous ARP

```
Frame 132 (60 bytes on wire, 60 bytes captured)
Ethernet II, Src: Cisco_42:31:0c (00:0d:29:42:31:0c), Dst: Broadcast (ff:ff:ff:ff:ff:ff)
Address Resolution Protocol (reply/gratuitous ARP)
    Hardware type: Ethernet (0x0001)
    Protocol type: IP (0x0800)
    Hardware size: 6
    Protocol size: 4
    Opcode: reply (0x0002)
    Sender MAC address: Cisco_42:31:0c (00:0d:29:42:31:0c)
    Sender IP address: 192.168.1.3 (192.168.1.3)
    Target MAC address: Broadcast (ff:ff:ff:ff:ff:ff)
    Target IP address: 192.168.1.3 (192.168.1.3)
```

**Análisis del Paquete:**

- **Sender IP == Target IP:** Ambos campos contienen 192.168.1.3 (autoverificación).
- **Destino Broadcast:** Se envía a todos los equipos para actualizar sus tablas de inmediato.

## Ejemplo Práctico de Gratuitous ARP

**Escenario:**

- Router A: `10.0.0.2` – MAC `0053.ffff.aaaa`
- Router B: `10.0.0.3` – MAC `0053.ffff.bbbb`
- IP/MAC compartida: `10.0.0.1` – `0053.ffff.1111`
- Tabla MAC del switch tras el evento: `Port 2 <---> 0053.ffff.1111`

### Funcionamiento del Proceso

**1. Falla y Conmutación**
Dos routers operan en alta disponibilidad compartiendo IP y MAC. Al fallar el principal, el secundario asume el control y emite un **Gratuitous ARP** de forma proactiva para notificar a la red.

**2. Aprendizaje del Switch**
Al recibir este mensaje broadcast, el switch actualiza de inmediato su tabla de direcciones MAC asociándola a la nueva ubicación física (puerto del router activo actual).

*Adaptado de: https://www.practicalnetworking.net/series/arp/gratuitous-arp/*

---

# 02 – Internet Control Message Protocol (ICMP)

## Protocolo ICMP

- **Estándar:** RFC 792
- **Propósito principal:** Se usa para enviar mensajes de diagnóstico y error en la red.
- **Encapsulamiento:** Se transporta directamente sobre el protocolo IP.

### Funciones

- **Anunciar errores en la red:** Notifica si un host, red o puerto de destino es inalcanzable (*"network unreachable"*).
- **Anunciar congestión en la red:** Informa al emisor para reducir la velocidad de transmisión (*"ICMP Source Quench"*).
- **Troubleshooting (Diagnóstico):** Permite verificar la conectividad activa de un host mediante mensajes de **"Echo"**.
- **Control de Expiración (Timeouts):** Si el TTL de un paquete llega a cero, el router lo descarta y genera una alerta ICMP de vuelta al origen.

## Paquete ICMP

### Formato de Paquete (Estructura de Cabecera)

| Type | Code | Checksum |
|---|---|---|
| ID | | Sequence |

- **Campo "Data" (Opcional):** Contiene información arbitraria provista por el emisor (ej. datos de diagnóstico).
- **Campos Type y Code:** Son los más usuales para identificar el propósito y resultado del mensaje de control.

### Tipos y Códigos más Comunes

| Type | Code | Descripción |
|---|---|---|
| 0 | 0 | echo reply (ping) |
| 3 | 0 | dest. network unreachable |
| 3 | 1 | dest host unreachable |
| 3 | 2 | dest protocol unreachable |
| 3 | 3 | dest port unreachable |
| 3 | 6 | dest network unknown |
| 3 | 7 | dest host unknown |
| 4 | 0 | source quench (congestion control – not used) |
| 8 | 0 | echo request (ping) |
| 9 | 0 | route advertisement |
| 10 | 0 | router discovery |
| 11 | 0 | TTL expired |
| 12 | 0 | bad IP header |

## Herramienta: `ping`

### Diagnóstico de red – Windows y Linux

- **Verificación de Conectividad:** Se comprueba el enlace con un host remoto enviando un mensaje de tipo **"Echo request"** y esperando un **"Echo reply"**.
- **Medición de Retardos:** Calcula el tiempo que tardan los paquetes en realizar el viaje de **ida y vuelta** (latencia).

### Ejemplo de Comando y Respuesta

```
C:\>ping 192.168.1.1

Haciendo ping a 192.168.1.1 con 32 bytes de datos:

Respuesta desde 192.168.1.1: bytes=32 tiempo<1m TTL=255
Respuesta desde 192.168.1.1: bytes=32 tiempo<1m TTL=255
Respuesta desde 192.168.1.1: bytes=32 tiempo<1m TTL=255
Respuesta desde 192.168.1.1: bytes=32 tiempo<1m TTL=255

Estadísticas de ping para 192.168.1.1:
    Paquetes: enviados = 4, recibidos = 4, perdidos = 0
    (0% perdidos),
Tiempos aproximados de ida y vuelta en milisegundos:
    Mínimo = 0ms, Máximo = 0ms, Media = 0ms
```

### Flujo de Comunicación – Intercambio ICMP

```
Source (192.168.0.5)  ── ICMP Echo Request ──►  Destination (192.168.0.3)
Source (192.168.0.5)  ◄── ICMP Echo Reply ────  Destination (192.168.0.3)
```

- **Origen (Source):** Envía la solicitud "Echo Request" para verificar la conectividad de red de forma directa.
- **Destino (Destination):** Procesa el paquete recibido y devuelve un "Echo Reply" con los mismos datos.

**Pasos:**

1. **Solicitud de Conectividad** – `ping 192.168.0.3`
   Se inicia el comando desde el host origen hacia la dirección IP de destino.
2. **Respuesta del Destino**
   El host remoto recibe la solicitud, **copia el campo "data"** e invierte las direcciones IP de origen y destino para retornar el paquete.
3. **Cálculo de Tiempos**
   El origen **mide el tiempo de ida y vuelta** (usando identificadores y secuencias) y despliega la latencia en la pantalla.

## Herramienta: `traceroute`

| Comandos | Mapeo de Ruta | Métricas |
|---|---|---|
| **Windows:** `tracert`<br>**Linux:** `traceroute` | Identifica el camino exacto que toman los paquetes IP hacia un destino.<br>**Se hace expirar el TTL** | Medición precisa de los retardos y tiempos de respuesta.<br>→ **Cada router intermedio** |

### Terminal – `tracert 200.40.112.85`

```
C:\>tracert 200.40.112.85

Traza a la dirección r200-40-112-85.static.adinet.com.uy [200.40.112.85]
sobre un máximo de 30 saltos:

  1   121 ms   124 ms   124 ms  aagu3as1-acc.antel.net.uy [200.40.19.214]
  2   124 ms   124 ms   124 ms  gaguada-2-acc.antel.net.uy [200.40.19.194]
  3   124 ms   124 ms   124 ms  giclassagu1-f1-0.antel.net.uy [200.40.0.132]
  4   124 ms   124 ms   124 ms  iclass30283.adinet.com.uy [200.40.67.183]
  5   124 ms   124 ms   140 ms  r200-40-112-85.static.adinet.com.uy [200.40.112.85]

  6     *        *        *     Tiempo de espera agotado para esta solicitud.
  7   ^C
C:\>
```

### Proceso de Mapeo – Descubrimiento de Ruta

```
TTL=1:  Host A ──► Router 1 (TTL expira)  ──► ICMP Time Exceeded ──► Host A
TTL=2:  Host A ──► Router 1 ──► Router 2 (TTL expira) ──► ICMP Time Exceeded ──► Host A
TTL=3:  Host A ──► Router 1 ──► Router 2 ──► Host B ──► ICMP Echo Reply ──► Host A
```

1. **Destino Conocido:** Siempre se realiza el "trace" hacia una dirección IP identificada y activa, como en este caso el Host B.
2. **Mensajes ICMP y Tiempos:** A partir de los mensajes de error de tiempo excedido (TTL), se identifican con precisión las direcciones IP de los routers intermedios y sus retardos.

## Investigue: `traceroute`

### Paso Práctico – Ejecución de Pruebas

1. **Conexión y Comando:** Conéctese a Internet y realice un **traceroute** al servidor Web **www.google.com**.
2. **Alternativas Gráficas:** Explore el uso de **herramientas gráficas** de "TraceRoute" para visualizar la ruta de manera interactiva.

### Análisis y Reflexión – Preguntas de Investigación

- **¿Cuántos saltos de router hay?** Identifique la cantidad exacta de intermediarios hasta llegar al servidor de Google.
- **¿Cuánto tiempo tarda en ir y volver?** Analice la latencia del viaje de la información. ¿Existe mucha demora o congestión?
- **¿Qué hay en el medio?** Intente imaginar y dimensionar **"todo"** el equipamiento físico e infraestructura que conecta ambos puntos.

---

# 03 – Dynamic Host Configuration Protocol (DHCP)

## Dos formas de asignar

### Asignación Estática

- Requiere intervención del administrador.
- Ciertos equipos requieren IPs de este tipo.
- No es escalable.

### Asignación Dinámica

- Deseable para ciertos dispositivos.
- "Plug and play", por parte del usuario.
- Permite re-uso de direcciones IP y asignación "on-demand".

## Protocolo DHCP

### Asignación de Parámetros

- **Configuración Dinámica:** Se puede asignar de forma automática la dirección IP a los dispositivos de la red, al mismo tiempo que otros parámetros esenciales de configuración.
- **Temporalidad:** La asignación de las direcciones IP no es permanente; puede ser temporal mediante un mecanismo de alquiler o "lease".

### Mensajería DHCP

- **Red local (LAN):** Los mensajes se basan en **broadcast** (difusión), lo que requiere obligatoriamente la presencia de un servidor DHCP activo en la misma red local.
- **Protocolo de Transporte:** La comunicación se realiza sobre **UDP**, utilizando específicamente el **puerto 67** para el servidor y el **puerto 68** para el cliente/host.

## Funcionamiento del protocolo

### 1. Solicitud del Host

El host cliente solicita de forma activa los parámetros de autoconfiguración necesarios al servidor DHCP en la red local.

Ejemplo: el host *Argon* (`00:a0:24:71:e4:44`) envía un **DHCP Request** a `255.255.255.255` (broadcast).

### 2. Asignación del Servidor

El servidor DHCP responde ofreciendo y asignando de forma dinámica los parámetros IP correspondientes al cliente.

Ejemplo de **DHCP Response**:

- IP address: `128.143.137.144`
- Default gateway: `128.143.137.1`
- Netmask: `255.255.0.0`

## Mensajes básicos de DHCP

### Secuencia de Mensajes – Intercambio de Red

Se activa la tarjeta de red de un host para iniciar la autoconfiguración:

1. El host hace **broadcast** de un mensaje **"DHCP discover"** \*
2. El servidor DHCP responde con un mensaje **"DHCP offer"** \*
3. El host pide dirección IP: mensaje **"DHCP request"**
4. El servidor DHCP envía la dirección: mensaje **"DHCP ack"**

*\* este mensaje es opcional*

### Diagrama de Intercambio

Comunicación de cuatro vías entre el cliente y el servidor:

| # | Mensaje | Dirección | Significado |
|---|---|---|---|
| 1 | DHCPDiscover | Cliente → Servidor | IP address request |
| 2 | DHCPOffer | Servidor → Cliente | IP address offer |
| 3 | DHCPRequest | Cliente → Servidor | IP address selection |
| 4 | DHCPAck | Servidor → Cliente | IP address acknowledgment |

## Mensajes DHCP (detalle)

**Servidor DHCP:** IP `223.1.2.5` — **Cliente DHCP:** (arribando)

| # | Mensaje | src | dest | yiaddr | tx ID | Lifetime |
|---|---|---|---|---|---|---|
| 1 | DHCP discover | `0.0.0.0, 68` | `255.255.255.255, 67` | `0.0.0.0` | 654 | — |
| 2 | DHCP offer | `223.1.2.5, 67` | `255.255.255.255, 68` | `223.1.2.4` | 654 | 3600 secs |
| 3 | DHCP request | `0.0.0.0, 68` | `255.255.255.255, 67` | `223.1.2.4` | 655 | 3600 secs |
| 4 | DHCP ACK | `223.1.2.5, 67` | `255.255.255.255, 68` | `223.1.2.4` | 655 | 3600 secs |

## Herramienta: clientes DHCP

### Windows

| Comando | Descripción |
|---|---|
| `ipconfig /all` | Muestra la dirección IP, la máscara asignada y la IP del servidor DHCP. |
| `ipconfig /release` | Libera la dirección IP actual. |
| `ipconfig /renew` | Renueva la dirección IP. |

### Linux

| Comando | Descripción |
|---|---|
| `ifconfig` | Muestra la dirección IP, la máscara asignada y la IP del servidor DHCP. |
| `dhclient` | Renueva la dirección IP. |
| `dhclient -r` | Realiza un release de la dirección IP. |

---

## Comentarios / Preguntas

---

# Key Points – Otros Protocolos

- **ARP (Address Resolution Protocol):** Para qué sirve y cómo funciona (básicamente qué mensajes se intercambian).
- **ICMP (Internet Control Message Protocol):** Cuál es su propósito, para qué sirve y cómo funciona un PING y TRACERT.
- **DHCP (Dynamic Host Configuration Protocol):** Formas de asignación (2) y funcionamiento básico del protocolo, flujo básico de mensajes.
