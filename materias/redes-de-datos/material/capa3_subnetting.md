# Modelo en Capas – Capa 3: Red

> **Flujo de datos:** Física → Enlace → **Red** → Transporte → Aplicación

---

## La capa de Red – Protocolo Internet Protocol (IP)

1. Encabezado IP
2. Direccionamiento IP
3. **Subnetting**

---

# 03 – Subnetting

## Evolución del uso de las direcciones IP...

### El Problema: agotamiento del espacio original

Todas las clases A y varias clases B se asignaron rápidamente dentro de los EEUU.

> **Las direcciones IP comienzan a escasear...**

### Soluciones de Mitigación

Se adoptan dos soluciones clave que en conjunto garantizan el crecimiento global de Internet:

1. **Subnetting y CIDR:** Ruteo sin clases de direcciones para una asignación más eficiente de prefijos.
2. **NAT** (Network Address Translation): Traducción de direcciones para reutilizar rangos de IPs privadas de forma masiva.

## Subnetting

- **Concepto:** División de las redes de clases A, B o C en unidades más pequeñas.
- **Optimización:** Genera mayor **eficiencia** en el uso de las direcciones IP.

## Subnetting: cómo se crean subredes

Al tomar 1 bit de host, el prefijo pasa de `/24` a `/25`.

| Paso | Porción de red | Porción de host |
|---|---|---|
| 1. Red original | Prefijo de red (`/24`) | Host (8 bits) |
| 2. Se toma 1 bit de host | Prefijo `/24` | Bit 0 o 1 + 7 bits de host |
| 3. Se crean 2 subredes | `193.1.1.0/25` | `193.1.1.128/25` — 126 hosts c/u |

> **1 bit permite identificar 2 subredes.**

## Subnetting sucesivo: resultado VLSM

Ejemplo: dividimos una `/24` y luego volvemos a dividir solo una `/25`.

| Paso | Resultado |
|---|---|
| 1. Red original `/24` | `193.1.1.0/24` |
| 2. Primer subnetting `/25` | `193.1.1.0/25` y `193.1.1.128/25` (dos subredes) |
| 3. Subnetting sucesivo `/26` | `193.1.1.0/25`, `193.1.1.128/26` y `193.1.1.192/26` |

> **Resultado:** una `/25` y dos `/26` → **VLSM**

## Variable Length Subnet Mask (VLSM)

### El Desafío de las Subredes

Con la introducción de subredes de longitud variable, las reglas rígidas de las clases tradicionales **A, B o C** dejan de ser válidas.

### La Interrogante Central

> **¿Cómo se sabe dónde termina la porción de red y dónde comienza la porción de host?**

## Concepto – Máscara de Red

### ¿Qué es?

La máscara de red es un número con el mismo formato de una dirección IP que sirve para distinguir cuando un equipo determinado pertenece a una subred dada.

### Reglas de Formación

**Estructura de 32 bits:**

- Si el bit está en la porción de **red** → el bit es **1**
- Si el bit está en la porción de **host** → el bit es **0**

**Formato binario:**

- Todos los **"1"** se agrupan a la izquierda y los **"0"** a la derecha.

## Classless Inter-Domain Routing (CIDR)

Evolución desde el subneteo local hasta la agregación de rutas global con CIDR.

1. **Subnetting local – Redes iguales**
   Se comenzó a subnetear como medida para subdividir las clases rígidas (A, B y C) en partes iguales, aplicando el direccionamiento únicamente a nivel **local**.
2. **Direccionamiento variable – Tamaño variable**
   Luego se incorporó la flexibilidad de crear subredes de diferente tamaño (VLSM), optimizando la asignación de IPs según las necesidades reales del segmento.
3. **CIDR & ruteo global – Escala de Internet**
   Mientras el subnetting y VLSM permiten dividir eficientemente un bloque dentro de una organización, CIDR aplica los prefijos sin clases al direccionamiento global, permitiendo asignar bloques flexibles y agregar rutas bajo un prefijo común.

### ¿Qué es CIDR?

Agrupación de redes (supernetting) para colapsar tablas de ruteo globales.

Es el método que reemplazó a las clases rígidas de direcciones IP (A, B y C), permitiendo una **asignación de direcciones IP flexible** mediante el uso de prefijos.

**Ejemplo:** `/24` indica que los primeros 24 bits pertenecen a la porción de red.

### Supernetting: el camino inverso

Mientras que subnetting divide una red grande en partes chicas, CIDR permite **agregar múltiples rutas continuas** en una sola declaración.

- **Optimiza** el tráfico de internet global.
- **Reduce** drásticamente el tamaño de las tablas de ruteo.

## Ejemplo: Cálculo de la máscara de red

### Dirección IP de Host

Host clase C: `193.1.1.3`

Representación binaria:

```
11000001.00000001.00000001.00000011
└──────── red (24 bits) ────────┘└ host ┘
```

- **Porción de Red (24 bits):** Identifica de manera unívoca la subred.
- **Porción de Host (8 bits):** Identifica al dispositivo específico.

### Máscara de Red

Formato binario estándar:

```
11111111.11111111.11111111.00000000
```

Notación CIDR: **`193.1.1.3/24`**

*El sufijo `/24` indica la cantidad de bits "1" consecutivos en la máscara.*

## Ejemplo: Subnetting

**Escenario de partida:** Dividir la red `193.1.1.0/24` en **dos** subredes.

¿Cuál es...

- **la máscara** de cada subred?
- **la dirección de red** de cada subred?
- **la dirección de broadcast** de cada subred?

**Capacidad de hosts:** ¿Cuántos hosts se pueden direccionar? Determine la cantidad exacta de direcciones IP asignables disponibles para dispositivos en cada una de las nuevas subredes obtenidas.

### Ejemplo: Subnetting (cont.)

**Punto de partida (`/24`):** De los **8 bits** de **host** debo "tomar" alguno para la subred y el resto quedan para hosts…

- **¿Cuántos bits preciso para las subredes?** Para obtener dos subredes: **1 bit** (2ⁿ = # subredes)
- **¿Cuántos hosts por subred?** Restando el bit prestado, quedan **7 bits para hosts** (2⁷ − 2 = # hosts = 126)

### Ejemplo: Subnetting (cont.)

**Máscara de red**

```
11111111.11111111.11111111.10000000
```

Conversión a decimal: **`255.255.255.128`**

**Notación de subred**

Usualmente la primera subred resultante la vamos a denotar combinando la dirección base con el nuevo prefijo de red: **`193.1.1.0/25`**

### Ejemplo: Subnetting (cont.)

| | Subred 1: `193.1.1.0/25` | Subred 2: `193.1.1.128/25` |
|---|---|---|
| **Dirección de red** | `193.1.1.0` | `193.1.1.128` |
| **Máscara de red** | `255.255.255.128` | `255.255.255.128` |
| **Dirección de broadcast** | `193.1.1.127` | `193.1.1.255` |
| **Hosts válidos** | `193.1.1.1` – `193.1.1.126` | `193.1.1.129` – `193.1.1.254` |

## Direcciones de red y de broadcast

### Dirección de Red

Es la dirección que representa a la subred en su totalidad y tiene todos **ceros** en la parte de host.

```
Dirección de red = IP AND Máscara
```

*A partir de esto, los equipos pueden determinar en qué red están ubicados de manera local.*

### Dirección de Broadcast

Es la dirección utilizada para transmitir datos a todos los dispositivos de la red simultáneamente.

```
Host bits = Todos Unos (1)
```

*Tiene todos **unos** en la parte de host para asegurar la difusión completa del mensaje.*

## Ejemplo: Máscaras y Prefijos más usados

| Máscara en binario | En decimal | Notación simplif. | IPs totales |
|---|---|---|---|
| `11111111.11111111.11111111.00000000` | `255.255.255.0` | `/24` | 256 |
| `11111111.11111111.11111111.10000000` | `255.255.255.128` | `/25` | 128 |
| `11111111.11111111.11111111.11000000` | `255.255.255.192` | `/26` | 64 |
| `11111111.11111111.11111111.11100000` | `255.255.255.224` | `/27` | 32 |
| `11111111.11111111.11111111.11110000` | `255.255.255.240` | `/28` | 16 |
| `11111111.11111111.11111111.11111000` | `255.255.255.248` | `/29` | 8 |
| `11111111.11111111.11111111.11111100` | `255.255.255.252` | `/30` | 4 |

---

## Ejercicio: Subnetting I

**En grupos:**

- Direccionar la red sin realizar subnetting.
- Partir la red **clase C `192.168.1.0`** en **tres** subredes.

**Topología:** un router B con tres interfaces:

| Interfaz | Hosts en el segmento |
|---|---|
| E0 | 122 hosts |
| E1 | 61 hosts |
| E2 | 61 hosts |

## Ejercicio: Subnetting II

**Rango base:** `10.1.1.0/24`

**Objetivo del ejercicio:** Dividir el rango asignado para satisfacer los requisitos de hosts indicados de la **forma más eficiente posible** (VLSM).

**Subredes requeridas:**

| Subred | Hosts |
|---|---|
| Subred 1 | 58 |
| Subred 2 | 49 |
| Subred 3 | 29 |
| Subred 4 | 14 |
| Subred 5 | 3 |

---

## Herramienta: `ipcalc`

### ¿Qué es ipcalc?

Herramienta de línea de comandos en Linux. Es una herramienta ágil que, a partir de una dirección IP y su máscara, realiza cálculos de red detallados directamente en la terminal:

- Calcula de forma automática la dirección de **red** y de **broadcast**.
- Determina con precisión el **rango de hosts** utilizables.
- Permite diseñar y calcular esquemas de **subredes** de manera eficiente.

### Sintaxis general

```
ipcalc [options] <ADDRESS> [[/] <NETMASK>] [NETMASK]
```

### Ejemplos prácticos

```bash
# Uso básico con CIDR
$ ipcalc 192.168.0.1/24

# Cálculo con máscara de subred
$ ipcalc 192.168.0.1/24 /30

# Especificando netmasks
$ ipcalc 192.168.0.1 255.255.255.0 255.255.255.252
```

---

## Comentarios / Preguntas

---

# Key Points – Capa 3 (Red)

- **Circuitos virtuales (orientado) y datagramas (no orientado a conexión):** diferencias fundamentales, ventajas y desventajas de ambas modalidades.
- **Protocolo Internet Protocol (IP):** encabezado IP, campos más importantes, concepto de fragmentación, cómo se fragmenta un paquete IP y qué campos involucra.
- **Direccionamiento IP:** notación de dirección IP, porción de red/host. Direcciones reservadas (red y broadcast), cómo calcularlas. Clases de direcciones (A, B, C), en qué se diferencian. Tipos de direcciones (privadas, públicas), en qué se diferencian. Reconocer los rangos de IPs privadas (10.0… 172.16… 192.168…).
- **Subnetting:** para qué sirve, qué es la máscara de red y cómo se calcula. Entender cómo se calcula y "subnetea" un bloque de red (tabla de máscaras y prefijos más usados).
