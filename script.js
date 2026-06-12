/* ============================================================
   TRAVEL MICROSITE — Globe Script  |  Three.js r128
   ============================================================ */
(function () {
  'use strict';

  /* ── All destinations ─────────────────────────────────── */
  var DESTINATIONS = [
    // Existing
    { name: 'Mumbai',        lat: 19.0760,  lon:  72.8777, url: 'mumbai.html' },
    { name: 'Nainital',      lat: 29.3803,  lon:  79.4636, url: 'nainital.html' },
    { name: 'Shillong',      lat: 25.5788,  lon:  91.8933, url: 'shillong.html' },
    // India – new
    { name: 'Delhi',         lat: 28.6139,  lon:  77.2090, url: 'delhi.html' },
    { name: 'Amritsar',      lat: 31.6340,  lon:  74.8723, url: 'amritsar.html' },
    { name: 'Kanpur',        lat: 26.4499,  lon:  80.3319, url: 'kanpur.html' },
    { name: 'Goa',           lat: 15.2993,  lon:  74.1240, url: 'goa.html' },
    { name: 'Bhubaneswar',   lat: 20.2961,  lon:  85.8245, url: 'bhubaneswar.html' },
    { name: 'Vizag',         lat: 17.6868,  lon:  83.2185, url: 'vizag.html' },
    { name: 'Bengaluru',     lat: 12.9716,  lon:  77.5946, url: 'bengaluru.html' },
    { name: 'Varanasi',      lat: 25.3176,  lon:  82.9739, url: 'varanasi.html' },
    { name: 'Lucknow',       lat: 26.8467,  lon:  80.9462, url: 'lucknow.html' },
    { name: 'Kolkata',       lat: 22.5726,  lon:  88.3639, url: 'kolkata.html' },
    { name: 'Dehradun',      lat: 30.3165,  lon:  78.0322, url: 'dehradun.html' },
    { name: 'Chandigarh',    lat: 30.7333,  lon:  76.7794, url: 'chandigarh.html' },
    { name: 'Chennai',       lat: 13.0827,  lon:  80.2707, url: 'chennai.html' },
    // Japan
    { name: 'Tokyo',         lat: 35.6762,  lon: 139.6503, url: 'tokyo.html' },
    { name: 'Kyoto',         lat: 35.0116,  lon: 135.7681, url: 'kyoto.html' },
    { name: 'Nara',          lat: 34.6851,  lon: 135.8048, url: 'nara.html' },
    { name: 'Lake Yamanaka', lat: 35.4122,  lon: 138.8680, url: 'lake-yamanaka.html' },
    { name: 'Nagoya',        lat: 35.1815,  lon: 136.9066, url: 'nagoya.html' },
  ];

  /* ── lat/lon → Three.js Vector3 ──────────────────────── */
  function ll2v(lat, lon, r) {
    var phi   = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ── Renderer / Scene / Camera ───────────────────────── */
  var canvas   = document.getElementById('globe-canvas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x05060a, 1);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 2.8;

  var targetZ    = 2.8;
  var MIN_Z      = 1.5;
  var MAX_Z      = 5.5;

  /* ── Lighting ────────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0x334466, 0.6));
  var sun = new THREE.DirectionalLight(0x8ab4f8, 1.4);
  sun.position.set(5, 3, 5);
  scene.add(sun);
  var rim = new THREE.DirectionalLight(0x4466aa, 0.3);
  rim.position.set(-5, -1, -3);
  scene.add(rim);

  /* ── Globe mesh ──────────────────────────────────────── */
  var R = 1.0;
  var tl = new THREE.TextureLoader();

  var globeGeo = new THREE.SphereGeometry(R, 72, 72);
  var globeMat = new THREE.MeshPhongMaterial({
    map:         tl.load('https://unpkg.com/three-globe@2.24.3/example/img/earth-blue-marble.jpg'),
    specularMap: tl.load('https://unpkg.com/three-globe@2.24.3/example/img/earth-water.png'),
    bumpMap:     tl.load('https://unpkg.com/three-globe@2.24.3/example/img/earth-topology.png'),
    bumpScale:   0.004,
    specular:    new THREE.Color(0x334466),
    shininess:   18
  });
  var globeMesh = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globeMesh);

  // Atmosphere layers
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.03, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.055 })
  ));
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.09, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x2255cc, transparent: true, opacity: 0.022, side: THREE.BackSide })
  ));

  /* ── Stars ───────────────────────────────────────────── */
  (function () {
    var n   = 4500;
    var pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var r = 200 + Math.random() * 300;
      var t = Math.random() * 2 * Math.PI;
      var p = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(p) * Math.cos(t);
      pos[i*3+1] = r * Math.cos(p);
      pos[i*3+2] = r * Math.sin(p) * Math.sin(t);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.45, transparent: true, opacity: 0.6, sizeAttenuation: true
    })));
  })();

  /* ── Pin markers ─────────────────────────────────────── */
  var pinGroup = new THREE.Group();
  globeMesh.add(pinGroup);
  var pinMeshes = [];

  DESTINATIONS.forEach(function (dest) {
    var pos = ll2v(dest.lat, dest.lon, R + 0.009);

    var dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x4f9cf9 })
    );
    dot.position.copy(pos);
    dot.userData.dest  = dest;
    dot.userData.rings = [];
    pinGroup.add(dot);
    pinMeshes.push(dot);

    // Two pulse rings per pin
    [0x4f9cf9, 0xa78bfa].forEach(function (col, i) {
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(0.019, 0.029, 24),
        new THREE.MeshBasicMaterial({
          color: col, transparent: true,
          opacity: i === 0 ? 0.65 : 0.38, side: THREE.DoubleSide
        })
      );
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.userData.phase    = Math.random() * Math.PI * 2 + i * Math.PI;
      ring.userData.baseOpac = i === 0 ? 0.65 : 0.38;
      pinGroup.add(ring);
      dot.userData.rings.push(ring);
    });
  });

  /* ── DOM refs ────────────────────────────────────────── */
  var tooltip  = document.getElementById('tooltip');
  var tipName  = document.getElementById('tooltip-name');
  var zoomInEl = document.getElementById('zoom-in');
  var zoomOutEl= document.getElementById('zoom-out');

  /* ── State ───────────────────────────────────────────── */
  var hoveredDest    = null;
  var isDragging     = false;
  var isPinching     = false;
  var dragMoved      = false;
  var prevMX = 0, prevMY = 0;
  var velX = 0, velY = 0;
  var DRAG_SPEED = 0.005;
  var INERTIA    = 0.91;

  // Pinch state
  var pinchStartDist = 0;
  var pinchStartZ    = 2.8;

  /* ── Mouse interaction ───────────────────────────────── */
  var raycaster = new THREE.Raycaster();
  var mouse     = new THREE.Vector2();

  function toNDC(cx, cy) {
    mouse.x =  (cx / window.innerWidth)  * 2 - 1;
    mouse.y = -(cy / window.innerHeight) * 2 + 1;
  }

  canvas.addEventListener('mousedown', function (e) {
    isDragging = true; dragMoved = false;
    prevMX = e.clientX; prevMY = e.clientY;
    velX = velY = 0;
  });
  window.addEventListener('mouseup', function () { isDragging = false; });

  window.addEventListener('mousemove', function (e) {
    if (isDragging) {
      var dx = e.clientX - prevMX;
      var dy = e.clientY - prevMY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      velX = dy * DRAG_SPEED;
      velY = dx * DRAG_SPEED;
      globeMesh.rotation.x += velX;
      globeMesh.rotation.y += velY;
      prevMX = e.clientX; prevMY = e.clientY;
      return;
    }
    // Hover detection
    toNDC(e.clientX, e.clientY);
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(pinMeshes);
    if (hits.length > 0) {
      hoveredDest = hits[0].object.userData.dest;
      tipName.textContent = hoveredDest.name;
      tooltip.style.left = e.clientX + 'px';
      tooltip.style.top  = e.clientY + 'px';
      tooltip.classList.add('show');
      canvas.style.cursor = 'pointer';
    } else {
      hoveredDest = null;
      tooltip.classList.remove('show');
      canvas.style.cursor = 'grab';
    }
  });

  window.addEventListener('click', function (e) {
    if (dragMoved) return;
    toNDC(e.clientX, e.clientY);
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(pinMeshes);
    if (hits.length > 0) {
      window.location.href = hits[0].object.userData.dest.url;
    }
  });

  /* ── Mouse wheel zoom ────────────────────────────────── */
  window.addEventListener('wheel', function (e) {
    targetZ = Math.max(MIN_Z, Math.min(MAX_Z, targetZ + e.deltaY * 0.003));
  }, { passive: true });

  /* ── Touch drag ──────────────────────────────────────── */
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      isDragging = true; isPinching = false; dragMoved = false;
      prevMX = e.touches[0].clientX; prevMY = e.touches[0].clientY;
      velX = velY = 0;
    } else if (e.touches.length === 2) {
      isPinching = true; isDragging = false;
      pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartZ = camera.position.z;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', function (e) {
    if (e.touches.length < 2) isPinching = false;
    if (e.touches.length === 0) isDragging = false;
  }, { passive: true });

  canvas.addEventListener('touchmove', function (e) {
    if (isPinching && e.touches.length === 2) {
      var dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      targetZ = Math.max(MIN_Z, Math.min(MAX_Z, pinchStartZ * (pinchStartDist / dist)));
      return;
    }
    if (!isDragging || e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - prevMX;
    var dy = e.touches[0].clientY - prevMY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
    velX = dy * DRAG_SPEED;
    velY = dx * DRAG_SPEED;
    globeMesh.rotation.x += velX;
    globeMesh.rotation.y += velY;
    prevMX = e.touches[0].clientX; prevMY = e.touches[0].clientY;
  }, { passive: true });

  /* ── Zoom buttons ────────────────────────────────────── */
  zoomInEl.addEventListener('click', function () {
    targetZ = Math.max(MIN_Z, targetZ - 0.4);
  });
  zoomOutEl.addEventListener('click', function () {
    targetZ = Math.min(MAX_Z, targetZ + 0.4);
  });

  /* ── Resize ──────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Animation loop ──────────────────────────────────── */
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    // Smooth zoom
    camera.position.z += (targetZ - camera.position.z) * 0.08;

    // Auto-rotate + inertia
    if (!isDragging && !isPinching) {
      globeMesh.rotation.y += 0.0009;
      velX *= INERTIA;
      velY *= INERTIA;
      globeMesh.rotation.x += velX;
      globeMesh.rotation.y += velY;
    }

    // Animate pulse rings
    pinMeshes.forEach(function (dot) {
      dot.userData.rings.forEach(function (ring) {
        var s = 1 + 0.9 * ((Math.sin(t * 1.55 + ring.userData.phase) + 1) / 2);
        ring.scale.set(s, s, s);
        ring.material.opacity = ring.userData.baseOpac * (1 - (s - 1) / 0.9);
      });
      var isHov = hoveredDest && dot.userData.dest.name === hoveredDest.name;
      dot.material.color.setHex(isHov ? 0xffffff : 0x4f9cf9);
      dot.scale.setScalar(isHov ? 1.7 : 1.0);
    });

    renderer.render(scene, camera);
  }

  animate();
})();
