# Modelo en Capas – Capa 2: Enlace

> **Flujo de datos:** Física → **Enlace** → Red → Transporte → Aplicación

---

## La capa de Enlace – VLAN y Topologías Redundantes

Protocolo Ethernet · VLAN · Topologías redundantes

### Virtual LAN (VLAN) – Estándar IEEE 802.1Q

Permite la creación de redes lógicas independientes dentro de una misma infraestructura física.

- Segmentación y seguridad de tráfico.
- Reducción de dominios de broadcast.
- Optimización del ancho de banda.

### Topologías Redundantes – Alta disponibilidad y tolerancia a fallos

Mecanismos para asegurar la continuidad de la red ante fallos de enlaces o dispositivos:

| Mecanismo | Descripción |
|---|---|
| **STP** | Spanning Tree Protocol |
| **LACP** | Agregación de enlaces |
| **Stack** | Stacking físico / lógico |

### Otros protocolos de la capa de Enlace

1. **Virtual LAN**
2. **Spanning Tree Protocol**
3. **LACP**
4. **Stacking**

---

# 01 – Virtual LAN (VLAN)

## VLANs: Motivación

| Motivo | Descripción |
|---|---|
| **Seguridad** | Mejora la seguridad de la red separando el tráfico de distintos segmentos de forma lógica. |
| **Broadcast** | Limita los dominios de broadcast, evitando la propagación de tráfico innecesario en la red. |
| **Rendimiento** | Permite una óptima y más eficiente utilización de todo el ancho de banda disponible. |
| **Flexibilidad** | Facilita la re-localización física de dispositivos sin necesidad de reconfigurar la topología. |

## ¿Qué es una VLAN?

### Segmentación y control

Permite dividir una infraestructura física en múltiples redes lógicas independientes.

### Dominios de broadcast

- **LAN sin VLAN:** Un único dominio de broadcast. El tráfico se difunde a todos los dispositivos de la red.
- **LAN con VLAN:** Segmentación en múltiples dominios de broadcast. El tráfico se aísla de forma lógica.

*(La diapositiva incluye un diagrama de comparación de redes con y sin VLAN.)*

## Implementar VLANs

### Separar segmentos

Métodos para segmentar la red LAN:

- **Física:** Implementar infraestructuras totalmente separadas.
- **Lógica:** Habilitar VLANs en los switches existentes (-$, es decir, menor costo).

### Switches "VLAN-aware"

**Requisito de equipamiento:** los switches activos de la red deben tener la capacidad de ser "VLAN-aware". Esto les permite procesar, clasificar y reenviar correctamente las tramas según la VLAN a la que pertenecen.

### Estándar IEEE 802.1q

**Protocolo de etiquetado:** para identificar el tráfico se utiliza un sistema de etiquetado (*tag*). El protocolo estándar global para este propósito es el **IEEE 802.1q**, que añade un identificador a la trama Ethernet.

## Switch con soporte de VLANs

Un switch real con soporte de VLANs se comporta como varios **switches virtuales** independientes.

```
            Switch Real
┌───────────────────────────────┐
│  Switch Virtual   Switch Virtual │
│    (VLAN A)         (VLAN B)     │
└───────────────────────────────┘
```

## Funcionamiento con soporte de VLANs de un switch

- **Broadcast o Multicast:** se realiza *flooding* por todos los puertos que pertenecen a la misma VLAN que la del puerto de entrada.
- **Unicast:** el frame es conmutado sólo si el puerto indicado en la Tabla de MACs pertenece a la misma VLAN.

> **¿Qué pasa cuando el destino está en otro switch?**

## Funcionamiento de una red con VLANs

```
 PC 5                                              PC 2
   \                                                /
  [Switch] ══ Enlace de "trunk" 802.1q ══ [Switch] ─ PC 3
   /           Tráfico tageado                      \
 PC 1                                              PC 4

 PC → switch: tráfico Ethernet (sin tag)
 Entre switches: tráfico tageado (802.1q)
```

> Por lo general, las tarjetas de red de los PCs **no soportan VLANs**, por lo que los puertos de los PCs se dice que están en modo **"acceso"**.

## Configuración del soporte de VLANs

1. **Entidad lógica:** debe crearse la entidad lógica con un VLAN ID configurado entre el rango de 1 y 4095.
2. **Asociación:** se asocian los puertos físicos del switch a la VLAN correspondiente. Ejemplo: VLAN 3 → Puertos (3, 6 y 7).
3. **Enlaces Trunk:** los puertos que comunican con otros switches reciben y transmiten los frames ya identificados con la etiqueta de su respectiva VLAN.
4. **Reglas MAC:** es posible definir reglas basadas en la MAC de origen para clasificar y direccionar el tráfico (alternativa poco utilizada).

## IEEE 802.1q

1. **Frames etiquetados:** permite el tráfico de frames "tageados o etiquetados" con información de a qué VLAN pertenecen.
2. **Protocolo Ethernet:** una conexión 802.1q utiliza el Tipo Ethernet **0x8100** como identificador de protocolo para preparar el frame para la etiqueta.
3. **Campos del Tag:** agrega un encabezado de **4 bytes** con campos específicos:
   - 3 bits de prioridad (PCP)
   - 1 bit DEI (Discard Eligibility)
   - 12 bits para el VLAN ID (4096 VLANs)

## Anatomía del Frame 802.1q

```
 6 bytes  6 bytes  4 bytes  2 bytes   46-1500          4 bytes
┌────────┬────────┬────────┬───────┬────────────────┬────────┐
│   DA   │   SA   │ 802.1q │   T   │ Payload (L3)   │  FCS   │
└────────┴────────┴────────┴───────┴────────────────┴────────┘
                      │
          ┌───────────┴───────────┐
          16 bits   3 bits  1 bit   12 bits
        ┌────────┬───────┬──────┬────────┐
        │  TPID  │  PCP  │ DEI  │  VID   │
        │ 0x8100 │       │      │        │
        └────────┴───────┴──────┴────────┘
```

### Campos del Tag 802.1q

| Campo | Significado | Tamaño / función |
|---|---|---|
| **TPID** | Tag Protocol ID | `0x8100` para indicar trama etiquetada |
| **PCP** | Priority Code Point | 3 bits para calidad de servicio (CoS) |
| **DEI** | Discard Eligibility Indicator | 1 bit para elegibilidad de descarte |
| **VID** | VLAN ID | 12 bits que identifican de forma única la VLAN (hasta 4096) |

Captura de Wireshark incluida en la diapositiva:

```
Ethernet II, Src: Private_66:68:04 (00:50:79:66:68:04), Dst: Private_66:68:00 (00:50:79:66:68:00)
  Type: 802.1Q Virtual LAN (0x8100)
802.1Q Virtual LAN, PRI: 0, DEI: 0, ID: 100
  000. .... .... .... = Priority: Best Effort (default) (0)
  ...0 .... .... .... = DEI: Ineligible
  .... 0000 0110 0100 = ID: 100
  Type: IPv4 (0x0800)
Internet Protocol Version 4, Src: 10.0.0.5, Dst: 10.0.0.1
```

## Ejemplo: Red con 2 VLANs

```
        VLAN 100 ───   VLAN 200 ───

   ┌─────────────────┐   TRUNK (IEEE 802.1q)   ┌─────────────────┐
   │ Cisco 2950      │═════════════════════════│ Cisco 2950      │
   │ Switch          │  (transporta VLAN 100   │ Switch          │
   └─┬──┬──┬──┬──┬──┬┘   y VLAN 200 tageadas)  └┬──┬──┬──┬──┬──┬─┘
     │  │  │  │  │  │                          │  │  │  │  │  │
    PCs de VLAN 100 y VLAN 200   (Ethernet, sin tag)   PCs de VLAN 100 y 200
```

- Entre switch y PCs: **Ethernet** (puertos de acceso).
- Entre switches: **IEEE 802.1q** (enlace trunk).

## Ejercicio de VLANs

Red con dos switches (**IOU1** e **IOU2**) conectados entre sí por **e1/1** (IOU1) y **e0/0** (IOU2):

```
 PC7  PC5                         PC4
   \  /e0/1                        |e0/3
   IOU2 ──e0/0────e1/1── IOU1 ─────┤──── PC3
   /  \                           e0/2
 PC8  PC6                    e0/1 / \
 (e0/3, e1/0, e0/2 en IOU2)     PC1  PC2
```

Asignación de VLANs:

| VLAN | Nombre | PCs |
|---|---|---|
| 100 | Informática | PC1, PC2, PC5 |
| 101 | Ingeniería | PC3, PC6, PC7 |
| 102 | Audiovisual | PC4, PC8 |

Preguntas:

- ¿Cuántos dominios de broadcast existen en la red?
- Complete la tabla de MACs cuando todos los PCs generan un broadcast de capa 2.
- ¿Qué tipo de configuración tienen las interfaces e1/1 y e0/0?

Tablas a completar (una por switch, IOU1 e IOU2):

| MAC | VLAN | Puerto |
|---|---|---|
| | | |
| | | |
| | | |
| | | |

## Resumen: VLAN y Topologías Redundantes

### Virtual LAN (VLAN)

Permite la segmentación lógica de una red física en múltiples redes de difusión independientes, mejorando significativamente la seguridad, la administración del tráfico y el rendimiento global sin necesidad de cambios en la infraestructura física.

### Topologías Redundantes

Mecanismos clave para garantizar la alta disponibilidad y evitar puntos únicos de fallo en la red:

- **Spanning Tree Protocol (STP):** evita la formación de bucles lógicos en la topología desactivando rutas redundantes de forma dinámica.
- **Agregación de Enlaces (LACP):** agrupa múltiples conexiones físicas en un único enlace lógico para incrementar el ancho de banda y aportar tolerancia a fallos.
- **Stacking:** permite conectar y gestionar múltiples switches como si fueran una sola unidad lógica centralizada.

---

# 02 – Spanning Tree Protocol (STP)

## Funcionamiento de una LAN

```
MAC 5 ─(1)─┐                         ┌─(1)─ MAC 2
           [Switch izq.]─(3)────(4)─[Switch der.]─(2)─ MAC 3
MAC 1 ─(2)─┘                         └─(3)─ MAC 4
```

| Switch izquierdo | | Switch derecho | |
|---|---|---|---|
| **MAC** | **Puerto** | **MAC** | **Puerto** |
| 1 | 2 | 1 | 4 |
| 4 | 3 | 4 | 3 |
| 5 | 1 | 5 | 4 |

## Topologías Redundantes: beneficios y costos

- ✔ **Disponibilidad asegurada:** son necesarias para garantizar la alta disponibilidad de la red de forma constante.
- ✔ **Enlaces de respaldo:** si existen varios enlaces, en el caso que uno falle, otro enlace puede seguir soportando el tráfico.
- ⚠ **Incremento de costos:** aumentan los costos de hardware, cableado y administración de la red.

### El desafío crítico: Loops de Capa 2

El principal riesgo de la redundancia física: sin un protocolo de control, las topologías redundantes causan tormentas de broadcast e inestabilidad en las tablas de direcciones MAC.

> Requiere la implementación de **STP (Spanning Tree Protocol)** para su mitigación.

## Loops de Capa 2

Broadcast: `ff:ff:ff:ff:ff:ff`

- **Aparecen "Broadcast storms":** las solicitudes de broadcast se propagan sin fin, inundando todos los puertos y consumiendo el ancho de banda disponible.
- **Frames repetidos e inestabilidad de tabla MAC:** los switches reciben copias duplicadas de los mismos frames, provocando que la tabla de direcciones MAC cambie constantemente.
- **Aumenta el tráfico y se satura la red:** el procesamiento de los switches se ve superado por el volumen de tráfico descontrolado, colapsando la red por completo.

## Spanning Tree Protocol 802.1D

### Gestión dinámica de enlaces de red

STP se ejecuta de manera inteligente en los switches para optimizar la topología lógica de la red de forma constante:

- **Trayectoria única activa:** permite solamente un camino activo a la vez entre dos switches, previniendo eficazmente bucles de red (loops).
- **Redundancia en reserva:** mantiene los caminos redundantes en estado de bloqueo temporal como respaldo pasivo.
- **Conmutación por error:** activa automáticamente los enlaces de reserva en caso de que la trayectoria principal sufra una falla.

### Conceptos clave de la topología

- **Root Switch (Puente Raíz):** el nodo central elegido como punto de referencia para toda la red.
- **Prioridad:** valor numérico configurable que determina la elección del Root Switch.
- **Root Port (Puerto Raíz):** el puerto en cada switch no-raíz con el camino de menor costo hacia el Root Switch.
- **Designated Bridge / Port:** switch y puerto encargados de reenviar el tráfico en un segmento de red específico.
- **Forwarding & Blocked:** estados de los puertos: reenvío activo de datos frente a bloqueo preventivo para evitar bucles.

### Estado de los puertos

| Estado | Descripción |
|---|---|
| **Blocking** | No reenvía tramas, escucha BPDUs |
| **Listening** | Escucha BPDUs para determinar la topología de red |
| **Learning** | Aprende direcciones MAC para poblar su tabla de switches |
| **Forwarding** | Estado activo de envío y recepción de tramas de datos |
| **Disabled** | No participa en el proceso STP (apagado o falla administrativa) |

## Spanning Tree Protocol 802.1D – Topología y parámetros

### Topología de red (STP)

```
                  SwitchA
            Priority: 100
            MAC: 0000.1111.2222
          Designated   Designated
         /  1 Gbps, Cost=4   \  1 Gbps, Cost=4
   Root Port                    Root Port
   SwitchB                      SwitchC
   Priority: 32.768             Priority: 32.768
   MAC: 0000.2222.3333          MAC: 0000.6666.7777
   Designated                   Designated
     | 1 Gbps, Cost=4             | 1 Gbps, Cost=4
   Root Port                    Root Port
   SwitchD ─────── 1 Gbps, Cost=4 ──────X─── SwitchE
   Priority: 100   Designated        Blocked  Priority: 32.768
   MAC: 0000.4444.5555                        MAC: 0000.8888.9999
```

### Componentes y parámetros

Conceptos clave: Root Switch, Prioridad, Root Port, Designated Bridge, Forwarding / Blocked.

**Formato de Bridge ID (8 bytes):**

```
┌───────────────────┬──────────────────────────────┐
│  Bridge Priority  │         MAC Address          │
│     (2 bytes)     │          (6 bytes)           │
└───────────────────┴──────────────────────────────┘
              Bridge ID – 8 bytes
```

## Spanning Tree Protocol (per VLAN)

> ⚠ **Se bloquea el forwarding para evitar loops**

Salida de `show spanning-tree vlan 101` en IOU2 (la interfaz **Et0/0** queda en estado `BLK`):

```
IOU2#show spanning-tree vlan 101

VLAN0101
  Spanning tree enabled protocol ieee
  Root ID    Priority    32869
             Address     aabb.cc00.0300
             Cost        100
             Port        6 (Ethernet1/1)
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32869  (priority 32768 sys-id-ext 101)
             Address     aabb.cc00.0400
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface      Role Sts Cost      Prio.Nbr Type
-------------- ---- --- --------- -------- ----
Et0/0          Altn BLK 100       128.1    Shr
Et0/2          Desg FWD 100       128.3    Shr
Et0/3          Desg FWD 100       128.4    Shr
Et1/1          Root FWD 100       128.6    Shr
```

Captura de una BPDU (STP por VLAN):

```
Frame 19: 68 bytes on wire (544 bits), 68 bytes captured (544 bits) on interface -, id 0
Ethernet II, Src: aa:bb:cc:00:03:11 (aa:bb:cc:00:03:11), Dst: PVST+ (01:00:0c:cc:cc:cd)
802.1Q Virtual LAN, PRI: 0, DEI: 0, ID: 101
Logical-Link Control
Spanning Tree Protocol
  Protocol Identifier: Spanning Tree Protocol (0x0000)
  Protocol Version Identifier: Spanning Tree (0)
  BPDU Type: Configuration (0x00)
  BPDU flags: 0x00
  Root Identifier: 32768 / 101 / aa:bb:cc:00:03:00
  Root Path Cost: 0
  Bridge Identifier: 32768 / 101 / aa:bb:cc:00:03:00
  Port identifier: 0x8006
  Message Age: 0
  Max Age: 20
  Hello Time: 2
  Forward Delay: 15
  Originating VLAN (PVID): 101
```

El diagrama de la diapositiva es la misma red del ejercicio de VLANs (IOU1 e IOU2, PC1 a PC8) y señala la interfaz **e0/0** de IOU2 como el puerto bloqueado.

---

# 03 – LACP (Agregación de Enlaces)

## Agregación de Enlaces (Link Aggregation)

- **Optimización de ancho de banda:** mejorar el ancho de banda en una red de datos de forma rápida y con un costo mínimo.
- **Tolerancia a fallos:** conseguir alta disponibilidad y tolerancia a fallos ante la caída o degradación de un enlace.
- **Ejemplo práctico:** al tener un switch Ethernet de 1 Gbps y requerir más ancho de banda, es posible agrupar varias tarjetas de red físicas para conectar con el switch y obtener un enlace virtual unificado.

## Agregación de Enlaces (Bonding)

### Características principales

- Se realiza a nivel de **capa 2**, siendo completamente transparente para el Sistema Operativo.
- El protocolo **LACP (IEEE 802.3ad)** gestiona eficientemente los enlaces físicos que forman el bonding.

### Definición de enlace

**Bond / Teaming:** enlace virtual compuesto por la unión de 2 o más puertos físicos.

### Nomenclatura por fabricante

| Fabricante | Nombre |
|---|---|
| **CISCO** | PortChannel |
| **HP** | Link Aggregation |
| **Mikrotik** | Bonding |

## Agregación de Enlaces – ¿Qué se necesita?

- **Grupo de interfaces:** un grupo de interfaces físicas que forman parte del mismo «equipo» para trabajar de manera coordinada.
- **Protocolo de control:** un protocolo que decida de forma inteligente y dinámica por qué interfaz física enviar cada paquete.

## Agregación de Enlaces – ¿Cómo funciona?

> ⚠ **Atención con STP:** sin LACP y con enlaces en paralelo entre los switches, el STP podría bloquear todos los enlaces excepto uno.

Requisitos básicos para que funcione:

1. **Modo Full-Duplex:** todos los enlaces que formen parte del Link Aggregation deben ser siempre Full-Duplex.
2. **Velocidad idéntica:** la velocidad negociada de sincronización debe ser exactamente la misma en todos los enlaces (si un enlace negocia a 1 Gbps, todos deben ser 1 Gbps).
3. **Consistencia de VLANs:** en un switch gestionable, la configuración de VLANs en los enlaces debe ser idéntica en todos los extremos.

## Agregación de Enlaces – Otras ventajas

### 1. Tolerancia a fallos

Si uno de los enlaces falla, el enlace que sigue activo funcionará sin problemas. De esta forma, se evita la pérdida de conectividad y se garantiza el funcionamiento continuo de la red cableada.

### 2. Balanceo de carga

Distribuye el tráfico de manera inteligente entre todos los enlaces físicos disponibles para optimizar el ancho de banda total. Según la implementación, los algoritmos de distribución pueden basarse en:

- Dirección MAC (origen / destino)
- Dirección IP (origen / destino)
- Puertos de Capa 4 (TCP / UDP)

---

# 04 – Stacking

## Stacking

### Concepto de Stacking

Consiste en agrupar diversos switches de manera que de cara a la red aparenten ser un solo dispositivo lógico y centralizado.

### Conexión y puertos

Los switches disponen en algunos casos de puertos específicos, o se configuran puertos en agregación para enlazar las unidades entre sí.

### Topología física vs. lógica

*(La diapositiva ilustra con diagramas la topología física de varios switches apilados y su topología lógica como un único switch.)*

## Stacking: conceptos básicos y material de apoyo audiovisual

### Recurso de aprendizaje

Visualice este video introductorio para comprender de manera práctica los fundamentos del apilamiento de switches, la agregación de enlaces y la gestión unificada.

**Información de reproducción:** el audio se encuentra en inglés básico, sin embargo, puede activar los subtítulos traducidos automáticamente al español en el reproductor.

## Stacking: principales beneficios de la tecnología de apilamiento

| Beneficio | Descripción |
|---|---|
| **Escalabilidad** | Permite escalar la cantidad de switches de acuerdo a las necesidades de la red, agregando más puertos de forma sencilla sin necesidad de cambiar el switch principal. |
| **Gestión unificada** | Simplifica la administración de toda la pila de switches. Permite conectarse de manera exclusiva al equipo master para gestionar la totalidad de los puertos de forma centralizada. |
| **Redundancia** | Garantiza alta disponibilidad en las comunicaciones. Al contar con un equipo master, múltiples esclavos y diversos enlaces, se asegura la tolerancia ante fallos físicos de switches o enlaces. |

## Ejemplo de escenario real de aplicación

### Integración y despliegue práctico de la infraestructura de red

**Configuración clave:**

- **Tecnología Stacking**
  - **SW 1:** Master de la pila
  - **SW 2:** Backup redundante
- **Segmentación VLAN**
  - **VLAN 10:** Servidores Web
  - **VLAN 11:** Servidor de Correo
  - **VLAN 12:** Servidores de BBDD
- **Seguridad perimetral:** Firewall que separa la red externa de la infraestructura interna mediante enlaces agregados (LACP/Bond 0).

```
   Outside ── [Firewall]
               Outside | Inside
               eth0, eth1
                 │ │   bond 0 – mode 4 – 802.3ad LACP
                 ▼ ▼
        TRUNK vlans 10, 11, 12
        ┌────────────────────┐
        │ SW 1 (Master)      │  Stack
        │ SW 2 (Backup)      │
        └──┬─────────┬────┬──┘
      vlan 10    vlan 11   vlan 12
           │         │       │
    Servidores    Servidores  Servidores
        Web         Correo      BBDD
```

---

## Comentarios / Preguntas
