// Decorative circuit-board background, modeled on bulwarkblack.com.
// A few gold "current" pulses travel along the traces drawn in
// img/circuit-pattern.svg. Purely visual: it never touches app.js or the API.
// Phones and reduced-motion users get the static pattern only.
(function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SVGNS = 'http://www.w3.org/2000/svg';
    const TILE = 320;          // viewBox size of circuit-pattern.svg
    const SCALE = 0.7;         // must match background-size in style.css (224px)
    const STEP = TILE * SCALE;
    const TRACES = [
        'M0,60 L80,60 L80,90 L160,90 L160,60 L240,60 L240,30 L320,30',
        'M0,180 L40,180 L40,150 L130,150 L130,180 L210,180 L210,210 L320,210',
        'M0,260 L90,260 L90,290 L200,290 L200,260 L320,260',
        'M30,0 L30,40 L70,40 L70,80',
        'M120,0 L120,30 L100,30 L100,60',
        'M200,0 L200,20 L180,20 L180,50',
        'M280,0 L280,60 L260,60 L260,90 L290,90 L290,120',
        'M50,320 L50,290 L75,290 L75,250',
        'M150,320 L150,300 L130,300 L130,240',
        'M240,320 L240,270 L260,270 L260,220',
        'M160,90 L160,120 L190,120 L190,160',
        'M230,150 L230,110 L260,110 L260,140'
    ];
    const LAYERS = ['pulse-tail', 'pulse-glow', 'pulse-core', 'pulse-head'];

    const rand = (min, max) => min + Math.random() * (max - min);

    // Move a tile-local trace into tile (col, row) and scale it to match the pattern.
    function place(d, col, row) {
        return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
            `${((Number(x) + col * TILE) * SCALE).toFixed(2)},${((Number(y) + row * TILE) * SCALE).toFixed(2)}`);
    }

    function build() {
        const layer = document.getElementById('circuit-pulse-layer');
        if (!layer) return;
        layer.textContent = '';

        const width = window.innerWidth;
        const height = window.innerHeight;
        if (width < 640) return;

        const cols = Math.ceil(width / STEP);
        const rows = Math.ceil(height / STEP);
        const count = Math.max(3, Math.min(10, Math.round((width * height) / 150000)));

        const svg = document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'none');

        const pickTrace = () => place(
            TRACES[Math.floor(Math.random() * TRACES.length)],
            Math.floor(Math.random() * cols),
            Math.floor(Math.random() * rows)
        );

        for (let i = 0; i < count; i += 1) {
            const duration = `${rand(2.8, 6.5).toFixed(2)}s`;
            const delay = `${(-rand(0, 6.5)).toFixed(2)}s`;
            const group = document.createElementNS(SVGNS, 'g');
            group.setAttribute('class', 'pulse');
            group.style.animationDuration = duration;
            group.style.animationDelay = delay;

            const paths = LAYERS.map((className) => {
                const path = document.createElementNS(SVGNS, 'path');
                path.setAttribute('class', className);
                path.setAttribute('pathLength', '100');
                path.style.animationDuration = duration;
                path.style.animationDelay = delay;
                group.appendChild(path);
                return path;
            });

            // Each time a pulse finishes its run, send it down a different wire.
            const reroute = () => {
                const d = pickTrace();
                paths.forEach((path) => path.setAttribute('d', d));
            };
            reroute();
            paths[paths.length - 1].addEventListener('animationiteration', reroute);
            svg.appendChild(group);
        }

        layer.appendChild(svg);
    }

    let timer;
    window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(build, 200);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
