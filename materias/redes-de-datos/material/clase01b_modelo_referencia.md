# Modelo de Referencia

> Modelo de referencia · Modelo en Capas · Modelo híbrido

---

## Índice

1. **¿Por qué un modelo en Capas?**
2. **Modelo OSI** (origen, evolución de las redes y principios de desarrollo)
3. **Modelo híbrido** (comparación con OSI y descripción de las 5 capas)
4. **Protocolo, pila y arquitectura de red**
5. **Servicios y primitivas** (genéricas, TCP y Sockets)
6. **Service Access Point (SAP) y tipos de servicio**
7. **Comunicación entre capas y analogía con el sistema postal**
8. **Encapsulamiento y PDUs**
9. **Ejemplos de protocolos por capa**
10. **Key Points**

---

# 01 – ¿Por qué un modelo en Capas?

## Ventajas del modelo en capas

1. **Reducir complejidad:** Permite dividir un problema complejo en bloques constructivos (capas) más sencillos y fáciles de manejar.
2. **Arquitectura estándar:** Facilita la definición de un estándar común que simplifica la interacción y compatibilidad entre sistemas.
3. **Evolución independiente:** Cada capa puede evolucionar y optimizarse de forma autónoma, siempre que mantenga los mismos servicios.

---

# 02 – Modelo OSI

## Open Systems Interconnection

Creado en 1980 y publicado como estándar en 1984 por la ISO (Organización Internacional de Estandarización).

*Fuente: https://platzi.com/clases/2225-redes/35587-modelo-osi/*

## Evolución de las Redes

| Año | Hito | Descripción |
|---|---|---|
| Años 1960 | **Era del Caos Propietario** | Cada fabricante vende hardware cerrado. Los sistemas hacen todo el proceso (Capa 1 a 7). Conectar marcas distintas requiere costosos "Gateways" traductores. |
| 1969 | **Nacimiento de ARPANET** | Financiada por EE.UU. (ARPA). Introduce los nodos IMP (minicomputadoras intermedias) para obligar a Mainframes incompatibles a hablar un lenguaje común (NCP). |
| 1971 | **ALOHAnet (Hawái)** | Primera red inalámbrica de paquetes (ondas UHF) financiada por ARPA. Demuestra que se puede compartir un medio físico de forma aleatoria (nacen colisiones). |
| 1973 | **Crisis de NCP e Interconexión** | Se ensambla ALOHAnet con ARPANET vía satélite. El protocolo NCP colapsa ante el ruido de la radio. Se inicia el diseño de un protocolo universal. |
| 1978 | **Nace la versión 4 de TCP/IP** | Se divide el protocolo monolítico en dos: IP (Capa 3 / Enrutamiento) y TCP (Capa 4 / Confiable). Se añade UDP para transmisiones de voz en tiempo real sin retransmisión. |
| 1983 | **El "Flag Day" de Internet** | El 1 de enero, ARPANET apaga obligatoriamente NCP. Toda la red adopta TCP/IP. Nace oficialmente la Internet moderna operando sobre 4 capas prácticas. |
| 1984 | **Lanzamiento del Modelo OSI (ISO)** | Se publica el modelo teórico de 7 capas. Al no participar fabricantes de chips en los comités, se ven obligados a separar estrictamente la Capa 1 (Física) de la Capa 2 (Enlace) para aislar la falta de hardware unificado. |

## Modelo OSI: Principios de desarrollo

1. **Nivel de abstracción diferente:** Se debe crear una capa donde se requiera un nivel de abstracción diferente.
2. **Función estandarizable:** Cada capa debe realizar una función bien definida que pueda ser estandarizada.
3. **Regla de los bordes:** Los límites deben definirse donde la experiencia histórica haya demostrado que el manejo de los datos cambia drásticamente.
4. **Minimizar flujo de información:** Es necesario elegir los límites de las capas de modo que se minimice el flujo de información entre ellas.
5. **Cantidad óptima de capas:** La cantidad de capas debe ser suficiente para no tener que agrupar funciones distintas en la misma capa y lo suficientemente chica para que la arquitectura no se vuelva inmanejable.

---

# 03 – Modelo híbrido

## Modelos de Referencia: Híbrido vs OSI

| Modelo OSI | Modelo Híbrido |
|---|---|
| Capa 7: Aplicación | **Aplicación** (equivale a las Capas 5, 6 y 7 de OSI) |
| Capa 6: Presentación | ↑ |
| Capa 5: Sesión | ↑ |
| Capa 4: Transporte | **Transporte** |
| Capa 3: Red | **Red** |
| Capa 2: Enlace de datos | **Enlace de datos** |
| Capa 1: Física | **Física** |

## Modelo híbrido de 5 capas

```
CAPA 5   Aplicación
CAPA 4   Transporte
CAPA 3   Red
CAPA 2   Enlace de Datos
CAPA 1   Física
```

El modelo híbrido es la arquitectura de referencia práctica más utilizada en el estudio de redes informáticas.

- **Síntesis eficaz:** Combina la flexibilidad de la capa de aplicación del modelo TCP/IP con la clara división física y de enlace del modelo OSI.
- **Propósito didáctico:** Permite comprender el camino de los datos desde el software del usuario final hasta el cableado o medio inalámbrico.
- **Estándar de la industria:** Sirve como base para analizar el flujo real de unidades de datos (PDUs) y protocolos actuales.

## Capas – Modelo de referencia

| Capa | Función |
|---|---|
| 5 – Aplicación | Soporte a las aplicaciones. |
| 4 – Transporte | Conexiones de extremo a extremo. |
| 3 – Red | Ruteo de información hasta el destino. |
| 2 – Enlace | Comunicación entre equipos adyacentes y acceso al medio. |
| 1 – Física | "Pone" los bits en los medios físicos. |

---

# 04 – Protocolo, pila y arquitectura

## Protocolo

- Es un acuerdo formal entre las partes para poder llevar adelante la comunicación de manera ordenada.
- Define el **formato de los mensajes**, el **orden de intercambio** y las **acciones a tomar** ante cada mensaje.
- Para lograr comunicarse con éxito, las entidades deben "hablar" obligatoriamente el mismo protocolo.

## Pila y Arquitectura

### Pila de protocolos

La lista de los protocolos utilizados por las capas se denomina **pila de protocolos**.

### Arquitectura de red

Al conjunto de capas y protocolos se le llama **arquitectura de red**. La especificación de ésta debe ser precisa de manera que se pueda desarrollar software o hardware para una capa cumpliendo el protocolo correspondiente.

---

# 05 – Servicios y primitivas

## Servicios

Las entidades que se comunican y hablan un determinado protocolo, utilizan para esta comunicación los **servicios** de las capas inferiores.

### Primitivas de servicio

Se denominan **primitivas de servicio** al conjunto de operaciones que los procesos de una determinada capa disponen para comunicarse con la entidad par.

## Primitivas

*Modelo de comunicación genérico frente a una implementación real (TCP)*

| Primitivas genéricas | Caso de uso: TCP (primitivas en la capa de transporte) |
|---|---|
| **REQUEST:** Solicita que se realice un servicio o se inicie una conexión. | **LISTEN:** Bloqueado en espera pasiva de conexión. |
| **INDICATION:** Notifica a la entidad receptora que se ha solicitado una acción. | **CONNECT:** Establece la conexión (inicia REQUEST). |
| **RESPONSE:** Permite a la entidad receptora responder a la notificación. | **RECEIVE:** Bloqueado en espera de datos entrantes. |
| **CONFIRM:** Notifica al iniciador que la respuesta ha sido recibida y procesada. | **SEND:** Envía datos a la entidad par. |
| | **DISCONNECT:** Termina y libera la conexión establecida. |

## Mapeo de Primitivas a Sockets

*Relación entre el flujo de primitivas genéricas y la implementación en Python (Berkeley Sockets)*

| Flujo teórico genérico | Implementación en Python |
|---|---|
| **1. REQUEST:** El cliente solicita el inicio del servicio o de la conexión. | `socket.connect((host, port))` – Inicia la solicitud activa de conexión hacia el servidor. |
| **2. INDICATION:** Se notifica a la entidad receptora que hay una acción solicitada. | `conn, addr = socket.accept()` – El servidor bloqueado detecta y acepta la conexión entrante. |
| **3. RESPONSE:** La entidad receptora responde a la petición iniciada. | `conn.sendall(data)` / `conn.recv()` – Intercambio de datos donde el servidor responde al requerimiento. |
| **4. CONFIRM:** Se notifica al iniciador que la respuesta fue procesada. | `socket.recv(1024)` – El cliente recibe la confirmación y procesa los datos de retorno. |

## Flujo de Conexión en un Chat

| Fase de la comunicación | Primitiva genérica (Teoría) | Código en Python real (Práctica) |
|---|---|---|
| **01 – El Servidor abre la app** | Espera pasiva de conexiones en la Capa de Transporte. | `servidor.listen(5)`<br>`conexion, ip = servidor.accept()` |
| **02 – El Cliente se conecta** | REQUEST (SYN) → INDICATION → RESPONSE (SYN-ACK) → CONFIRM (ACK) | `cliente.connect(('127.0.0.1', 9000))`<br>*(Ejecuta las 4 primitivas en milisegundos)* |
| **03 – Envío del mensaje** | Transferencia activa de datos de la Capa de Aplicación sobre el canal seguro. | `cliente.send(b"Hola!")`<br>`mensaje = conexion.recv(1024)` |
| **04 – Cierre de conexión** | Liberación de recursos y destrucción del canal de comunicación. | `cliente.close()`<br>`conexion.close()` |

---

# 06 – SAP y tipos de servicio

## Service Access Point (SAP)

### Concepto de SAP

- Es el punto de acceso donde una entidad de una capa superior puede solicitar y obtener un determinado servicio.
- Por ejemplo, los SAP de la capa de Transporte permiten distinguir y direccionar diferentes aplicaciones o procesos activos dentro de un mismo equipo físico (por ejemplo: www, ftp, mail, etc.).

```
   Entidad capa N+1  ◄──── Protocolo capa N+1 ────►  Entidad capa N+1
   (Service user)                                    (Service user)
         │                                                 │
        SAP                                               SAP
         │                                                 │
   Entidad capa N    ◄──── Protocolo capa N ──────►  Entidad capa N
   (Service provider)                                (Service provider)
```

## Tipo de servicios – Conexión

| Orientado a conexión | No orientado a conexión |
|---|---|
| Paradigma: red de telefonía tradicional | Paradigma: servicio postal de correo |
| Establecimiento de conexión (handshake) | |
| Liberación de conexión | |

## Tipo de servicios – Confiable

| Confiable | No confiable |
|---|---|
| Confirmación y retransmisión de cada PDU (Protocol Data Unit) | Sin confirmación ni retransmisión |
| Control de flujo | Simplemente entrega de mensajes |
| Control de congestión | |

---

# 07 – Comunicación entre capas

## Modelo en Capas

Cada capa se puede comunicar con:

- **Entidad par:** Utilizando un protocolo en común para la comunicación horizontal.
- **Entidad adyacente:** Estableciendo relaciones verticales mediante el intercambio de servicios.

## Analogía con Sistema Postal

| Capa | Rol | Función |
|---|---|---|
| Capa 4 | Destinatario / Remitente | Origen y destino final de la comunicación (extremo a extremo) |
| Capa 3 | Funcionario de Correos | Atención al cliente, recepción y entrega local |
| Capa 2 | Oficina de Correos | Procesamiento, clasificación y direccionamiento de paquetes |
| Capa 1 | Transporte Aeropuerto | Logística de traslado hacia los canales principales de distribución |
| Medio de Transmisión | Avión | Enlace físico que conecta ambos extremos del sistema de comunicación |

Flujo: **ENVÍO** → ¡Modelo en Capas! → **RECEPCIÓN**

## Motivación: a day in the life of a web request

Ver animación "modelo_animación.ppt". Disponible en Webasignatura en Carpeta "Unidad_1_-_Introduccion_a_las_Redes".

---

# 08 – Encapsulamiento y PDUs

## Protocol Data Unit

### Concepto clave

La unidad de datos que se intercambia entre capas pares se denomina **Protocol Data Unit (PDU)**.

### Ciclo de transmisión

1. **Encapsulado (Origen):** La PDU de cada capa se aloja dentro de la capa inferior y añade un encabezado (Header) con control de protocolo.
2. **Desencapsulado (Destino):** El extremo receptor realiza el proceso inverso: procesa el encabezado de cada capa y entrega el contenido limpio a la capa superior.

## Encapsulamiento

```
   Host origen                                      Host destino
 ┌──────────────┐                                ┌──────────────┐
 │  L5 data | H5│   5                        5   │  L5 data | H5│
 │  L4 data | H4│   4                        4   │  L4 data | H4│
 │  L3 data | H3│   3                        3   │  L3 data | H3│
 │T2|L2 data|H2 │   2                        2   │T2|L2 data|H2 │
 │  0101010...  │   1  ──► Medio de ──►      1   │  0101010...  │
 └──────────────┘         transmisión            └──────────────┘
```

- En cada capa se agrega un encabezado (H5, H4, H3, H2); la capa 2 agrega además un terminador (T2).
- La capa 1 transmite la secuencia de bits por el medio de transmisión; el receptor realiza el proceso inverso.

## Analogía con Sistema Postal

| Elemento postal | Equivalente |
|---|---|
| Carta | Información / Datos |
| Sobre | Encabezado del protocolo de envío de correo |
| Caja | Encabezado del protocolo entre oficinas de correo |

Carta → Sobre → Caja → Caja → Sobre → Carta: **¡¡¡ Encapsulación !!!**

## Flujo de datos y nombre de PDUs

```
 Host A              Dispositivo intermedio             Host B
Aplicación  ◄──────── protocolos: mensajes ──────────►  Aplicación
Transporte  ◄──────── segmentos ─────────────────────►  Transporte
Red         ◄──►  Red  ◄── paquetes ──►  Red  ◄──►      Red
Enlace      ◄──►  Enlace ◄── tramas ──►  Enlace ◄──►    Enlace
Física      ◄──►  Física ◄─ bits y bytes ─► Física ◄──► Física
                    (medios físicos)
```

| Capa | PDU |
|---|---|
| Aplicación | Mensajes |
| Transporte | Segmentos |
| Red | Paquetes |
| Enlace | Tramas |
| Física | Bits y bytes |

---

# 09 – Ejemplos de protocolos por capa

| Capa | Protocolos |
|---|---|
| **CAPA 5 – Aplicación** | FTP, HTTP, SMTP, DNS (sobre TCP); DNS, TFTP (sobre UDP) |
| **CAPA 4 – Transporte** | TCP, UDP |
| **CAPA 3 – Red** | IP |
| **CAPA 2 – Enlace** | Ethernet |

```
   FTP   HTTP   SMTP   DNS        DNS   TFTP
     \     |      |     /           \     /
          TCP                        UDP
            \                        /
                       IP
                       |
                   ETHERNET
```

## Volviendo…

```
 Host A         Bridge          Router          Host B
 ┌───┐         ┌───┐           ┌───┐           ┌───┐
 │ 5 │         │   │           │   │           │ 5 │
 │ 4 │         │   │           │   │           │ 4 │
 │ 3 │         │   │           │ 3 │           │ 3 │
 │ 2 │         │ 2 │           │ 2 │           │ 2 │
 │ 1 │─────────│ 1 │───────────│ 1 │───────────│ 1 │
 └───┘         └───┘           └───┘           └───┘
```

| Host | Bridge | Router | Host |
|---|---|---|---|
| **PC Cliente** – Navegador web | **Switch** – Capa 2 | **Router** – Capa 3 | **Servidor** – Servidor web |

---

# 10 – Comentarios y Key Points

## Comentarios

Preguntas.

## Key Points – Modelo de Referencia

**Conceptos:**

- Modelo de Capas.
- Protocolo, Primitiva, Servicios (confiable, no confiable), PDU.
- Encapsulación.
- Modelo de Referencia Híbrido.
