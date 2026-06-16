import * as THREE from 'three';

let scene, camera, renderer, ribbonMesh;
let targetRotationX = 0;
let targetRotationY = 0;
let targetScale = 1;
let mouseX = 0;
let mouseY = 0;

export function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // --- Scene Setup ---
    scene = new THREE.Scene();

    // --- Camera Setup ---
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 7.5;

    // --- Renderer Setup ---
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // --- Lighting Setup ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Dynamic light tracking mouse
    const pointLight1 = new THREE.PointLight(0x00f2fe, 15, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x9d4edd, 15, 50);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const spotLight = new THREE.SpotLight(0xffffff, 40);
    spotLight.position.set(0, 8, 10);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);

    // --- 3D Curve Geometry Generation ---
    const curvePoints = [];
    const segments = 250;
    const loops = 4.5;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * loops;
        
        // Ribbon curves back and forth, matching the Mads Matters ribbon aesthetic
        const radius = 1.9 + Math.sin(t * Math.PI) * 0.4;
        const x = Math.sin(angle) * radius;
        const y = (t - 0.5) * 5.0; // Spanned vertically
        const z = Math.cos(angle) * radius * 0.8;
        
        curvePoints.push(new THREE.Vector3(x, y, z));
    }
    
    const splineCurve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeometry = new THREE.TubeGeometry(splineCurve, 180, 0.16, 24, false);

    // --- Vertex Color Gradient Integration ---
    const count = tubeGeometry.attributes.position.count;
    const colors = [];
    const cTeal = new THREE.Color('#00f2fe');   // Primary cyan
    const cEmerald = new THREE.Color('#00a86b'); // Mid green
    const cLime = new THREE.Color('#9ada00');    // Accent lime
    
    const positions = tubeGeometry.attributes.position;
    for (let i = 0; i < count; i++) {
        const y = positions.getY(i);
        // Map Y coordinate (approx -2.5 to 2.5) to t value (0 to 1)
        const tVal = (y + 2.5) / 5.0;
        const clampT = Math.max(0, Math.min(1, tVal));
        
        let col = new THREE.Color();
        if (clampT < 0.5) {
            // Gradient from Teal to Emerald in first half
            col.copy(cTeal).lerp(cEmerald, clampT * 2);
        } else {
            // Gradient from Emerald to Lime in second half
            col.copy(cEmerald).lerp(cLime, (clampT - 0.5) * 2);
        }
        colors.push(col.r, col.g, col.b);
    }
    
    tubeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // --- Material Configuration (Tactile Metallic) ---
    const material = new THREE.MeshPhysicalMaterial({
        metalness: 0.95,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        vertexColors: true,
        reflectivity: 1.0,
        flatShading: false
    });

    ribbonMesh = new THREE.Mesh(tubeGeometry, material);
    scene.add(ribbonMesh);

    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onWindowScroll);

    // Trigger initial positioning check
    onWindowScroll();

    // --- Start Animation Loop ---
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Normalize coordinates -1 to 1
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowScroll() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = maxScroll > 0 ? scrollY / maxScroll : 0;

    // Bind scroll to continuous rotation updates
    targetRotationY = scrollPercent * Math.PI * 3.5;
    targetRotationX = scrollPercent * Math.PI * 0.75;
    
    // Scale down slightly as scroll depth increases
    targetScale = 1.0 - scrollPercent * 0.35;
}

function animate() {
    requestAnimationFrame(animate);

    if (ribbonMesh) {
        // Continuous slow idle spin
        ribbonMesh.rotation.y += 0.003;
        ribbonMesh.rotation.z += 0.001;

        // Smoothly interpolate scroll-driven rotation
        ribbonMesh.rotation.y += (targetRotationY - ribbonMesh.rotation.y) * 0.05;
        ribbonMesh.rotation.x += (targetRotationX - ribbonMesh.rotation.x) * 0.05;

        // Smoothly interpolate scroll-driven scale
        const currentScale = ribbonMesh.scale.x;
        const nextScale = currentScale + (targetScale - currentScale) * 0.1;
        ribbonMesh.scale.setScalar(nextScale);

        // Subtly update camera parallax based on mouse
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 0.4 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
}
