/* =============================================================
   script.js — Visualizador de Patrones de Radiación Yagi
   Universidad de Oriente · Ingeniería en Telecomunicaciones
   Canal 45 TDT · 666 MHz · Curso 2025-2026
   =============================================================
   ÍNDICE DE FUNCIONES
   -----------------------------------------------------------
   1. calculateYagi(freqMHz, optimizationMode)
      → Calcula las dimensiones y métricas de la antena.

   2. updateResultsTable(elements)
      → Actualiza la tabla HTML con los resultados.

   3. updateReport(metrics)
      → Actualiza los indicadores del informe (ganancia, VSWR, etc.)

   4. drawPolarPattern(canvasId, planeType, optMode)
      → Dibuja el patrón polar 2D en un canvas HTML5.

   5. init3D()
      → Inicializa la escena Three.js (cámara, renderer, luces, grid).

   6. update3DYagi(elements, optMode)
      → Reconstruye el modelo 3D de la antena y el patrón volumétrico.

   7. animate()
      → Bucle de animación WebGL (requestAnimationFrame).

   8. calculateAndRender()
      → Orquesta el cálculo completo y actualiza toda la UI.

   9. captureAllImages()
      → Exporta los tres canvas como imágenes PNG descargables.
   ============================================================= */

'use strict';

/* ─────────────────────────────────────────────────────────────
   Variables globales Three.js
   ───────────────────────────────────────────────────────────── */
let scene, camera, renderer, controls, yagiGroup, patternMesh;

/* ─────────────────────────────────────────────────────────────
   1. CÁLCULO DE DIMENSIONES Y MÉTRICAS
   ───────────────────────────────────────────────────────────── */
/**
 * Calcula las dimensiones físicas de la antena Yagi-Uda de 6 elementos
 * y las métricas de desempeño para el criterio de optimización indicado.
 *
 * @param {number} freqMHz      - Frecuencia de trabajo en MHz.
 * @param {string} optimizationMode - 'larga_distancia' | 'ancho_banda' | 'compromiso'
 * @returns {{ lambda: number, elements: Array, metrics: Object }}
 */
function calculateYagi(freqMHz, optimizationMode) {
    const c = 300;                          // Velocidad de la luz × 10^-6 (m/s → MHz·m)
    const lambda = c / freqMHz;            // Longitud de onda en metros
    const lambdaMm = lambda * 1000;        // Longitud de onda en milímetros

    let metrics = {};
    let elements = [];

    /* ── Modo Larga Distancia (Máxima Ganancia) ── */
    if (optimizationMode === 'larga_distancia') {
        elements = [
            { name: 'Reflector',  length: 0.495 * lambdaMm, pos: 0,               color: '#ef4444' },
            { name: 'Excitado',   length: 0.470 * lambdaMm, pos: 0.15 * lambdaMm, color: '#eab308' },
            { name: 'Director 1', length: 0.450 * lambdaMm, pos: 0.30 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 2', length: 0.440 * lambdaMm, pos: 0.48 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 3', length: 0.430 * lambdaMm, pos: 0.66 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 4', length: 0.420 * lambdaMm, pos: 0.84 * lambdaMm, color: '#22d3ee' },
        ];
        metrics = {
            gain:      11.2,
            beamwidth: 52,
            fb:        22.5,
            vswr:      1.25,
            text: 'optimizada para Máxima Ganancia (Larga Distancia). El espaciado reducido y el ' +
                  'tapering agresivo de los directores maximizan la directividad y la relación ' +
                  'frente-espalda, ideal para enlaces punto a punto, a costa de un ancho de banda ' +
                  'ligeramente menor y una ROE un poco más alta en los extremos.'
        };

    /* ── Modo Ancho de Banda (Broadband) ── */
    } else if (optimizationMode === 'ancho_banda') {
        elements = [
            { name: 'Reflector',  length: 0.490 * lambdaMm, pos: 0,               color: '#ef4444' },
            { name: 'Excitado',   length: 0.465 * lambdaMm, pos: 0.20 * lambdaMm, color: '#eab308' },
            { name: 'Director 1', length: 0.445 * lambdaMm, pos: 0.40 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 2', length: 0.440 * lambdaMm, pos: 0.60 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 3', length: 0.435 * lambdaMm, pos: 0.80 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 4', length: 0.430 * lambdaMm, pos: 1.00 * lambdaMm, color: '#22d3ee' },
        ];
        metrics = {
            gain:      9.2,
            beamwidth: 68,
            fb:        15.0,
            vswr:      1.08,
            text: 'optimizada para Ancho de Banda (Broadband). El mayor espaciado entre elementos ' +
                  'y la longitud más uniforme de los directores sacrifican ganancia pico para ' +
                  'mantener una ROE (VSWR) excelente (< 1.1) y un patrón estable sobre un rango ' +
                  'más amplio de frecuencias.'
        };

    /* ── Modo Compromiso (Estándar — predeterminado) ── */
    } else {
        elements = [
            { name: 'Reflector',  length: 0.495 * lambdaMm, pos: 0,               color: '#ef4444' },
            { name: 'Excitado',   length: 0.470 * lambdaMm, pos: 0.18 * lambdaMm, color: '#eab308' },
            { name: 'Director 1', length: 0.445 * lambdaMm, pos: 0.36 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 2', length: 0.435 * lambdaMm, pos: 0.56 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 3', length: 0.430 * lambdaMm, pos: 0.76 * lambdaMm, color: '#22d3ee' },
            { name: 'Director 4', length: 0.425 * lambdaMm, pos: 0.96 * lambdaMm, color: '#22d3ee' },
        ];
        metrics = {
            gain:      10.5,
            beamwidth: 58,
            fb:        18.2,
            vswr:      1.15,
            text: 'en modo Compromiso (Estándar). Ofrece un equilibrio óptimo entre ganancia, ' +
                  'ancho de banda y relación frente-espalda, siendo la configuración más versátil ' +
                  'para recepción de TDT en condiciones variables.'
        };
    }

    return { lambda: lambdaMm, elements, metrics };
}

/* ─────────────────────────────────────────────────────────────
   2. ACTUALIZAR TABLA DE DIMENSIONES
   ───────────────────────────────────────────────────────────── */
/**
 * Genera dinámicamente las filas de la tabla de resultados.
 * @param {Array} elements - Array de objetos elemento de calculateYagi().
 */
function updateResultsTable(elements) {
    const tbody = document.getElementById('resultsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    elements.forEach(el => {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-700';
        row.innerHTML = `
            <td class="px-3 py-2" style="color: ${el.color}">${el.name}</td>
            <td class="px-3 py-2">${el.length.toFixed(1)}</td>
            <td class="px-3 py-2">${el.pos.toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });
}

/* ─────────────────────────────────────────────────────────────
   3. ACTUALIZAR INFORME DE PARÁMETROS
   ───────────────────────────────────────────────────────────── */
/**
 * Actualiza las tarjetas de métricas y el texto de conclusión.
 * @param {Object} metrics - Objeto metrics devuelto por calculateYagi().
 */
function updateReport(metrics) {
    document.getElementById('reportGain').textContent      = metrics.gain.toFixed(1);
    document.getElementById('reportBeamwidth').textContent = metrics.beamwidth + '°';
    document.getElementById('reportFB').textContent        = metrics.fb.toFixed(1);
    document.getElementById('reportVSWR').textContent      = metrics.vswr.toFixed(2);

    document.getElementById('reportConclusion').innerHTML =
        `<strong class="text-white">Conclusión del Diseño:</strong> La antena Yagi de 6 elementos ${metrics.text} ` +
        `El uso de un dipolo plegado como elemento excitado garantiza la adaptación de impedancia ` +
        `a la línea de transmisión Coaxial RG59 (75&nbsp;Ω), minimizando las pérdidas por reflexión.`;
}

/* ─────────────────────────────────────────────────────────────
   4. DIBUJO DEL PATRÓN POLAR 2D
   ───────────────────────────────────────────────────────────── */
/**
 * Dibuja el patrón de radiación en coordenadas polares (escala lineal
 * normalizada con referencia dB) sobre un canvas HTML5.
 *
 * Modelo utilizado:
 *   Plano E: E(θ) ∝ |cos θ| × AF(θ)   — incluye el patrón del elemento dipolo
 *   Plano H: E(θ) ∝ AF(θ)              — patrón isotrópico del elemento
 *   AF(θ)  = [(1 + cos θ)/2]^(q/2)     — factor de array simplificado
 *   q = 3 (broadband) | 4 (compromiso) | 6 (larga distancia)
 *   Lóbulo trasero: adición de contribución parásita del reflector.
 *
 * @param {string} canvasId  - ID del elemento <canvas>.
 * @param {string} planeType - 'E' o 'H'.
 * @param {string} optMode   - Criterio de optimización activo.
 */
function drawPolarPattern(canvasId, planeType, optMode) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    /* Esperar a que el layout esté listo */
    if (rect.width === 0 || rect.height === 0) {
        setTimeout(() => drawPolarPattern(canvasId, planeType, optMode), 50);
        return;
    }

    canvas.width  = rect.width;
    canvas.height = rect.height;
    const width   = canvas.width;
    const height  = canvas.height;
    const centerX = width  / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 40;

    ctx.clearRect(0, 0, width, height);

    /* ── Círculos de referencia (−10, −20, −30, −40 dB) ── */
    ctx.strokeStyle = '#334155';
    ctx.lineWidth   = 1;
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font      = '10px Inter, sans-serif';
        ctx.fillText(`${-i * 10} dB`, centerX + 5, centerY - (maxRadius / 4) * i);
    }

    /* ── Ejes cartesianos ── */
    ctx.beginPath();
    ctx.moveTo(centerX, 20);        ctx.lineTo(centerX, height - 20);
    ctx.moveTo(20, centerY);        ctx.lineTo(width - 20, centerY);
    ctx.stroke();

    /* ── Factor de array q según modo ── */
    let q = 4;
    if      (optMode === 'larga_distancia') q = 6;
    else if (optMode === 'ancho_banda')     q = 3;

    /**
     * Calcula la ganancia normalizada (lineal) para un ángulo θ.
     * @param {number} theta - Ángulo en radianes.
     * @returns {number} Ganancia normalizada (≥ 0.01).
     */
    function getGain(theta) {
        /* Patrón del elemento: cos θ en plano E; uniforme en plano H */
        const elementPattern = (planeType === 'E') ? Math.abs(Math.cos(theta)) : 1;

        /* Factor de array simplificado */
        const af = Math.pow((1 + Math.cos(theta)) / 2, q / 2);

        /* Ganancia total + contribución parásita del reflector en la zona trasera */
        let totalGain = elementPattern * af;
        if (Math.cos(theta) < 0) {
            totalGain += 0.12 * Math.pow(Math.abs(Math.cos(theta)), 2);
        }

        return Math.max(0.01, totalGain);
    }

    /* ── Trazar el patrón polar ── */
    ctx.beginPath();
    ctx.strokeStyle = (planeType === 'E') ? '#22d3ee' : '#fbbf24';
    ctx.lineWidth   = 2;

    for (let angle = 0; angle <= 360; angle++) {
        const rad  = angle * Math.PI / 180;
        const gain = getGain(rad);
        const dbVal = 20 * Math.log10(gain);           // dB
        const r    = maxRadius * (1 + (dbVal / 40));   // Radio normalizado

        const x = centerX + r * Math.sin(rad);
        const y = centerY - r * Math.cos(rad);

        if (angle === 0) ctx.moveTo(x, y);
        else             ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.stroke();

    /* Relleno semitransparente */
    ctx.fillStyle = (planeType === 'E')
        ? 'rgba(34, 211, 238, 0.10)'
        : 'rgba(251, 191, 36, 0.10)';
    ctx.fill();
}

/* ─────────────────────────────────────────────────────────────
   5. INICIALIZACIÓN THREE.JS (3D)
   ───────────────────────────────────────────────────────────── */
/**
 * Crea la escena WebGL con cámara perspectiva, renderer, luces
 * y el grid de referencia. Debe llamarse una sola vez en window.load.
 */
function init3D() {
    const container = document.getElementById('threeContainer');
    if (!container) return;

    /* Escena */
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    /* Cámara */
    camera = new THREE.PerspectiveCamera(
        45,
        container.offsetWidth / container.offsetHeight,
        0.1,
        1000
    );
    camera.position.set(1.2, 1.2, 1.5);

    /* Renderer */
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    /* Controles de órbita */
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    /* Iluminación */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    /* Grid de referencia */
    const gridHelper = new THREE.GridHelper(3, 30, 0x1e293b, 0x0f172a);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.3;
    scene.add(gridHelper);

    animate();
}

/* ─────────────────────────────────────────────────────────────
   6. ACTUALIZAR MODELO 3D
   ───────────────────────────────────────────────────────────── */
/**
 * Construye la geometría 3D de la antena (boom + elementos) y genera
 * la malla del patrón de radiación volumétrico con coloreado HSL.
 *
 * El patrón 3D se obtiene deformando una esfera: cada vértice se
 * desplaza radialmente según su ganancia en dB:
 *   r(θ,φ) = r_min + [(G_dB + 40) / 40] × (r_max − r_min)
 * El color se asigna con hue = 0.6 − gain × 0.6 (azul→rojo).
 *
 * @param {Array}  elements - Array de elementos de calculateYagi().
 * @param {string} optMode  - Criterio de optimización activo.
 */
function update3DYagi(elements, optMode) {
    /* Limpiar geometrías anteriores */
    if (yagiGroup)   scene.remove(yagiGroup);
    if (patternMesh) scene.remove(patternMesh);

    yagiGroup = new THREE.Group();

    /* ── Boom ── */
    const boomGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 16);
    const boomMat  = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
    const boom     = new THREE.Mesh(boomGeom, boomMat);
    boom.rotation.x  = Math.PI / 2;
    boom.position.z  = 0.5;
    yagiGroup.add(boom);

    let excitadoZ = 0;

    /* ── Elementos de la antena ── */
    elements.forEach(el => {
        const geom = new THREE.CylinderGeometry(0.008, 0.008, el.length / 1000, 16);
        const mat  = new THREE.MeshStandardMaterial({ color: el.color, metalness: 0.9, roughness: 0.1 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.z = (el.pos / 1000) - 0.1;
        yagiGroup.add(mesh);

        /* Punto de alimentación (caja roja en el excitado) */
        if (el.name === 'Excitado') {
            excitadoZ = (el.pos / 1000) - 0.1;
            const feedGeom = new THREE.BoxGeometry(0.02, 0.08, 0.02);
            const feedMat  = new THREE.MeshStandardMaterial({ color: 0xef4444 });
            const feed     = new THREE.Mesh(feedGeom, feedMat);
            feed.position.set(0, -0.05, excitadoZ);
            yagiGroup.add(feed);
        }
    });

    scene.add(yagiGroup);

    /* ── Patrón de radiación 3D ── */
    const patternGeom = new THREE.SphereGeometry(0.8, 64, 64);
    const positions   = patternGeom.attributes.position;
    const colors      = [];
    const colorObj    = new THREE.Color();

    /* Factor q según modo */
    let q = 4;
    if      (optMode === 'larga_distancia') q = 6;
    else if (optMode === 'ancho_banda')     q = 3;

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const r = Math.sqrt(x * x + y * y + z * z);

        if (r === 0) {
            colors.push(0, 0, 1);
            continue;
        }

        /* Ángulos esféricos */
        const theta = Math.acos(z / r);
        const sinTheta = Math.sin(theta);
        const cosPhi   = Math.cos(Math.atan2(y, x));

        /* Patrón del elemento dipolo en 3D */
        const elementPattern = Math.sqrt(
            Math.max(0, 1 - sinTheta * sinTheta * cosPhi * cosPhi)
        );

        /* Factor de array */
        const af = Math.pow((1 + Math.cos(theta)) / 2, q / 2);
        let gain = elementPattern * af;

        /* Lóbulo trasero */
        if (Math.cos(theta) < 0) {
            gain += 0.12 * Math.pow(Math.abs(Math.cos(theta)), 2);
        }

        /* Deformación radial según ganancia */
        const gainDB = 20 * Math.log10(Math.max(0.01, gain));
        const newR   = 0.15 + ((gainDB + 40) / 40) * 0.85;
        positions.setXYZ(i, (x / r) * newR, (y / r) * newR, (z / r) * newR);

        /* Color HSL: azul (baja) → rojo (alta) */
        const hue = 0.6 - gain * 0.6;
        colorObj.setHSL(Math.max(0, hue), 1.0, 0.5);
        colors.push(colorObj.r, colorObj.g, colorObj.b);
    }

    patternGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    patternGeom.computeVertexNormals();

    const patternMat = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side:         THREE.DoubleSide,
        transparent:  true,
        opacity:      0.85,
        shininess:    100,
        specular:     0x444444
    });

    patternMesh = new THREE.Mesh(patternGeom, patternMat);
    patternMesh.position.z = excitadoZ;
    scene.add(patternMesh);
}

/* ─────────────────────────────────────────────────────────────
   7. BUCLE DE ANIMACIÓN
   ───────────────────────────────────────────────────────────── */
/**
 * Bucle de renderizado WebGL. Actualiza los controles de órbita
 * y aplica una rotación automática lenta al patrón 3D.
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (patternMesh) {
        patternMesh.rotation.z += 0.001;   // Rotación suave para inspección
    }
    renderer.render(scene, camera);
}

/* ─────────────────────────────────────────────────────────────
   8. CÁLCULO COMPLETO + ACTUALIZACIÓN DE UI
   ───────────────────────────────────────────────────────────── */
/**
 * Punto de entrada principal. Lee los parámetros del formulario,
 * calcula las dimensiones de la antena y actualiza todos los
 * componentes visuales de la aplicación.
 */
function calculateAndRender() {
    const freq    = parseFloat(document.getElementById('freqInput').value) || 666;
    const optMode = document.getElementById('optimization').value;

    const data = calculateYagi(freq, optMode);

    updateResultsTable(data.elements);
    updateReport(data.metrics);
    drawPolarPattern('ePlaneCanvas', 'E', optMode);
    drawPolarPattern('hPlaneCanvas', 'H', optMode);

    if (scene) {
        update3DYagi(data.elements, optMode);
    }
}

/* ─────────────────────────────────────────────────────────────
   9. CAPTURA DE IMÁGENES PNG
   ───────────────────────────────────────────────────────────── */
/**
 * Exporta los tres canvas de visualización como archivos PNG
 * mediante el método toDataURL() de la API Canvas HTML5.
 * Los archivos se descargan secuencialmente para evitar
 * bloqueos del navegador.
 */
function captureAllImages() {
    const btn          = document.getElementById('captureBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML  = '⏳ Capturando...';
    btn.disabled   = true;

    try {
        setTimeout(() => {
            /* Canvas 2D: Plano E y Plano H */
            const canvases = [
                { id: 'ePlaneCanvas', name: 'patron_plano_E_XZ.png' },
                { id: 'hPlaneCanvas', name: 'patron_plano_H_YZ.png' },
            ];

            canvases.forEach((c, index) => {
                setTimeout(() => {
                    const canvas = document.getElementById(c.id);
                    const link   = document.createElement('a');
                    link.download = c.name;
                    link.href     = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 300);
            });

            /* Canvas 3D: Three.js (preserveDrawingBuffer: true) */
            setTimeout(() => {
                if (renderer) {
                    renderer.render(scene, camera);   // Forzar render antes de capturar
                    const canvas3D = renderer.domElement;
                    const link3D   = document.createElement('a');
                    link3D.download = 'visualizacion_3D_patron.png';
                    link3D.href     = canvas3D.toDataURL('image/png');
                    document.body.appendChild(link3D);
                    link3D.click();
                    document.body.removeChild(link3D);
                }
                /* Restaurar botón */
                btn.innerHTML = originalHTML;
                btn.disabled  = false;
            }, 1000);

        }, 100);

    } catch (error) {
        console.error('Error al capturar imágenes:', error);
        alert('No se pudieron capturar las imágenes. Revisa la consola (F12) para más detalles.');
        btn.innerHTML = originalHTML;
        btn.disabled  = false;
    }
}

/* ─────────────────────────────────────────────────────────────
   EVENTOS GLOBALES
   ───────────────────────────────────────────────────────────── */

/** Redimensionar renderer 3D y redibujar patrones 2D al cambiar el tamaño de la ventana. */
window.addEventListener('resize', () => {
    if (camera && renderer) {
        const container = document.getElementById('threeContainer');
        if (container) {
            camera.aspect = container.offsetWidth / container.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.offsetWidth, container.offsetHeight);
        }
    }
    const optMode = document.getElementById('optimization').value;
    drawPolarPattern('ePlaneCanvas', 'E', optMode);
    drawPolarPattern('hPlaneCanvas', 'H', optMode);
});

/** Inicializar Three.js y ejecutar el cálculo inicial al cargar la página. */
window.addEventListener('load', () => {
    init3D();
    calculateAndRender();
});
