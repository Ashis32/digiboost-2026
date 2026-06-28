import * as THREE from 'three';
import logoUrl from './logo.png';

let scene, camera, renderer, logoGroup;
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Dynamic light tracking mouse / movement
    const pointLight1 = new THREE.PointLight(0x00f2fe, 15, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x9d4edd, 15, 50);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const spotLight = new THREE.SpotLight(0xffffff, 35);
    spotLight.position.set(0, 8, 10);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);

    // --- 3D Logo Medallion Group ---
    logoGroup = new THREE.Group();

    // Load Texture
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load(logoUrl);
    
    // Enable anisotropic filtering if supported for sharper texture at oblique angles
    if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
        logoTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    // 1. Inner Glass Core (The Medallion Disc)
    const glassGeometry = new THREE.CylinderGeometry(1.6, 1.6, 0.12, 64);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x081415,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.8, // Highly transmissive glassmorphism
        ior: 1.5,
        thickness: 0.4,
        transparent: true,
        opacity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02
    });
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.rotation.x = Math.PI / 2; // Orient circular faces along the Z-axis (forward)
    logoGroup.add(glassMesh);

    // 2. Outer Metallic Ring
    const ringGeometry = new THREE.TorusGeometry(1.64, 0.07, 16, 100);
    const ringMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00f2fe, // Neon cyan metallic ring
        metalness: 0.95,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    logoGroup.add(ringMesh);

    // 3. Front Logo Decal
    const logoFrontGeometry = new THREE.PlaneGeometry(2.0, 2.0);
    const logoFrontMaterial = new THREE.MeshPhysicalMaterial({
        map: logoTexture,
        transparent: true,
        alphaTest: 0.01,
        metalness: 0.8,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.FrontSide
    });
    const logoFrontMesh = new THREE.Mesh(logoFrontGeometry, logoFrontMaterial);
    logoFrontMesh.position.z = 0.065; // Place right on the front face of the disc
    logoGroup.add(logoFrontMesh);

    // 4. Back Logo Decal
    const logoBackGeometry = new THREE.PlaneGeometry(2.0, 2.0);
    const logoBackMaterial = new THREE.MeshPhysicalMaterial({
        map: logoTexture,
        transparent: true,
        alphaTest: 0.01,
        metalness: 0.8,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.FrontSide
    });
    const logoBackMesh = new THREE.Mesh(logoBackGeometry, logoBackMaterial);
    logoBackMesh.position.z = -0.065; // Place right on the back face of the disc
    logoBackMesh.rotation.y = Math.PI; // Rotate 180 degrees so it faces backwards correctly
    logoGroup.add(logoBackMesh);

    scene.add(logoGroup);

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

    if (logoGroup) {
        // Continuous slow idle spin
        logoGroup.rotation.y += 0.003;
        logoGroup.rotation.z += 0.001;

        // Smoothly interpolate scroll-driven rotation
        logoGroup.rotation.y += (targetRotationY - logoGroup.rotation.y) * 0.05;
        logoGroup.rotation.x += (targetRotationX - logoGroup.rotation.x) * 0.05;

        // Smoothly interpolate scroll-driven scale
        const currentScale = logoGroup.scale.x;
        const nextScale = currentScale + (targetScale - currentScale) * 0.1;
        logoGroup.scale.setScalar(nextScale);

        // Subtly update camera parallax based on mouse
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 0.4 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
}
