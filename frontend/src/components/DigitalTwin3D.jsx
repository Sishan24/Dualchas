import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, RotateCcw, Sun, Eye, Info, Sparkles, Compass } from 'lucide-react';

export default function DigitalTwin3D() {
  const mountRef = useRef(null);
  const [monumentId, setMonumentId] = useState('konark_sun_temple');
  const [activeLayer, setActiveLayer] = useState('all'); // 'all', 'crack', 'spall', 'veg', 'erosion'
  const [loading, setLoading] = useState(true);
  const [meshStats, setMeshStats] = useState(null);
  const [lightingMode, setLightingMode] = useState('daylight'); // 'daylight', 'golden', 'dusk'

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const originalColorsRef = useRef(null);
  const lightsRef = useRef([]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFBF9F5);
    sceneRef.current = scene;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    // Subtle Ground Shadow Plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add Architectural Grid Helper
    const grid = new THREE.GridHelper(30, 30, 0xEA580C, 0xE7E5E4);
    grid.position.y = 0;
    scene.add(grid);

    // Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xE7E5E4, 0.7);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFF7ED, 1.2);
    dirLight.position.set(15, 25, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xFFEDD5, 0.5);
    scene.add(ambientLight);

    lightsRef.current = [hemiLight, dirLight, ambientLight];

    // Orbit Controls (Simple implementation)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 24, theta: 0.3, phi: 1.2 };

    const updateCameraPosition = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 5.0, 0);
    };
    updateCameraPosition();

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.008));
      updateCameraPosition();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(8, Math.min(45, spherical.radius + e.deltaY * 0.02));
      updateCameraPosition();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (meshRef.current && !isDragging) {
        // Slow continuous architectural spin
        meshRef.current.rotation.y += 0.0015;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Fetch and load 3D model
    loadModelData(monumentId);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const loadModelData = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/3d-model/${id}`);
      if (!res.ok) throw new Error('Model fetch failed');
      const json = await res.json();

      const loader = new THREE.BufferGeometryLoader();
      const geometry = loader.parse(json.data);
      geometry.computeVertexNormals();

      // Store original vertex colors
      const colorAttr = geometry.getAttribute('color');
      if (colorAttr) {
        originalColorsRef.current = new Float32Array(colorAttr.array);
      }

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      if (meshRef.current && sceneRef.current) {
        sceneRef.current.remove(meshRef.current);
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshRef.current = mesh;
      sceneRef.current.add(mesh);

      setMeshStats({
        triangles: geometry.attributes.position.count / 3,
        annotations: json.annotation_count || 142,
        monument: id === 'konark_sun_temple' ? 'Konark Sun Temple' : 'Darbhanga Fort',
      });
    } catch (err) {
      console.error('Failed loading 3D twin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonumentChange = (id) => {
    setMonumentId(id);
    loadModelData(id);
  };

  // Filter 3D Damage Layers
  const filterDamageLayer = (layer) => {
    setActiveLayer(layer);
    if (!meshRef.current || !originalColorsRef.current) return;

    const geometry = meshRef.current.geometry;
    const colorAttr = geometry.getAttribute('color');
    const orig = originalColorsRef.current;
    const current = colorAttr.array;

    for (let i = 0; i < orig.length; i += 3) {
      const r = orig[i];
      const g = orig[i + 1];
      const b = orig[i + 2];

      const isCrack = r > 0.85 && g < 0.35;
      const isSpall = r > 0.85 && g > 0.55 && b < 0.15;
      const isVeg = g > 0.65 && r < 0.2;
      const isErosion = b > 0.85;

      let keep = true;
      if (layer === 'crack') keep = isCrack;
      else if (layer === 'spall') keep = isSpall;
      else if (layer === 'veg') keep = isVeg;
      else if (layer === 'erosion') keep = isErosion;

      if (keep || (!isCrack && !isSpall && !isVeg && !isErosion)) {
        current[i] = orig[i];
        current[i + 1] = orig[i + 1];
        current[i + 2] = orig[i + 2];
      } else {
        // Fade to base stone
        current[i] = 0.76;
        current[i + 1] = 0.58;
        current[i + 2] = 0.42;
      }
    }
    colorAttr.needsUpdate = true;
  };

  return (
    <div className="space-y-6">
      {/* 3D Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel bg-white/90">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-600" />
            Module C · Structure from Motion & Point Cloud Mesh
          </span>
          <h2 className="text-2xl font-bold text-stone-900">3D Heritage Digital Twin & Damage Mapping</h2>
        </div>

        {/* Monument Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMonumentChange('konark_sun_temple')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              monumentId === 'konark_sun_temple'
                ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/20'
                : 'bg-white text-stone-700 border-stone-200 hover:border-orange-400'
            }`}
          >
            Konark Sun Temple
          </button>
          <button
            onClick={() => handleMonumentChange('darbhanga_fort')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              monumentId === 'darbhanga_fort'
                ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/20'
                : 'bg-white text-stone-700 border-stone-200 hover:border-orange-400'
            }`}
          >
            Darbhanga Fort
          </button>
        </div>
      </div>

      {/* 3D Viewport Box */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden glass-panel border border-orange-200/80 shadow-2xl shadow-orange-500/10">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-orange-400 border-t-orange-600 animate-spin"></div>
            <p className="text-sm font-bold text-stone-800">Reconstructing Photogrammetric 3D Twin...</p>
          </div>
        )}

        {/* Top-Right Floating Damage Layer Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200 shadow-lg text-xs font-semibold">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider px-2 py-0.5">3D Damage Filter</span>
          {[
            { id: 'all', label: 'All Mapped Damage', color: 'bg-orange-500' },
            { id: 'crack', label: 'Cracks (Red)', color: 'bg-red-500' },
            { id: 'spall', label: 'Spalling (Amber)', color: 'bg-amber-500' },
            { id: 'veg', label: 'Vegetation (Emerald)', color: 'bg-emerald-500' },
            { id: 'erosion', label: 'Erosion (Blue)', color: 'bg-blue-500' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => filterDamageLayer(l.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition text-left ${
                activeLayer === l.id ? 'bg-orange-100 text-orange-950 font-bold' : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`}></span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        {/* Bottom Floating Stats Pill */}
        {meshStats && (
          <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200 shadow-lg text-xs text-stone-700 flex flex-wrap items-center gap-4">
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Structure</span>
              <strong className="text-stone-900">{meshStats.monument}</strong>
            </div>
            <div className="h-6 w-px bg-stone-200"></div>
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Mesh Triangles</span>
              <strong>{meshStats.triangles} faces</strong>
            </div>
            <div className="h-6 w-px bg-stone-200"></div>
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Ray-Cast Annotations</span>
              <strong className="text-emerald-700">{meshStats.annotations} points</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
