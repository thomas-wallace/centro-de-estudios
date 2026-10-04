# Modelo en Capas – Capa 3: Red · Enrutamiento

> **Flujo de datos:** Física → Enlace → **Red** → Transporte → Aplicación

---

## Enrutamiento – Temas

1. **Routers:** arquitectura y conmutación.
2. **Principios de enrutamiento:** protocolos y algoritmos.
3. **Comunicación fuera de la subred IP:** gateway por defecto, interfaz loopback (localhost).

---

# 01 – Routers

## Introducción: Dispositivos Router

- **Operación en capa de red:** Dispositivo que opera a nivel de la capa de red y **encamina** paquetes IP a su destino.
- **Conexión multi-red:** En cada interfaz tiene conectada una red IP diferente.
- **Requisito crítico:** También debe implementar la capa 1 y 2 en cada interfaz para asegurar la transmisión.

### Dispositivos de interconexión según la capa OSI

| Capa OSI | Dispositivo |
|---|---|
| Red | **Router** |
| Enlace de datos | Bridge |
| Física | Repetidor |

*(Las capas Aplicación, Presentación, Sesión y Transporte solo se implementan en los hosts extremos.)*

## Routers y dominios de broadcast

- **Separación de dominios:** A diferencia del switch, el router separa activamente los dominios de broadcast en la red.
- **Filtro por defecto:** No reenvía los paquetes de broadcast de capa 2 ni el tráfico multicast.
  - Dirección MAC destino = `ff:ff:ff:ff:ff:ff`

*Diagrama: hubs conectados por un switch forman un único dominio de broadcast; al interponer un router entre un switch y un hub, quedan dos dominios de broadcast separados.*

## Arquitectura de un Router

### Componentes

- Interfaces de red
- Matriz de conmutación
- CPU de propósito general (Routing Processor)
- Memorias

### Software

- Sistema operativo
- Archivos de configuración

### Arquitectura genérica de un enrutador

El plano de control decide las rutas; el plano de datos reenvía los paquetes.

```
PLANO DE DATOS · HARDWARE

INTERFACES DE ENTRADA (1…N)                                    INTERFACES DE SALIDA (1…N)
Line Termination → Data Link Processing → Lookup, Forwarding,   Queuing (Buffer   → Data Link Processing → Line Termination
                   (Protocol,             Queuing  ──► SWITCHING ──► Management)     (Protocol,
                    Decapsulation)                      FABRIC                        Encapsulation)
                                                           │
────────────────────────────────────────────────────────────┼─────────────────────────────────────
PLANO DE CONTROL · SOFTWARE                          Routing Processor
                                                     (calcula rutas y mantiene la tabla de forwarding)
```

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

### Tipos de conmutación

| | 1. Por Memoria | 2. Por Bus | 3. Por Red (Crossbar) |
|---|---|---|---|
| **Mecanismo** | El paquete se copia en la memoria y se redirige al puerto de salida. | El puerto de entrada transfiere el paquete directo al de salida por un bus compartido. | Red en malla de múltiples buses que conecta dinámicamente cualquier entrada con cualquier salida. |
| **Evolución / Ventaja** | Antes por CPU central; hoy por chips en tarjetas de línea (line cards). | La CPU principal no interviene en la transferencia de datos. | Permite conmutación en paralelo (múltiples paquetes cruzando al mismo tiempo). |
| **Limitación** | El ancho de banda de memoria limita la velocidad (rendimiento < B/2). | Solo pasa un paquete a la vez. Si el bus está ocupado, el paquete se bloquea. | — |

## Encaminar paquetes IP

### Criterio de decisión

Los routers deciden cuál es el próximo conmutador en base a dos elementos clave:

- **Dirección de destino del datagrama:** contenida en la cabecera de cada paquete IP que ingresa al router.
- **Tabla de conmutación (ruteo):** la base de datos interna utilizada para determinar el siguiente salto.

### Consulta de la tabla de ruteo (ejemplo)

1. El router **recibe el paquete** por `Eth_0` con IP de destino `192.168.3.65`.
2. **Consulta la tabla:**

| Red de destino | Máscara | Próximo salto | Interfaz |
|---|---|---|---|
| 10.1.5.0 | 255.255.255.0 | Directamente conectada | Eth_0 |
| 192.168.1.0 | 255.255.255.0 | Directamente conectada | Eth_1 |
| 192.168.2.0 | 255.255.255.0 | Directamente conectada | Eth_2 |
| **192.168.3.0** | **255.255.255.0** | **192.168.1.1** | **Eth_1** |
| 0.0.0.0 | 0.0.0.0 | 192.168.2.1 | Eth_2 |

3. **Reenvía por `Eth_1`.**

> `192.168.3.65` pertenece a `192.168.3.0/24` → próximo salto `192.168.1.1` → salida `Eth_1`. La IP de destino del paquete se mantiene.

## Tabla de ruteo

### Funcionamiento

- **Asociación única:** Es propia e independiente de cada router.
- **Propósito de ruteo:** Informa cómo encaminar los paquetes IP que le llegan al router.

### Búsquedas ("look-up")

- **Entrada:** Se ingresa utilizando la **IP de destino** del paquete.
- **Resultado:** Brinda la **IP del próximo salto** y/o el **nombre de la interfaz** de salida.

### Visualización de la tabla

| Tipo | Métrica | Red | Máscara | Próximo salto |
|---|---|---|---|---|
| Conectada | 0 | 10.1.5.0 | 255.255.255.0 | Eth_0 |
| Conectada | 0 | 192.168.1.0 | 255.255.255.0 | Eth_1 |
| Conectada | 0 | 192.168.2.0 | 255.255.255.0 | Eth_2 |
| RIP | 3 hops | 192.168.3.0 | 255.255.255.0 | 192.168.1.1 |
| OSPF | 1000 | 172.16.0.0 | 255.255.0.0 | 192.168.1.1 |
| Estática | 0 | 20.0.0.0 | 255.0.0.0 | 10.1.5.1 |
| Estática | 0 | 0.0.0.0 | 0.0.0.0 | 192.168.2.1 |

## Campos de la tabla de ruteo

### Tipos de entrada (columna TIPO)

- **Connected:** La red está **directamente conectada** a una interfaz del router.
- **Static:** Configurada por el administrador.
- **Dinámica:** Se indica el protocolo por el que fue aprendida:
  - **RIP:** aprendida mediante el protocolo de ruteo RIP.
  - **OSPF:** aprendida mediante el protocolo de ruteo OSPF.
- **Default:** Existe una ruta por defecto configurada por el administrador (estática) o aprendida por el protocolo de ruteo (dinámica).

### Campos de la tabla

- **Red y máscara:** Describen a la red de destino.
- **Interfaz de salida o próximo salto:** Determina el camino a seguir:
  - **Conexión directa:** Si la red de destino está directamente conectada, se especifica la interfaz física correspondiente.
  - **Próximo salto:** Si no es directa, se indica la IP del siguiente router. Si pertenece a una subred configurada, se deduce la interfaz.
  - **Búsqueda recursiva:** Si el próximo salto no está conectado directamente, se realiza un nuevo lookup para resolver la ruta al next-hop.

## Tabla de ruteo – Algoritmo de búsqueda

- **Organización en niveles:** La estructura se organiza de forma jerárquica para optimizar y acelerar el proceso de búsqueda de rutas en la tabla.
- **Longest Prefix Match:** Algoritmo clave que selecciona la ruta más específica disponible (la que posee la máscara de red más larga) que coincida con la dirección IP de destino.

### Estructura jerárquica

```
172.16.0.0/16 is subnetted, 2 subnets
C    172.16.2.0 is directly connected, Serial0/0/0
C    172.16.3.0 is directly connected, FastEthernet0/0
```

| Rutas de nivel 1 | Rutas de nivel 2 | Siguiente salto / interfaz de salida |
|---|---|---|
| Por defecto | — | Ruta/Interfaz (ruta final) |
| Superred | — | Ruta/Interfaz (ruta final) |
| Red | — | Ruta/Interfaz (ruta final) |
| Ruta primaria: Red `172.16.0.0` | Subred `172.16.2.0` | Serial0/0/0 |
| | Subred `172.16.3.0` | FastEthernet0/0 |

*Fuente del diagrama: © 2007 Cisco Systems, Inc.*

## Look-up en la tabla de ruteo

### 1. Operación lógica AND

Para determinar la coincidencia, se realiza una operación lógica bit a bit entre:

- **IP de destino:** la dirección IP del paquete que se desea rutar.
- **Máscara de red:** la máscara correspondiente a la entrada evaluada en la tabla.

### 2. Comparación y decisión

El resultado obtenido se compara directamente con la **dirección de red** de la entrada:

- **Si hay coincidencia:** El paquete se envía a la interfaz de salida correspondiente. Si es un próximo salto, se repite la búsqueda usando la IP del siguiente salto.
- **Si no hay coincidencia:** Se descarta la opción actual y se continúa con la siguiente entrada de la tabla.

### Ejemplo: paquete con destino `192.168.1.1`

**Tabla de ruteo IP:**

| Red de destino | Máscara | Próximo salto |
|---|---|---|
| 10.0.1.0 | 255.255.255.0 | 10.0.0.1 |
| 192.168.2.0 | 255.255.255.0 | 10.0.8.1 |
| 172.16.0.0 | 255.255.0.0 | 172.16.1.1 |
| 10.4.0.0 | 255.255.252.0 | 10.0.0.1 |
| **192.168.1.0** | **255.255.255.128** | **10.0.8.1** |

**Evaluación entrada por entrada:**

```
¿(192.168.1.1 AND 255.255.255.0)   = 10.0.1.0?    No → no enviar a 10.0.0.1
¿(192.168.1.1 AND 255.255.255.0)   = 192.168.2.0? No → no enviar a 10.0.8.1
¿(192.168.1.1 AND 255.255.0.0)     = 172.16.0.0?  No → no enviar a 172.16.1.1
¿(192.168.1.1 AND 255.255.252.0)   = 10.4.0.0?    No → no enviar a 10.0.0.1
¿(192.168.1.1 AND 255.255.255.128) = 192.168.1.0? SÍ → enviar a 10.0.8.1
```

> `192.168.1.1 AND 255.255.255.128 = 192.168.1.0` → coincide con `192.168.1.0/25` → enviar a `10.0.8.1`.

## Actualización de la Tabla de Ruteo

**¿Cuándo ocurre?** La actualización de la tabla se realiza, en general, en base a los cambios en la topología de la red.

### Ruteo estático

La configuración y el mantenimiento de las rutas se gestionan de forma totalmente manual.

- ✔ **Realizado manualmente por el administrador.**
- ✔ Ideal para redes pequeñas o topologías simples.

### Ruteo dinámico

Se habilitan protocolos inteligentes para que los routers actualicen la tabla de forma automática.

- **Intercambio periódico:** Los routers comparten información de alcanzabilidad IP constantemente.
- **Diversidad de protocolos:** Utiliza estándares de la industria como **RIP, OSPF, BGP**, entre otros.
- **Selección inteligente:** Solo se incorporan a la tabla las rutas con la **"mejor" métrica** disponible.

## Conmutación de paquetes IP

Cuando llega un paquete IP a una interfaz del router se inicia el proceso de conmutación:

1. **Inspección**
   - Se examina la **dirección IP de destino** del paquete entrante.
   - Se realiza la consulta (**look-up**) secuencial de las entradas en la tabla de ruteo.
2. **Si hay coincidencia**
   - Se **decrementa el TTL** (Time to Live) del paquete para evitar bucles infinitos.
   - Se **conmuta** el paquete enviándolo a la interfaz de salida indicada en la tabla.
3. **Si no hay coincidencia**
   - **Se descarta el paquete.**
   - Se genera y envía un paquete **ICMP de error** de vuelta hacia el host origen de la transmisión.

## Funciones del Router: Ruteo y Conmutación

```
                        ┌──────────────── ROUTER ────────────────┐
                        │  PLANO DE CONTROL                      │
Protocolos de ruteo ◄──►│      Funciones de ruteo                │◄──► Protocolos de ruteo
                        │            │ actualización de la tabla │
                        │            ▼                           │
                        │      Tabla de ruteo                    │
                        │            ▲ consulta de la tabla      │
                        │  PLANO DE DATOS                        │
Entrada de paquetes IP ─┼──►  Reenvío de paquetes IP  ───────────┼──► Salida de paquetes IP
                        └────────────────────────────────────────┘
```

> El ruteo determina las rutas; el reenvío utiliza la información de la tabla para enviar cada paquete.

El funcionamiento de un router se divide en dos planos funcionales clave para dirigir el tráfico:

### 1. Ruteo (plano de control)

Determina cuál es el camino óptimo que deben seguir los datos a través de la red.

- Ejecuta **protocolos de ruteo** (ej. OSPF, BGP) para comunicarse con otros dispositivos de red.
- Construye, actualiza y mantiene la **tabla de ruteo** basándose en la topología de la red.

### 2. Conmutación (plano de datos)

Transfiere físicamente los paquetes IP desde una interfaz de entrada a la interfaz de salida adecuada.

- Realiza búsquedas ultrarrápidas (**look-up**) de la dirección de destino en la tabla de ruteo.
- Procesa la cabecera IP de cada paquete (ej. decrementa el **TTL**) antes de enviarlo.

## Ejemplo: Encaminando un paquete IP

A nivel de capa de red, es una interconexión de redes IP unidas por routers.

**Topología:**

- Servidor `10.0.0.2` en la red `10.0.0.0/24`, conectada al Router A.
- Router A ↔ Router B por la red `10.0.1.0/24`.
- Router A ↔ Router C por la red `10.2.0.0/16`.
- Router B ↔ Router C por la red `10.0.2.0/24`.
- Cliente en la red `10.0.3.0/24`, conectada al Router C.
- El cliente envía un paquete IP con destino `10.0.0.2`.

### Ejemplo (cont.)

En base a la IP de destino se encamina el paquete IP al servidor. Recorrido: **Cliente → Router C → Router A → Servidor**.

| Destino | Router A | Router B | Router C |
|---|---|---|---|
| 10.0.0.0/24 | **direct** | Router A | **Router A** |
| 10.2.0.0/16 | direct | Router A | direct |
| 10.0.1.0/24 | direct | direct | Router A |
| 10.0.2.0/24 | Router C | direct | direct |
| 10.0.3.0/24 | Router C | Router C | direct |

*(En negrita, las entradas que se usan para encaminar este paquete.)*

---

# 02 – Principios de Enrutamiento

## Protocolos de ruteo

### Objetivo principal: encontrar el mejor camino

Determinar la ruta óptima que deben recorrer los paquetes de datos para llegar de manera eficiente a su destino.

Este proceso permite completar y actualizar de forma dinámica la **tabla de ruteo** de cada dispositivo.

*Ejemplo de red: entre el host origen y el host destino existen dos caminos posibles: Camino 1 (R1 → R2 → R5 → R6) y Camino 2 (R1 → R3 → R4 → R7 → R6).*

### Características

- **Intercambio:** Mecanismo para intercambiar información con otros routers sobre la alcanzabilidad a redes IP.
- **Adaptabilidad:** Reaccionan frente a cambios topológicos, modifican sus tablas e informan a los routers vecinos.
- **Optimización:** Utilizan algoritmos para calcular rutas óptimas, cargando únicamente el mejor camino en la tabla.
- **Autonomía:** Funcionan como procesos individuales que se ejecutan de forma independiente en cada dispositivo.

## Protocolos y Algoritmos de ruteo

| Tipo | Clasificación | Características / Protocolos |
|---|---|---|
| **Estáticos** | No adaptativos | Configuración fija; sin adaptabilidad automática. |
| **Vector Distancia** | Dinámicos | Algoritmo Distance Vector · **Protocolo RIP** |
| **Estado de Enlace** | Dinámicos | Algoritmos de estado de enlace · **Protocolos OSPF, IS-IS** |
| **Híbridos** | Dinámicos | Algoritmos híbridos · **EIGRP** |

## Enrutamiento Estático

**Concepto:** Consiste en introducir administrativamente rutas de forma fija en la tabla de ruteo de un dispositivo.

- **Ventajas:** No hay un proceso corriendo en el equipo, por lo que **no hay consumo de recursos** ni de ancho de banda para intercambio de información.
- **Desventajas:** Configuración "a mano", por lo tanto **no es escalable** para infraestructuras o redes de gran tamaño.
- **Caso de uso:** Ideal cuando existe un **único enlace** hacia un destino o se desea un control estricto sobre el camino a seguir.
- **Manejo de fallas:** Ante una falla, los paquetes **no llegarán**. El administrador debe reconfigurar manualmente la ruta si existe otra vía.

### Ejemplo: Enrutamiento Estático

```
Servidor 10.0.0.2 ── (10.0.0.0/24) ── Router A ── (10.0.1.0/24) ── Router B ── (10.0.2.0/24) ── Cliente 10.0.2.10
                                   10.0.1.1/24
```

El cliente envía un paquete IP con destino `10.0.0.2`. En el Router B se configura:

| Entrada | Red | Máscara | Próximo salto |
|---|---|---|---|
| Estática | 10.0.0.0 | 255.255.255.0 | 10.0.1.1 |

> Todos los paquetes IP dirigidos a la red `10.0.0.0/24` tienen como próximo salto la IP (router) `10.0.1.1`.

## Enrutamiento Dinámico

### Criterios de decisión

Determinan el camino más adecuado basándose en:

- La **cantidad de saltos** de routers para llegar al destino.
- La topología actual y el **ancho de banda** de cada enlace.

### Diferencias entre protocolos

Los protocolos difieren entre sí principalmente por:

- La **información** que utilizan para calcular las rutas.
- Los aspectos considerados dentro de su **métrica**.
- La forma de **intercambiar** los datos de ruteo.

### Manejo de fallas

Ante la interrupción del camino seleccionado originalmente:

- **Redundancia:** se modifica la decisión de forma automática.
- **Convergencia:** se pueden perder paquetes hasta estabilizar las tablas.

## Algoritmo Distance Vector

### Concepto central

Ningún nodo tiene conocimiento global de la topología de la red. En su lugar, cada nodo sabe a qué vecino enviar el paquete para alcanzar el destino **con la menor cantidad de saltos**.

**Topología de ejemplo:** R0 (router que calcula las rutas) conecta con R1 (`192.168.1.1`) y con R2 (`10.0.2.2`). La cadena R1 → R3 → R4 → R5 llega a la red `10.0.0.0/24` (5 saltos desde R0). R2 está conectado directamente a `172.16.0.0/16` (2 saltos desde R0).

**Tabla de R0:**

| Red de destino | Cantidad de saltos | Próximo salto (vecino) |
|---|---|---|
| 10.0.0.0/24 | 5 | 192.168.1.1 |
| 172.16.0.0/16 | 2 | 10.0.2.2 |

**Tablas del resto de los routers:**

| Router | Destino | Saltos | Próximo salto |
|---|---|---|---|
| R1 | 10.0.0.0/24 | 4 | R3 |
| R1 | 172.16.0.0/16 | 3 | R0 |
| R2 | 10.0.0.0/24 | 6 | R0 |
| R2 | 172.16.0.0/16 | 1 | Directa |
| R3 | 10.0.0.0/24 | 3 | R4 |
| R3 | 172.16.0.0/16 | 4 | R1 |
| R4 | 10.0.0.0/24 | 2 | R5 |
| R4 | 172.16.0.0/16 | 5 | R3 |
| R5 | 10.0.0.0/24 | 1 | Directa |
| R5 | 172.16.0.0/16 | 6 | R4 |

### Funcionamiento

1. **Recepción y comparación:** Periódicamente, cada nodo recibe actualizaciones de sus vecinos con redes y distancias. Las **compara** con las propias y, si el costo es **menor**, las incorpora a su tabla de ruteo.
2. **Incremento y envío:** El nodo toma todas las entradas registradas en su tabla de ruteo, les añade un salto para actualizar la métrica y las **envía** activamente a través de sus interfaces.

**Tabla de ruteo del nodo v:**

| Destino | Vía (next hop) | Costo |
|---|---|---|
| Net₁ | m | D(v, Net₁) |
| Net₂ | n | D(v, Net₂) |
| … | … | … |
| Net_N | w | D(v, Net_N) |

## Protocolo RIPv2 (RFC 2453)

### Características

- **Vector distancia:** Utiliza este algoritmo base para determinar las mejores rutas hacia el destino.
- **Soporte classless:** Envía de forma nativa la máscara de subred junto con la información de actualización.

### Métrica de ruteo

- **Métrica fija:** Basada exclusivamente en la cantidad de saltos de routers (hops).
- **Límite de 15 saltos:** Define un límite máximo estricto; cualquier destino a 16 o más saltos se declara inalcanzable.

### Updates y tiempos

- **Updates periódicos:** Se envían cada 30 segundos y contienen la tabla de ruteo completa.
- **Dirección multicast:** IP de destino `224.0.0.9` y puerto UDP 520.
- **Inalcanzable (180 s):** Se declara una red inalcanzable si no se reciben actualizaciones durante este período.

## Ejemplo: Funcionamiento de RIP

**Topología:** `1.0.0.0` — (e0) Router A (s0) — `12.0.0.0` — (s0) Router B (e0) — `2.0.0.0`

**Tabla de ruteo construida a partir de los updates periódicos:**

| Router A | | | Router B | | |
|---|---|---|---|---|---|
| **NET** | **Hops** | **IF** | **NET** | **Hops** | **IF** |
| 1.0.0.0 | direct | e0 | 2.0.0.0 | direct | e0 |
| 12.0.0.0 | direct | s0 | 12.0.0.0 | direct | s0 |
| 2.0.0.0 | 1 | s0 | 1.0.0.0 | 1 | s0 |

**Update enviado por A (DA=\*, SA=A) → hacia B:**

| NET | Hops |
|---|---|
| 1.0.0.0 | 1 |
| 12.0.0.0 | 1 |
| 2.0.0.0 | 2 |

**Update enviado por B (DA=\*, SA=B) → hacia A:**

| NET | Hops |
|---|---|
| 2.0.0.0 | 1 |
| 12.0.0.0 | 1 |
| 1.0.0.0 | 2 |

**Updates de enrutamiento:**

- **Frecuencia:** cada 30 segundos.
- **Destino:** dirección multicast `224.0.0.9`.
- **Contenido:** información de redes y saltos.

## Algoritmo Estado de Enlace

1. **Detección de vecinos:** Cada router descubre los vecinos directamente conectados mediante mensajes **Hello**, verificando la conectividad y formando una relación de adyacencia.
2. **Generación de LSA:** Crea un **Link-State Advertisement** que incluye:
   - ID del router
   - Enlaces directos y costo asociado
   - Estado del enlace
3. **Distribución:** Los routers envían sus LSAs a todos los demás de la red mediante un proceso de inundación conocido como **flooding**.
4. **Cálculo de ruta:** Cada router construye su base de datos de estado de enlace y calcula la ruta más corta mediante el **Algoritmo de Dijkstra**.
5. **Mantenimiento:** Si un enlace cambia de estado, el router afectado genera un nuevo LSA y repite el proceso de flooding de inmediato.

---

# 03 – Comunicación fuera de la Subred IP

## Comunicación fuera de la subred IP y ARP

Cuando un equipo debe enviar un paquete IP a un destino, realiza un **"look-up" en su tabla de ruteo**. Según el resultado, procede de la siguiente manera:

1. **Red directa:** La red de destino está **directamente conectada**. El equipo realiza una solicitud de ARP directamente al host de destino.
2. **Próximo salto:** Existe un **próximo salto** en la tabla de ruteo. Se hace un ARP a este router intermediario. El próximo salto **siempre** está en la misma subred (aplica también para la ruta por defecto).
3. **Sin registro:** El destino **no se encuentra** en la tabla de ruteo. El equipo descarta de forma inmediata el paquete IP al no tener una ruta válida.

> **¡Este funcionamiento se aplica de igual manera tanto a un PC como a un router!**

## Problema: ¡No me responde el ping!

**Escenario:** PC 1 quiere realizar un "ping" al PC 2 y no "sale" el "echo request".

| Equipo | IP | MAC |
|---|---|---|
| PC 1 | 192.168.1.2 | MAC_1 |
| Router – Eth 0 | 192.168.1.1 | MAC_11 |
| Router – Eth 1 | 192.168.2.1 | MAC_21 |
| PC 2 | 192.168.2.2 | MAC_2 |

> **¿Qué está fallando?**

## Solución: Gateway por defecto

**Faltaba definir una ruta por defecto en el PC.**

A partir de la configuración de la ruta, el equipo agrega una ruta por defecto en su tabla de ruteo en la que el próximo salto es el GW.

**Tabla de ruteo del PC 1** (con GW `192.168.1.1`):

| Red | Máscara | Próximo salto |
|---|---|---|
| 192.168.1.0 | 255.255.255.0 | Interfaz Ethernet |
| **0.0.0.0** | **0.0.0.0** | **192.168.1.1** |

✅ **Estado actual:** ruta por defecto configurada con éxito.

## Configuración de Gateway (GW) por defecto

| Tipo | Red | Máscara | Siguiente |
|---|---|---|---|
| Default | 0.0.0.0 | 0.0.0.0 | X |

### Reglas clave de operación

**1. Siempre hay coincidencia**

```
(cualquier IP de destino) AND 0.0.0.0 = 0.0.0.0
```

Al aplicar la máscara `0.0.0.0`, cualquier dirección IP de destino va a coincidir con esta ruta por defecto. Por seguridad y jerarquía, se ubica siempre **al final de la tabla**.

La idea es que todo lo que el equipo no "conoce" se lo envía a un GW (próximo salto).

**2. Requisito de direccionamiento**

El gateway por defecto debe pertenecer obligatoriamente a la **misma subred IP** que la interfaz del propio equipo para poder comunicarse de forma directa.

## Interfaz de loopback

### Concepto y características

- **Interfaz virtual:** Es una interfaz de red lógica y virtualizada que reside por completo dentro del propio equipo de manera interna.
- **Alta disponibilidad:** No depende de hardware físico ni de cables, por lo que **"siempre está disponible"**.
- **Entorno de pruebas:** Se utiliza principalmente para probar y diagnosticar servicios de red localmente sin tráfico externo.
- **Localhost:** Está asociada de manera predeterminada y universal al nombre de host **"localhost"**.

### Direccionamiento IP: `127.0.0.1`

- **Dirección estándar:** La gran mayoría de los sistemas operativos configuran y apuntan directamente a la IP **`127.0.0.1`**.
- **Rango reservado:** Se reserva oficialmente todo el segmento **`127.0.0.1` – `127.255.255.255`** de forma exclusiva para esta función.

## PC como dispositivo de capa 3

### PC en capa 3

Un PC es técnicamente un dispositivo de capa 3, similar a un router, pero de forma predeterminada no encamina tráfico IP entre sus interfaces de red.

**Tabla de ruteo local:** por lo menos tiene una entrada por cada red que tiene "directamente" conectada.

### Conversión a router

El comportamiento por defecto del sistema operativo puede ser modificado para habilitar el reenvío de paquetes entre distintas interfaces físicas o virtuales.

**Software de enrutamiento:** un PC con un software adecuado se puede convertir y configurar como un router activo.

## Herramienta: `route`

### Comandos en Windows

Manipula la tabla de enrutamiento del PC directamente desde la línea de comandos:

| Comando | Descripción |
|---|---|
| `route PRINT` | Despliega la tabla de ruteo del PC. |
| `route ADD` | Agrega una nueva entrada de ruteo. |
| `route DELETE` | Borra una entrada existente. |

**Ejemplos de consola:**

```bat
:: Agregar ruta
route add 157.0.0.0 mask 255.0.0.0 157.55.80.1

:: Eliminar ruta
route delete 157.0.0.0
```

### Comandos en Linux

Manipula de forma directa la tabla de enrutamiento local del sistema operativo:

| Comando | Descripción |
|---|---|
| `route` | Despliega toda la tabla de ruteo actual del PC. |
| `route add default gw IP_del_GW` | Agrega una nueva ruta o gateway por defecto. |
| `route del` | Borra una entrada específica de la tabla. |

**Ejemplo de consola:**

```bash
# Establecer gateway por defecto
route add default gw 192.168.1.1
```

## Investigue: Tabla de ruteo del PC

Dado que su PC es un dispositivo de capa 3, tiene una tabla de ruteo. Conectado a la red inalámbrica de la facultad, despliegue el contenido de la tabla de ruteo de su PC, interprete los resultados y responda las siguientes consignas:

1. **Entradas de ruteo:** ¿A qué corresponden todas las entradas? Identifique cada fila desplegada, analizando los destinos de red, máscaras y métricas asociadas.
2. **Interfaces de red:** ¿Cómo se identifican las interfaces de red de su PC? Examine las direcciones IP e identificadores asignados a las interfaces activas (Wi-Fi / Ethernet).
3. **Gateway por defecto:** ¿Existe un gateway por defecto? ¿Cuál es? Ubique la ruta predeterminada (`0.0.0.0`) y determine la IP de la puerta de enlace hacia la red.

## Comunicación fuera de la subred IP y ARP (resumen)

**Paso 1 – Consulta de ruteo:** Cuando un equipo debe enviar un paquete IP a un cierto destino, realiza un **"look-up"** en su tabla de ruteo.

- **Escenario A – Red de destino directamente conectada:** Al confirmarse que la red de destino está conectada directamente, el equipo procede a realizar un **pedido de ARP directamente al equipo destino**.
- **Opción A – Destino / próximo salto en la tabla:** El equipo genera una solicitud ARP dirigida a la dirección IP del próximo salto.
  - *Nota:* el próximo salto siempre está en la misma subred (esto también aplica para la ruta por defecto).
- **Opción B – Sin ruta hacia el destino:** Si la dirección de destino no coincide con ninguna entrada de la tabla ni existe una ruta por defecto, el paquete se descarta de inmediato.

> **Regla general:** ¡Este funcionamiento se aplica exactamente igual tanto a un PC como a un router!

## ¿Cómo encamina un paquete IP un PC?

El PC toma la dirección IP de destino y sigue este flujo:

```
¿Es la mía? ──SÍ──► Paquete llegó al destino
   │ NO
   ▼
¿Está en mi subred? ──SÍ──► Enviar paquete a la LAN
   │ NO
   ▼
¿Gateway por defecto configurado? ──SÍ──► Enviar paquete al gateway por defecto
   │ NO
   ▼
Destino inalcanzable y descartar paquete
```

## Volviendo al problema inicial, paso a paso… "el ping"

**Un ping entre dos redes** (ARP + Ethernet + IP + ICMP)

- LAN 1 · `192.168.1.0/24`: PC 1 (`192.168.1.2/24`, MAC_1) y router (`192.168.1.1`, MAC_11).
- LAN 2 · `192.168.2.0/24`: router (`192.168.2.1`, MAC_21) y PC 2 (`192.168.2.2/24`, MAC_2).
- *Supuesto: máscaras /24 y cachés ARP inicialmente vacías. Sin NAT.*

| Paso | Descripción | Detalle |
|---|---|---|
| **01 – Inicio de comunicación** | PC 1 ejecuta `ping 192.168.2.2`. Al aplicar su máscara /24, comprueba que PC 2 **no está en su red**, por lo que debe enviar el paquete a su **gateway** (`192.168.1.1`). Primero debe conocer la MAC del gateway para enviarle la trama. | Red de PC 1: `192.168.1.0/24` · Destino final: `192.168.2.2` · Gateway: `192.168.1.1` |
| **02 – Solicitud ARP (PC 1)** | PC 1 revisa su tabla ARP y no encuentra la IP `192.168.1.1`, por lo que emite un pedido de ARP. | MAC origen = MAC_1 · MAC destino = broadcast · *"¿Quién tiene 192.168.1.1?"* |
| **03 – Respuesta ARP del router** | **El router responde el ARP** haciendo un unicast directo hacia el PC 1. | MAC origen = MAC_11 · MAC destino = MAC_1 · *"Tengo la 192.168.1.1 y mi MAC es MAC_11"* |
| **04 – Envío del ping (ICMP)** | El PC 1 envía el paquete ICMP hacia el router. | MAC orig = MAC_1 · MAC dest = MAC_11 · IP orig = 192.168.1.2 · IP dest = 192.168.2.2 · Protocolo = ICMP |
| **05 – Ruteo y ARP a PC 2** | El router recibe el ICMP para `192.168.2.2`. Por su tabla de ruteo, sabe que la red está directamente conectada. Realiza un **pedido ARP** para obtener la MAC del PC 2. | — |
| **06 – Reenvío final a PC 2** | Obtenida la respuesta, reenvía el paquete ICMP directamente hacia el PC 2. | MAC orig = MAC_21 · MAC dest = MAC_2 · IP orig = 192.168.1.2 · IP dest = 192.168.2.2 · Protocolo = ICMP |

> Observar que las **direcciones IP** de origen y destino se mantienen de punta a punta, mientras que las **direcciones MAC** cambian en cada salto.

---

## Ejercicio: Gateway por defecto

**Hoja de datos específica:**

- Switch gestionable con soporte de VLANs.
- 8 conectores RJ-45 para 10Base-T.

**Configuración:**

- Puertos 1 y 2 asociados a VLAN = 100.
- Puertos 3 y 4 asociados a VLAN = 200.

**Topología:**

| Puerto del switch | Conectado a |
|---|---|
| 1 | Router (interfaz E0) |
| 2 | PC_3 |
| 3 | PC_4 |
| 4 | PC_2 |

La interfaz E1 del router se conecta a PC_1.

**Consignas:**

- Asigne una dirección IP válida y una MAC referencial a todo dispositivo de la red que lo requiera.
- Complete las siguientes tablas para un ping desde PC_2 a PC_1, para un paquete capturado en la interfaz E0 del router y en la E1.

**Captura en E0:**

| IP origen | IP destino | MAC origen | MAC destino |
|---|---|---|---|
| | | | |

**Captura en E1:**

| IP origen | IP destino | MAC origen | MAC destino |
|---|---|---|---|
| | | | |

---

## Comentarios / Preguntas

---

# Key Points – Enrutamiento

- **Routers:** cómo se encaminan los paquetes. Tabla de ruteo: campos, look-up y actualización de la tabla. Cómo se conmutan los paquetes.
- **Principios de enrutamiento:** protocolos y algoritmos, qué son y para qué sirven. Diferencias, ventajas y desventajas del enrutamiento estático vs. dinámico; para este último, funcionamiento básico del algoritmo DV y del protocolo RIP.
- **Comunicación fuera de la subred IP:** gateway por defecto, para qué sirve y cómo se configura. Qué es la interfaz de loopback y para qué sirve.
