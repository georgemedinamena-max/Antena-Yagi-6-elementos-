# 📡 Visualizador de Patrones de Radiación — Antena Yagi-Uda

> Herramienta web interactiva para el diseño, cálculo y simulación de antenas Yagi-Uda de 6 elementos.  
> Desarrollada como trabajo final de la asignatura **Líneas de Transmisión y Antenas** — Universidad de Oriente, Curso 2025–2026.

---

## 🖼️ Vista General

La aplicación permite diseñar y visualizar en tiempo real una antena Yagi de 6 elementos para el **Canal 45 TDT (666 MHz)**, con tres criterios de optimización, adaptación a coaxial RG59 (75 Ω) y representación del patrón de radiación en 2D y 3D.

---

## ✨ Características

- 🔢 **Calculadora de dimensiones** — Longitudes y posiciones de cada elemento (reflector, excitado, 4 directores) calculadas a partir de constantes de diseño optimizadas (ARRL Antenna Book).
- 📐 **Patrón de radiación 2D** — Representación polar en el Plano E (XZ) y Plano H (YZ) con escala logarítmica de referencia (−10 a −40 dB).
- 🌐 **Visualización 3D interactiva** — Superficie volumétrica del patrón generada con Three.js, sombreada por intensidad de campo (azul → rojo). Rotación, zoom y paneo con ratón/touch.
- ⚙️ **Tres criterios de optimización**:
  - Larga Distancia (Máxima Ganancia)
  - Ancho de Banda (Broadband)
  - Compromiso (Estándar)
- 📊 **Informe de parámetros** — Ganancia (dBi), HPBW, Relación Frente-Espalda y ROE (VSWR) actualizados en tiempo real.
- 📸 **Exportación de imágenes** — Captura los tres canvas como archivos PNG descargables.
- 📱 **Diseño responsivo** — Adaptado para escritorio, tablet y móvil.

---

## 🚀 Cómo usar

### Opción 1 — Abrir directamente (sin servidor)

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/yagi-visualizer.git

# Entrar al directorio
cd yagi-visualizer

# Abrir el archivo principal en el navegador
# (doble clic sobre index.html, o desde la terminal:)
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

> ⚠️ Algunos navegadores bloquean recursos locales por política CORS.  
> Si los canvas 3D no cargan, usa la Opción 2.

### Opción 2 — Servidor local (recomendado)

```bash
# Con Python 3
python -m http.server 8080

# Con Node.js (npx)
npx serve .

# Luego abre en el navegador:
# http://localhost:8080
```

### Opción 3 — GitHub Pages

Si el repositorio está publicado en GitHub Pages, accede directamente desde:

```
https://tu-usuario.github.io/yagi-visualizer/
```

---

## 📁 Estructura del Repositorio

```
yagi-visualizer/
│
├── index.html        # Estructura HTML de la aplicación (SPA)
├── estilos.css       # Hoja de estilos (dark mode, glassmorphism, responsivo)
├── script.js         # Lógica de cálculo, patrones 2D y visualización 3D
└── README.md         # Este archivo
```

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| HTML5 | — | Estructura semántica y canvas API |
| CSS3 | — | Diseño, animaciones, glassmorphism |
| JavaScript (Vanilla) | ES2020 | Cálculo de antena, patrones 2D |
| [Three.js](https://threejs.org/) | r128 | Renderizado 3D WebGL |
| [Tailwind CSS](https://tailwindcss.com/) | v3 (CDN) | Sistema de diseño utilitario |
| OrbitControls (Three.js) | r128 | Navegación 3D interactiva |

> Las dependencias externas se cargan desde CDN. No se requiere instalación de paquetes npm.

---

## ⚙️ Parámetros de Diseño

### Frecuencia de trabajo

| Canal | Frecuencia | Banda | Estándar |
|---|---|---|---|
| Canal 45 TDT | 666 MHz | UHF | ISDB-Tb |

### Dimensiones calculadas (modo Larga Distancia, 666 MHz)

| Elemento | Factor (×λ) | Longitud (mm) | Posición en boom (mm) |
|---|---|---|---|
| Reflector | 0.495 | 222.1 | 0.0 |
| Excitado (dipolo plegado) | 0.470 | 211.0 | 80.9 |
| Director 1 | 0.445 | 199.9 | 161.9 |
| Director 2 | 0.435 | 195.4 | 251.6 |
| Director 3 | 0.430 | 193.1 | 341.4 |
| Director 4 | 0.425 | 190.9 | 431.2 |

### Métricas de desempeño (modo Larga Distancia)

| Parámetro | Valor |
|---|---|
| Ganancia Directiva | 10.5 dBi |
| Ancho del Haz (−3 dB) | 58° |
| Relación Frente-Espalda | 18.2 dB |
| ROE (VSWR) a 75 Ω | 1.15 |
| Longitud total del boom | 431.2 mm ≈ 0.96λ |

---

## 🧠 Modelo Matemático

El patrón de radiación se calcula mediante el producto del patrón del elemento (dipolo de media onda) por el factor de array simplificado:

```
E(θ) ∝ |cos θ| × [(1 + cos θ)/2]^(q/2)
```

Donde:
- `θ` — ángulo respecto al eje del boom
- `q` — orden del factor de array según la optimización:
  - `q = 6` → Larga Distancia (lóbulo estrecho, mayor ganancia)
  - `q = 4` → Compromiso
  - `q = 3` → Ancho de Banda (lóbulo más amplio)

La longitud de onda de referencia se calcula como:

```
λ = c / f = 300 / 666 ≈ 450.5 mm
```

---

## 📚 Referencias

- Balanis, C. A. (2016). *Antenna Theory: Analysis and Design* (4ª ed.). Wiley.
- ARRL. (2021). *The ARRL Antenna Book* (25ª ed.). American Radio Relay League.
- Orfanidis, S. J. (2016). *Electromagnetic Waves and Antennas*. Rutgers University. [ece.rutgers.edu](https://www.ece.rutgers.edu/~orfanidi/ewa/)
- Three.js Documentation r128. [threejs.org](https://threejs.org/docs/)
- ITU-R BT.1368-12. *Planning criteria for digital terrestrial television*. ITU, 2020.

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos en el marco de la asignatura **Líneas de Transmisión y Antenas**, Universidad de Oriente, Cuba.  
Libre para uso educativo y no comercial con atribución al autor.

---

<p align="center">
  Universidad de Oriente · Ingeniería en Telecomunicaciones · 2026
</p>
