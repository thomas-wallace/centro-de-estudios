# Modelo en Capas – Capa 2: Enlace – Dispositivos de Capa 2 (Switches)

> **Flujo de datos:** Física → **Enlace** → Red → Transporte → Aplicación

---

## Dispositivos de Capa 2

1. **Conmutación Ethernet**
2. Dispositivo 01: Hub
3. Dispositivo 02: Switch
   - Utilización, arquitectura, aprendizaje de MACs, conmutación, colisiones, ejemplo de uso
4. Dispositivo 03: Bridge
5. Key Points

---

# 01 – Conmutación Ethernet

- **Conmutar en capa de enlace (capa 2).**
- Mover un frame Ethernet desde un puerto de origen al o los puertos de destino.

## Dispositivos de Conmutación

| Dispositivo 01 | Dispositivo 02 | Dispositivo 03 |
|---|---|---|
| **Hub** | **Switch** | **Bridge** |

---

# 02 – Dispositivo 01: Hub

1. **Capa Física:** Opera exclusivamente a nivel de la capa física del modelo OSI.
2. **Difusión de Señal:** Recibe un frame en un puerto, amplifica la señal, y lo envía por todos sus puertos de manera activa.
3. **Dispositivo Plug & Play:** Funciona de manera inmediata al conectarse, sin necesidad de configuraciones previas.

## Desventajas de los Hubs

- **Colisión de Frames:** Los frames enviados por los dispositivos potencialmente pueden colisionar al compartir el mismo medio físico.
- **Dominio de Colisión Único:** Existe un único dominio de colisión, lo que limita la cantidad máxima de dispositivos que se pueden conectar.
- **Difusión Ineficiente:** Envía de forma redundante todos los frames recibidos a todos los dispositivos de la red por igual.
- **Sin Buffer de Memoria:** No poseen almacenamiento temporal, impidiendo conectar segmentos de red con diferentes velocidades.

---

# 03 – Dispositivo 02: Switch

## Dispositivos de Conmutación

| Dispositivo 01 | Dispositivo 02 | Dispositivo 03 |
|---|---|---|
| Hub | **Switch** | Bridge |

## Utilización de switches en redes

- **Optimización de Red:** Optimiza el uso de la red mediante la transmisión eficiente de "known" unicast.
- **Redes Escalables:** Permite estructurar y armar redes Ethernet altamente escalables y ordenadas.
- **Velocidades Flexibles:** Capacidad para conectar de forma segura segmentos de red con distintas velocidades.

*Visualización de conexiones mediante switch:* un switch central conectado en estrella con cuatro PCs.

## Dispositivo Switch

**Capa de Operación:** Dispositivo de red que opera de forma activa a nivel de capa 2.

### Funciones principales

- **Aprender direcciones MAC:** Construye y mantiene una tabla dinámica de direcciones MAC para conocer la ubicación de cada equipo.
- **Conmutar frames de forma inteligente:**
  - **A todos los puertos:** Flood en caso de Broadcast o direcciones desconocidas.
  - **Sólo a un puerto:** Envío directo cuando la MAC destino ya es conocida.
- **Evitar Loops:** Implementa el protocolo **STP (Spanning Tree Protocol)** para asegurar caminos libres de bucles redundantes.

*Vista del dispositivo físico.*

## Switch – Arquitectura

### Componentes

- **Interfaces o puertos, buffers:** Puntos de entrada y salida de datos.
- **Matriz de conmutación:** Interconexión interna del switch.
- **CPU y Memorias:** Gestión de tablas de direcciones (RAM, Flash, ROM).

### Software

- **Sistema operativo:** Administra las funciones del switch.
- **Archivos de configuración:** Parámetros del dispositivo.

### Matriz de Conmutación e Interfaces

```
        Buffers de entrada      Matriz de conmutación      Buffers de salida
Frame 1 ──► [Buffer] ──► (1) ─┐                          ┌─ (4) ──► [Buffer]
                              ├──── interconexión ───────┤─ (5) ──► [Buffer] ──► Frame 1
Frame 2 ──► [Buffer] ──► (2) ─┤        interna          ├─ (6) ──► [Buffer] ──► Frame 2
                         (3) ─┘                          └
```

*(Esquema simplificado: los frames 1 y 2 entran por puertos distintos y la matriz los conecta simultáneamente con sus puertos de salida.)*

## Aprender direcciones MAC

1. **Inspección de Origen:** Cuando llega un frame a una interfaz, éste es guardado en un buffer. Se inspecciona la **dirección MAC de origen** para registrarla.
2. **Registro en Tabla:** Esa dirección MAC identificada se asocia al puerto correspondiente. Esta información se agrega a una tabla dinámica conocida como **"Tabla de MACs"**.
3. **Aprendizaje Activo:** Al encender el switch, la tabla de direcciones está **completamente vacía**. Se va llenando dinámicamente a medida que el dispositivo procesa y conmuta frames.

### Tabla Dinámica

Si los hosts no registran actividad durante cierto tiempo, las entradas correspondientes en la tabla van **expirando** de forma automática para mantener la red optimizada.

*Ejemplo gráfico:* dos hubs conectados a un switch (puertos 1 y 2). MAC 1, MAC 5 y MAC 4 se aprenden en el puerto 1; MAC 2 y MAC 3 (en el hub del puerto 2) se aprenden en el puerto 2.

| MAC | Puerto |
|---|---|
| 1 | 1 |
| 4 | 2 |
| 5 | 1 |

## Campos de la Tabla de MACs

| Campo | Descripción |
|---|---|
| **DIRECCIÓN** | Dirección MAC del dispositivo de origen de los paquetes recibidos. |
| **PUERTO** | Puerto o interfaz física por la que el switch se conecta a dicho dispositivo. |
| **TIEMPO** | Tiempo de envejecimiento (*aging time*) que determina la vigencia de la entrada. |
| **VLAN** | Segmentación virtual (VLAN) asignada al puerto en switches que la soportan. |

### Ejemplo práctico de registro

| Address | Interface | Time |
|---|---|---|
| 62-FE-F7-11-89-A3 | 1 | 9:32 |
| 7C-BA-B2-B4-91-10 | 3 | 9:36 |
| … | … | … |

**¿Cómo se lee?** El switch asocia la dirección física (*Address*) del host con el puerto de conexión (*Interface*). El temporizador (*Time*) evita que el registro quede activo indefinidamente.

## Conmutación Ethernet

### Criterio principal: Dirección MAC de destino (DA)

Es el campo fundamental que el switch inspecciona para decidir el puerto de reenvío del frame.

### Direcciones especiales (solo en DA)

- **Broadcast (`ff-ff-ff-ff-ff-ff`):** Indica que el frame debe ser distribuido a todos los hosts del segmento de red.
- **Multicast:** Dirigido a un grupo seleccionado de dispositivos suscritos a una dirección de multicast.

### Estructura del Frame Ethernet

```
| Start Delimiter | DA | SA | T | Network Data | FCS | End Delimiter |
                    ^^
```

**Detalle de la cabecera:** El campo **DA** (*Destination Address*) se posiciona al inicio de la trama para permitir una rápida inspección y conmutación.

## Conmutación Ethernet – Inspección de trama

### Dirección MAC de destino

Al frame guardado en el buffer, además, se le inspecciona la dirección MAC de destino para determinar su ruta y el puerto de reenvío correcto.

### Criterio de conmutación: Tabla de MACs

Se compara con cada entrada de la tabla de MACs y se actúa de la siguiente manera según el estado de la dirección:

- **Descarte:** Si el puerto coincide con el de origen.
- **Flooding:** Si la dirección es desconocida o especial.
- **Conmutación:** Si la dirección ya es conocida se conmuta al puerto indicado en la tabla.

Modo de operación: **Store and forward**.

## Conmutación Ethernet – Pseudocódigo

```
if destination is on LAN(port) on which frame was received:
then drop the frame
else {
    lookup on MAC table
    if entry found for destination:
    then forward the frame on interface indicated
    else:
    then flood /* forward on all but the interface on which the frame arrived */
}
```

## Funcionamiento del switch

Animación paso a paso (**Paso 1: envío de trama**): PC-A transmite una trama Ethernet hacia PC-C. La trama contiene la MAC origen (AA:AA) y la MAC destino (CC:CC). Topología: un switch central conectado a PC-A, PC-B, PC-C y PC-D, con su **Tabla de Direcciones MAC** (columnas Puerto / Dirección MAC) que se va completando.

## Switches y las colisiones

### Dominios de Colisión Individuales

Cada puerto del switch representa un **dominio de colisión independiente**, a diferencia del Hub que tiene un único dominio para todos sus puertos.

- **Comunicaciones simultáneas:** Posibilitadas gracias a la gran capacidad de buffering del switch.
- **Protocolo CSMA/CD:** Se debe implementar únicamente si el puerto de salida está configurado en **Half Duplex** al enviar un frame.

### Funcionamiento libre de colisiones (Recomendado)

Es posible lograr un entorno de red de alto rendimiento y totalmente libre de colisiones bajo la configuración adecuada.

- **Configuración Full-Duplex:** El puerto del switch y el host conectado deben estar configurados en modo Full-Duplex para deshabilitar la detección de colisiones.

## Ejemplo: ¿Dónde usar Switches? – Red LAN de una empresa

### Topología de la red

- **Switches de acceso:** Un switch por piso para concentrar todas las PCs locales.
- **Switch "Core":** Centraliza y conecta la infraestructura de los diferentes pisos.

### Dominio de Broadcast

Toda la red local de la empresa comparte un único dominio de broadcast, facilitando la localización de dispositivos pero requiriendo un diseño eficiente para mitigar el tráfico innecesario.

*Diagrama:* switches de acceso (por piso) con PCs, portátiles e impresoras, conectados a switches agregados, un router hacia la WAN y servidores.

---

# 04 – Dispositivo 03: Bridge

## Dispositivos de Conmutación

| Dispositivo 01 | Dispositivo 02 | Dispositivo 03 |
|---|---|---|
| Hub | Switch | **Bridge** |

## Bridge o puente

### Definición

Dispositivo de capa 2 con pocos puertos y que puede conmutar entre **medios distintos**.

### Características

- Deben adaptar el encabezado de capa 2.
- Mismo funcionamiento que el switch.
- Ejemplos: **Bridge inalámbrico WiFi** y **Bridge ADSL**.

---

# 05 – Cierre

## Comentarios / Preguntas

## Key Points – Switches

**Dispositivos de conmutación vistos (3):**

- Diferencia de funcionamiento entre ellos.
- Ventajas, desventajas y caso de uso de cada uno.

**Switch:**

- Concepto de conmutación.
- Aprendizaje y Tabla MAC.
- Funcionamiento de la conmutación Ethernet.
