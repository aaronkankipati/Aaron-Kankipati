document.addEventListener("DOMContentLoaded", () => {
    // 1. Smooth Scrolling (Lenis)
    const lenis = new Lenis({ 
        duration: 1.2, 
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothTouch: false // Let native mobile scrolling handle mobile
    });
    
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. GSAP Narrative Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    // Initial Hero Sequence
    const tl = gsap.timeline();
    tl.to("#hero-quote", { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out", delay: 0.2 })
      .to("#hero-badge", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=1")
      .to("#hero-title", { opacity: 1, y: 0, duration: 1.2, ease: "power4.out" }, "-=0.8")
      .to("#hero-line", { width: "4rem", duration: 1.5, ease: "power2.inOut" }, "-=0.5")
      .to("#hero-desc", { opacity: 1, duration: 1 }, "-=1")
      .to("#command-bar", { opacity: 1, y: 0, duration: 1, ease: "back.out(1.7)" }, "-=0.5");

    // Spatial Grid Parallax
    gsap.to(".bento-card", { 
        y: -20, 
        scrollTrigger: { trigger: "#grid-neonbull", start: "top bottom", end: "bottom top", scrub: 1 }
    });

    // 3. Three.js Background (BRIGHTENED)
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    // LIGHTING (Boosted significantly for better visibility)
    // Global ambient light to lift the darkness
    scene.add(new THREE.AmbientLight(0x3a2c54, 1.5)); 
    
    const dirLight1 = new THREE.DirectionalLight(0x8b5cf6, 2.5); // Brighter Purple
    dirLight1.position.set(10, 10, 5);
    scene.add(dirLight1);
    
    const dirLight2 = new THREE.DirectionalLight(0xe8c97a, 1.5); // Brighter Gold
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    // Ambient Data Stream (Brighter, larger particles)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 12;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.025, // Larger particles
        color: 0xe8c97a, 
        transparent: true, 
        opacity: 0.7, // More opaque
        blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // AI Core (Holographic Torus)
    const torusGeometry = new THREE.TorusGeometry(1.5, 0.4, 16, 100);
    const torusMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x231530, // Lighter base color
        metalness: 0.7, 
        roughness: 0.2, 
        transmission: 0.9, 
        ior: 1.5, 
        thickness: 0.5, 
        side: THREE.DoubleSide
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.z = -2;
    scene.add(torus);

    // Render Loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        particlesMesh.rotation.y = elapsedTime * 0.03;
        particlesMesh.rotation.x = elapsedTime * 0.015;

        torus.rotation.y = elapsedTime * 0.15;
        torus.rotation.x = elapsedTime * 0.08;
        torus.position.y = Math.sin(elapsedTime * 0.5) * 0.1;

        const scrollY = window.scrollY;
        camera.position.y = -scrollY * 0.0008;

        renderer.render(scene, camera);
    }
    animate();

    // Responsive Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});