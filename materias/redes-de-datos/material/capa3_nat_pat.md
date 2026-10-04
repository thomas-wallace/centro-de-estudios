# Modelo en Capas – Capa 3: Red

> **Flujo de datos:** Física → Enlace → **Red** → Transporte → Aplicación

---

## La capa de Red – Network Address Translation

1. **Protocolo NAT**
2. NAT básico
3. Port Address Translation (PAT)

---

# 01 – Protocolo NAT

## Retomando el problema de la escasez de direcciones IP…

### El contexto histórico: agotamiento crítico

Todas las clases A y varias clases B se asignaron con gran rapidez en los inicios de Internet dentro de los EEUU.

Como consecuencia inmediata, las direcciones IPv4 globales comenzaron a escasear de manera acelerada.

### Solución 01: Subnetting y CIDR

Sistemas de ruteo sin clases de direcciones, permitiendo una subdivisión y asignación mucho más eficiente del espacio.

### Solución 02 (clave): NAT (Network Address Translation)

Permite la reutilización masiva de rangos de direcciones privadas mapeándolas dinámicamente a IP públicas.

## Direcciones IP privadas

El estándar **RFC 1918** reserva los siguientes bloques de direcciones para uso exclusivo en redes privadas:

| Clase | Bloque | Máscara por defecto | Rango de IPs |
|---|---|---|---|
| A (sufijo `/8`) | `10.0.0.0` | 8 bits | `10.0.0.0` – `10.255.255.255` |
| B (sufijo `/16`) | `172.16.0.0` | 16 bits | `172.16.0.0` – `172.31.255.255` |
| C (sufijo `/24`) | `192.168.0.0` | 24 bits | `192.168.0.0` – `192.168.255.255` |

### Dirección de Enlace Local (RFC 3927)

**`169.254.0.0` – `169.254.255.255`**

Bloque reservado para direccionamiento dinámico de enlace local (IPv4 Link Local Address).

### Flexibilidad de diseño: asignación arbitraria

La asignación de las direcciones privadas es totalmente arbitraria dentro de la red local.

## Protocolo NAT

- **Conectividad híbrida:** Permite comunicar hosts internos de una red privada con hosts públicos o incluso en otras redes privadas.
- **Ejecutado por routers:** El protocolo es ejecutado por routers que conectan y gestionan el tráfico entre redes públicas y privadas.

### Ejemplo de topología

```
   RED PÚBLICA                                RED PRIVADA (subred /24)
┌────────────┐                              ┌──────────────────┐
│  Internet  │   138.76.29.7   10.0.0.4     │ Host 1: 10.0.0.1 │
│  (Pública) │ ─────────── Router NAT ──────┤ Host 2: 10.0.0.2 │
└────────────┘                              │ Host 3: 10.0.0.3 │
                                            └──────────────────┘
```

- Interfaz pública del router: `138.76.29.7`
- Interfaz privada del router: `10.0.0.4`

### Clases de direcciones

Consiste en definir dos clases de direcciones para un mismo equipo:

- **Dirección interior:** Utilizada dentro de la red privada.
- **Dirección exterior:** Utilizada para comunicarse con el exterior.

### Formas de NAT

Existen dos modalidades principales de implementación:

- **NAT básico:** Asociación estática o dinámica de tipo 1 a 1 entre direcciones.
- **Por puerto (PAT):** Permite reutilizar una única dirección exterior usando diferentes puertos.

### Limitaciones

Presenta problemas con aplicaciones que requieren conexiones directas o rompen la jerarquía de capas:

- **VoIP:** Dificulta el establecimiento de llamadas de voz directas.
- **Software P2P:** Complica el intercambio directo de archivos.
- **Protocolos:** Incompatibilidad con servicios que no toleran cambios de IP/puerto.

---

# 02 – NAT Básico

## Funcionamiento

- **Asociación 1 a 1:** Cada dirección interna se asocia de forma exclusiva y fija a una dirección externa.
- **Conexiones entrantes:** Es posible iniciar conexiones desde el exterior (Internet) hacia los equipos internos.

## Diagrama de Traducción de Direcciones (1:1)

**Escenario:**

- PC: `192.168.1.2`
- Router NAT: interfaz interna `Eth_0: 192.168.1.1`, interfaz externa `S_0: 200.10.0.3`
- Pool público: `200.10.0.4` – `200.10.0.10`
- Asociación activa: **`192.168.1.2 ↔ 200.10.0.5`**
- Servidor web: `99.12.1.36`

### Ida – se traduce la IP de origen

| Tramo | IP de origen | IP de destino |
|---|---|---|
| Antes del router (LAN) | **`192.168.1.2`** | `99.12.1.36` |
| Después del router (Internet) | **`200.10.0.5`** | `99.12.1.36` |

### Vuelta – se traduce la IP de destino

| Tramo | IP de origen | IP de destino |
|---|---|---|
| Antes del router (Internet) | `99.12.1.36` | **`200.10.0.5`** |
| Después del router (LAN) | `99.12.1.36` | **`192.168.1.2`** |

> El router asigna una IP pública del pool y utiliza la misma asociación para traducir el tráfico de retorno.

---

# 03 – Port Address Translation (PAT)

## Características

- **Asociación muchos a uno:** Permite mapear múltiples direcciones IP privadas de una red interna a una única dirección IP pública externa.
- **Registro de puertos:** Los routers deben llevar un registro estricto en sus tablas NAT de los puertos que se usan para diferenciar cada sesión activa.
- **Restricción de conexiones:** En general no se pueden iniciar conexiones entrantes desde Internet hacia la red interna de forma directa.

## Ejemplo de Traducción de Puertos (PAT)

| | Origen | Destino |
|---|---|---|
| **Dirección de origen interna (LAN)** | `10.0.0.1:3345` | `128.119.40.186:80` |
| ↓ *Proceso PAT* ↓ | | |
| **Dirección de origen externa (WAN)** | `138.76.29.7:3345` | `128.119.40.186:80` |

**Explicación de la traducción:** La dirección IP privada (`10.0.0.1`) se traduce a la IP pública (`138.76.29.7`) del router. En este ejemplo, el número de puerto de origen (`3345`) se mantiene para identificar el flujo de manera única.

## Los routers deben:

### A los paquetes salientes

1. **Cambiar:** `(IP de origen, port #)` por `(dirección IP de NAT, port #)`
2. **Registrar en la tabla de NAT:** asocia `(IP de origen, port #)` con `(dirección IP de NAT, port #)`

### A los paquetes entrantes

1. **Cambiar en destino:** `(dirección IP de NAT, port #)` por `(IP de origen, port #)`
2. **Búsqueda en tabla:** se utiliza la correspondencia previamente guardada en la tabla de traslaciones de NAT.

## NAT/PAT – Traducción de direcciones y puertos

### Tabla de traducción NAT/PAT

| Lado público (WAN) | | Lado privado (LAN) |
|---|---|---|
| `138.76.29.7:3345` | ↔ | `10.0.0.1:3345` |

**Escenario:** Red privada (LAN) con hosts `10.0.0.1`, `10.0.0.2` y `10.0.0.3`. El router NAT/PAT tiene IP privada `10.0.0.4` e IP pública `138.76.29.7`. El servidor web está en `128.119.40.186:80`.

| Paso | Mensaje | Origen | Destino |
|---|---|---|---|
| 1 | Solicitud desde la LAN | `10.0.0.1:3345` | `128.119.40.186:80` |
| 2 | Solicitud hacia Internet | `138.76.29.7:3345` | `128.119.40.186:80` |
| 3 | Respuesta desde Internet | `128.119.40.186:80` | `138.76.29.7:3345` |
| 4 | Respuesta hacia la LAN | `128.119.40.186:80` | `10.0.0.1:3345` |

- **Salida:** el router traduce el origen y registra la asociación.
- **Entrada:** el router consulta la tabla y traduce el destino.

*En este ejemplo se conserva el puerto 3345.*

*Adaptado de* Computer Networking: A Top-Down Approach, *5.ª edición.*

---

## Ejercicio: Conexión a Internet hogareña

Piensen en una conexión a Internet hogareña y respondan las siguientes preguntas:

- **Dispositivo y configuración:** ¿Qué equipo realiza el NAT/PAT? ¿Ud. lo configuró?
- **Asignación de direcciones:** ¿Quién le asignó la dirección IP pública? ¿Y las privadas?

## Investigue: NAT/PAT

Investigue con qué dirección IP navega en Internet desde la red inalámbrica de la facultad:

- **Comparación colectiva:** ¿Es la misma dirección IP que la de sus compañeros de clase?
- **Mecanismo de red:** ¿Qué tipo de traducción de direcciones (NAT) se está realizando?

> 🔗 **Herramienta de utilidad:** Consulte su IP pública actual en http://whatismyip.com
