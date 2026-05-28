document.addEventListener("DOMContentLoaded", () => {
    // 1. Smooth Scrolling (Lenis)
    const lenis = new Lenis({ 
        duration: 1.2, 
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) 
    });
    
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. Custom Cursor Physics
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const glow = document.getElementById('cursor-glow');

    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        
        // Slight delay for ring and glow to create physics feel
        setTimeout(() => {
            ring.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        }, 50);
        
        setTimeout(() => {
            glow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        }, 100);
    });

    // 3. GSAP Narrative Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    // Initial Hero Sequence
    const tl = gsap.timeline();
    tl.to("#hero-quote", { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out", delay: 0.2 })
      .to("#hero-badge", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=1")
      .to("#hero-title", { opacity: 1, y: 0, duration: 1.2, ease: "power4.out" }, "-=0.8")
      .to("#hero-line", { width: "4rem", duration: 1.5, ease: "power2.inOut" }, "-=0.5")
      .to("#hero-desc", { opacity: 1, duration: 1 }, "-=1")
      .to("#command-bar", { opacity: 1, y: 0, duration: 1, ease: "back.out(1.7)" }, "-=0.5");

    // Spatial Grid Parallax (Neon Bull)
    gsap.to(".bento-card", { y: -30, scrollTrigger: { trigger: "#grid-neonbull", start: "top bottom", end: "bottom top", scrub: 1 }});
    gsap.to(".bento-card-fast", { y: -60, scrollTrigger: { trigger: "#grid-neonbull", start: "top bottom", end: "bottom top", scrub: 1.5 }});

    // Zeon Reveal Parallax
    gsap.fromTo(".zeon-card", 
        { y: 50, opacity: 0.8 }, 
        { y: -30, opacity: 1, scrollTrigger: { trigger: "#grid-zeon", start: "top bottom", end: "bottom top", scrub: 1 }}
    );

    // Cinematic Grid Scroll Animations (Moodfilm)
    gsap.to(".cinema-card", { y: -50, rotation: -2, scrollTrigger: { trigger: "#cinema-grid", start: "top bottom", end: "bottom top", scrub: 1 }});
    gsap.to(".cinema-card-fast", { y: -80, rotation: 2, scrollTrigger: { trigger: "#cinema-grid", start: "top bottom", end: "bottom top", scrub: 1.5 }});
    gsap.to(".cinema-card-slow", { scale: 1.05, scrollTrigger: { trigger: "#cinema-grid", start: "top bottom", end: "bottom top", scrub: 2 }});


    // 4. Three.js Background (Volumetric Particle Field & Ambient Core)
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    // Cinematic Lighting
    const dirLight1 = new THREE.DirectionalLight(0x6d28d9, 0.8); // Deep Purple
    dirLight1.position.set(10, 10, 5);
    scene.add(dirLight1);
    
    const dirLight2 = new THREE.DirectionalLight(0xc9a84c, 0.4); // Pale Gold
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    // Ambient Data Stream (Particles)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1200;
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 12;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.015, color: 0xc9a84c, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // AI Core (Holographic Torus)
    const torusGeometry = new THREE.TorusGeometry(1.5, 0.4, 16, 100);
    const torusMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x160f20, metalness: 0.9, roughness: 0.1, transmission: 0.9, ior: 1.5, thickness: 0.5, side: THREE.DoubleSide
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.z = -2;
    scene.add(torus);

    // Render Loop with Scroll Parallax Integration
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Slow atmospheric rotation
        particlesMesh.rotation.y = elapsedTime * 0.03;
        particlesMesh.rotation.x = elapsedTime * 0.015;

        // Core AI processing effect
        torus.rotation.y = elapsedTime * 0.15;
        torus.rotation.x = elapsedTime * 0.08;
        torus.position.y = Math.sin(elapsedTime * 0.5) * 0.1;

        // Map Lens scroll position to Three.js camera position
        const scrollY = window.scrollY;
        camera.position.y = -scrollY * 0.0008; // subtle parallax depth

        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});