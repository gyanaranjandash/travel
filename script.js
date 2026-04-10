/* ============================================================
   TRAVEL MICROSITE — Globe Script
   Three.js r128 — Vanilla JS
   ============================================================ */

(function () {
  'use strict';

  // ── Destination data ──────────────────────────────────────
  const DESTINATIONS = [
    {
      name: 'Nainital',
      lat: 29.3803,
      lon: 79.4636,
      url: 'nainital.html',
      desc: 'Lake town in the Kumaon Himalayas'
    },
    {
      name: 'Shillong',
      lat: 25.5788,
      lon: 91.8933,
      url: 'shillong.html',
      desc: 'Scotland of the East'
    },
    {
      name: 'Mumbai',
      lat: 19.0760,
      lon: 72.8777,
      url: 'mumbai.html',
      desc: 'The city that never sleeps'
    }
  ];

  // ── Coordinate conversion ─────────────────────────────────
  function latLonToVec3(lat, lon, radius) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
       radius * Math.cos(phi),
       radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  // ── Scene setup ───────────────────────────────────────────
  const canvas   = document.getElementById('globe-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x05060a, 1);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 2.8;

  // ── Lighting ──────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0x334466, 0.6);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0x8ab4f8, 1.4);
  sun.position.set(5, 3, 5);
  scene.add(sun);

  const rim = new THREE.DirectionalLight(0x4466aa, 0.3);
  rim.position.set(-5, -1, -3);
  scene.add(rim);

  // ── Globe ─────────────────────────────────────────────────
  const GLOBE_RADIUS = 1.0;

  const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

  // Earth texture from NASA/public CDN
  const texLoader  = new THREE.TextureLoader();
  const earthTex   = texLoader.load(
    'https://unpkg.com/three-globe@2.24.3/example/img/earth-blue-marble.jpg',
    undefined, undefined,
    () => {
      // Fallback gradient material if texture fails
      globeMesh.material = new THREE.MeshPhongMaterial({
        color: 0x1a3a6e,
        shininess: 20,
        specular: 0x224488
      });
    }
  );
  const specTex = texLoader.load('https://unpkg.com/three-globe@2.24.3/example/img/earth-water.png');
  const bumpTex = texLoader.load('https://unpkg.com/three-globe@2.24.3/example/img/earth-topology.png');

  const globeMat = new THREE.MeshPhongMaterial({
    map:         earthTex,
    specularMap: specTex,
    bumpMap:     bumpTex,
    bumpScale:   0.004,
    specular:    new THREE.Color(0x334466),
    shininess:   18
  });

  const globeMesh = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globeMesh);

  // ── Atmosphere glow ───────────────────────────────────────
  const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.03, 64, 64);
  const atmosMat = new THREE.MeshPhongMaterial({
    color:       0x4488ff,
    transparent: true,
    opacity:     0.06,
    side:        THREE.FrontSide
  });
  const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
  scene.add(atmosMesh);

  // Outer glow ring
  const outerGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 64, 64);
  const outerMat = new THREE.MeshPhongMaterial({
    color:       0x2255cc,
    transparent: true,
    opacity:     0.025,
    side:        THREE.BackSide
  });
  scene.add(new THREE.Mesh(outerGeo, outerMat));

  // ── Stars ─────────────────────────────────────────────────
  function buildStars(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r     = 200 + Math.random() * 300;
      const theta = Math.random() * 2 * Math.PI;
      const phi   = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size:  0.5,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true
    });
    return new THREE.Points(geo, mat);
  }
  scene.add(buildStars(4000));

  // ── Pin group ─────────────────────────────────────────────
  const pinGroup = new THREE.Group();
  globeMesh.add(pinGroup);

  const pinMeshes = []; // { mesh, ring, dest }

  DESTINATIONS.forEach(dest => {
    const pos = latLonToVec3(dest.lat, dest.lon, GLOBE_RADIUS + 0.008);

    // Core dot
    const dotGeo = new THREE.SphereGeometry(0.018, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x4f9cf9 });
    const dot    = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    dot.userData.dest = dest;
    pinGroup.add(dot);
    pinMeshes.push(dot);

    // Pulse ring 1
    const ring1Geo = new THREE.RingGeometry(0.022, 0.034, 24);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color:       0x4f9cf9,
      transparent: true,
      opacity:     0.6,
      side:        THREE.DoubleSide
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.position.copy(pos);
    ring1.lookAt(new THREE.Vector3(0, 0, 0));
    ring1.userData.baseScale = 1;
    ring1.userData.phase = Math.random() * Math.PI * 2;
    pinGroup.add(ring1);

    // Pulse ring 2 (offset phase)
    const ring2Geo = new THREE.RingGeometry(0.022, 0.034, 24);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color:       0xa78bfa,
      transparent: true,
      opacity:     0.35,
      side:        THREE.DoubleSide
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.position.copy(pos);
    ring2.lookAt(new THREE.Vector3(0, 0, 0));
    ring2.userData.phase = ring1.userData.phase + Math.PI;
    pinGroup.add(ring2);

    dot.userData.rings = [ring1, ring2];
  });

  // ── Raycaster for interaction ─────────────────────────────
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();
  const tooltip   = document.getElementById('tooltip');
  const tipName   = document.getElementById('tooltip-name');

  let hoveredDest = null;

  function updateMouse(e) {
    const x = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
    const y = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
    mouse.x =  (x / window.innerWidth)  * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    return { x, y };
  }

  window.addEventListener('mousemove', e => {
    const { x, y } = updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(pinMeshes);
    if (hits.length > 0) {
      const dest = hits[0].object.userData.dest;
      hoveredDest = dest;
      tipName.textContent = dest.name;
      tooltip.style.left = x + 'px';
      tooltip.style.top  = y + 'px';
      tooltip.classList.add('show');
      canvas.style.cursor = 'pointer';
    } else {
      hoveredDest = null;
      tooltip.classList.remove('show');
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    }
  });

  window.addEventListener('click', e => {
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(pinMeshes);
    if (hits.length > 0) {
      const dest = hits[0].object.userData.dest;
      window.location.href = dest.url;
    }
  });

  // ── Drag to rotate ────────────────────────────────────────
  let isDragging    = false;
  let prevMouseX    = 0;
  let prevMouseY    = 0;
  let velX          = 0;
  let velY          = 0;
  const DRAG_SPEED  = 0.005;
  const INERTIA     = 0.92;

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    velX = velY = 0;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    velX = dy * DRAG_SPEED;
    velY = dx * DRAG_SPEED;
    globeMesh.rotation.x += velX;
    globeMesh.rotation.y += velY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  // Touch drag
  canvas.addEventListener('touchstart', e => {
    isDragging = true;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
    velX = velY = 0;
  }, { passive: true });

  canvas.addEventListener('touchend', () => { isDragging = false; });

  canvas.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - prevMouseX;
    const dy = e.touches[0].clientY - prevMouseY;
    velX = dy * DRAG_SPEED;
    velY = dx * DRAG_SPEED;
    globeMesh.rotation.x += velX;
    globeMesh.rotation.y += velY;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  }, { passive: true });

  // ── Scroll to zoom ────────────────────────────────────────
  window.addEventListener('wheel', e => {
    camera.position.z = Math.max(1.8, Math.min(5.0, camera.position.z + e.deltaY * 0.003));
  }, { passive: true });

  // ── Resize ────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animate ───────────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Auto-rotate when not dragging
    if (!isDragging) {
      globeMesh.rotation.y += 0.0012;
      // Inertia
      velX *= INERTIA;
      velY *= INERTIA;
    }

    // Pulse rings
    pinMeshes.forEach(dot => {
      dot.userData.rings.forEach((ring, i) => {
        const phase = ring.userData.phase;
        const s = 1 + 0.9 * ((Math.sin(t * 1.6 + phase) + 1) / 2);
        ring.scale.set(s, s, s);
        ring.material.opacity = 0.6 * (1 - (s - 1) / 0.9);
      });
    });

    // Hover highlight
    pinMeshes.forEach(dot => {
      const isHovered = hoveredDest && dot.userData.dest.name === hoveredDest.name;
      dot.material.color.setHex(isHovered ? 0xffffff : 0x4f9cf9);
      dot.scale.setScalar(isHovered ? 1.5 : 1.0);
    });

    renderer.render(scene, camera);
  }

  animate();
})();
