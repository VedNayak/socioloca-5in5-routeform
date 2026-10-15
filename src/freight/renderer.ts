import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createCargoModel, createStudioCamera, disposeTree } from "./model";

export type FreightRenderer = {
  progress: (value: number) => void;
  pause: (paused: boolean) => void;
  video: (video: HTMLVideoElement) => void;
  dispose: () => void;
};
type Options = {
  canvas: HTMLCanvasElement;
  context: WebGL2RenderingContext;
  poster: HTMLImageElement;
  onReady: () => void;
  onError: () => void;
  onNodes: (
    nodes: { id: string; x: number; y: number; front: boolean }[],
  ) => void;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const geo = (lat: number, lon: number, radius: number) => {
  const a = (lat * Math.PI) / 180,
    b = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(a) * Math.sin(b),
    Math.sin(a),
    Math.cos(a) * Math.cos(b),
  ).multiplyScalar(radius);
};

export async function createFreightRenderer(
  host: HTMLDivElement,
  options: Options,
): Promise<FreightRenderer> {
  const mobile = host.clientWidth < 821;
  const renderer = new THREE.WebGLRenderer({
    canvas: options.canvas,
    context: options.context,
    antialias: !mobile,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.autoClear = false;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const scene = new THREE.Scene(),
    hud = new THREE.Scene(),
    hudCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const camera = createStudioCamera(host.clientWidth, host.clientHeight);
  const cargo = createCargoModel();
  scene.add(cargo.root);
  const room = new RoomEnvironment(),
    pmrem = new THREE.PMREMGenerator(renderer),
    environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf6f5ee, 0x9a8069, 2));
  const sun = new THREE.DirectionalLight(0xffe9d0, 4);
  sun.position.set(-4, 12, 10);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -20,
    right: 20,
    top: 20,
    bottom: -20,
  });
  scene.add(sun);
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.16 });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    shadowMaterial,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = mobile ? -4 : 0;
  floor.receiveShadow = true;
  scene.add(floor);
  const loader = new THREE.TextureLoader();
  let image: THREE.Texture, land: THREE.Texture;
  try {
    [image, land] = await Promise.all([
      options.poster.decode().then(() => {
        const texture = new THREE.Texture(options.poster);
        texture.needsUpdate = true;
        return texture;
      }),
      loader.loadAsync("/images/globe-land-mask.png"),
    ]);
  } catch (error) {
    renderer.dispose();
    renderer.domElement.remove();
    disposeTree(scene);
    environment.dispose();
    throw error;
  }
  image.colorSpace = THREE.SRGBColorSpace;
  const mouse = new THREE.Vector2(3, 3),
    pointerTarget = new THREE.Vector2(3, 3);
  const plateUniforms = {
    uImage: { value: image },
    uPeel: { value: 0 },
    uAspect: { value: host.clientWidth / host.clientHeight },
    uImageAspect: {
      value:
        (image.image as HTMLImageElement).naturalWidth /
        (image.image as HTMLImageElement).naturalHeight,
    },
    uPointer: { value: mouse },
    uTime: { value: 0 },
  };
  const plateMaterial = new THREE.ShaderMaterial({
    uniforms: plateUniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `uniform sampler2D uImage;uniform float uPeel,uAspect,uImageAspect,uTime;uniform vec2 uPointer;varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec2 uv=vUv;float ratio=uAspect/uImageAspect;if(ratio<1.)uv.x=(uv.x-.5)*ratio+.5;else uv.y=(uv.y-.5)/ratio+.5;
    float distanceToPointer=length(vUv*2.-1.-uPointer);uv+=sin(uTime+vUv.yx*12.)*.0015*exp(-distanceToPointer*8.);
    vec4 color=texture2D(uImage,uv);float cell=hash(floor(vUv*vec2(210.,135.)));float threshold=(1.-vUv.x)*.66+vUv.y*.2+cell*.14;
    float alpha=1.-smoothstep(threshold-.026,threshold+.026,uPeel);float rim=(1.-smoothstep(0.,.016,abs(threshold-uPeel)))*step(.01,uPeel)*step(uPeel,.99);
    color.rgb=mix(color.rgb,vec3(1.,.30,.065),rim*.8);gl_FragColor=vec4(color.rgb,alpha);
    #include <colorspace_fragment>
    }`,
  });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), plateMaterial);
  hud.add(plate);
  const count = mobile ? 6500 : 16000;
  const cargoPoints = new Float32Array(count * 3),
    burstPoints = new Float32Array(count * 3),
    globePoints = new Float32Array(count * 3),
    seeds = new Float32Array(count),
    uvs = new Float32Array(count * 2);
  let seed = 739;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const face = i % 6,
      x = (random() - 0.5) * 12.19,
      y = random() * 2.6 + 1.2,
      z = (random() - 0.5) * 2.44;
    cargoPoints.set(
      [
        face < 2 ? (face === 0 ? -6.1 : 6.1) : x,
        face >= 2 && face < 4 ? (face === 2 ? 1.2 : 3.8) : y,
        face >= 4 ? (face === 4 ? -1.23 : 1.23) : z,
      ],
      i * 3,
    );
    const theta = random() * Math.PI * 2,
      r = 2 + random() * 8;
    burstPoints.set(
      [
        Math.cos(theta) * r,
        1.8 + (random() - 0.5) * 8,
        Math.sin(theta) * r * 0.55,
      ],
      i * 3,
    );
    const latitude = Math.asin(1 - (2 * (i + 0.5)) / count),
      longitude =
        ((i * Math.PI * (3 - Math.sqrt(5))) % (Math.PI * 2)) - Math.PI;
    const point = new THREE.Vector3(
      Math.cos(latitude) * Math.sin(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.cos(longitude),
    ).multiplyScalar(4.2);
    point.y += 2.6;
    globePoints.set(point.toArray(), i * 3);
    uvs.set([longitude / (Math.PI * 2) + 0.5, latitude / Math.PI + 0.5], i * 2);
    seeds[i] = random();
  }
  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(cargoPoints, 3),
  );
  particlesGeometry.setAttribute(
    "aBurst",
    new THREE.BufferAttribute(burstPoints, 3),
  );
  particlesGeometry.setAttribute(
    "aGlobe",
    new THREE.BufferAttribute(globePoints, 3),
  );
  particlesGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  particlesGeometry.setAttribute("aEarthUV", new THREE.BufferAttribute(uvs, 2));
  const particleUniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uPointer: { value: mouse },
    uDpr: { value: renderer.getPixelRatio() },
    uLand: { value: land },
  };
  const particlesMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: particleUniforms,
    vertexShader: `attribute vec3 aBurst,aGlobe;attribute float aSeed;attribute vec2 aEarthUV;uniform float uProgress,uTime,uDpr;uniform vec2 uPointer;varying float vSeed,vGlobe,vFacing;varying vec2 vEarthUV;
    void main(){float burst=smoothstep(.34,.57,uProgress),globe=smoothstep(.59,.82,uProgress);vec3 p=mix(position,aBurst,burst);p=mix(p,aGlobe,globe);float wave=sin(uTime*.35+aSeed*20.);p+=vec3(sin(aSeed*40.+uTime*.2),wave,cos(aSeed*30.+uTime*.2))*.18*burst*(1.-globe);
    vec4 projected=projectionMatrix*modelViewMatrix*vec4(p,1.);vec2 ndc=projected.xy/projected.w;float repel=exp(-length(ndc-uPointer)*16.);p+=normalize(vec3(ndc-uPointer,.3))*repel*.65*burst;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);float large=step(.989,aSeed)*(1.-globe)*burst;gl_PointSize=uDpr*mix(1.6+1.8*aSeed,30.+25.*aSeed,large);vSeed=aSeed;vGlobe=globe;vEarthUV=aEarthUV;vFacing=smoothstep(-.1,.7,(mat3(modelViewMatrix)*normalize(aGlobe-vec3(0.,2.6,0.))).z);}`,
    fragmentShader: `uniform float uOpacity;uniform sampler2D uLand;varying float vSeed,vGlobe,vFacing;varying vec2 vEarthUV;
    void main(){float dist=length(gl_PointCoord-.5);if(dist>.5)discard;float continent=texture2D(uLand,vEarthUV).r;float intensity=mix(1.,mix(.025,1.,continent),vGlobe);vec3 color=mix(vec3(.64,.80,.80),vec3(1.,.28,.065),step(.83,vSeed));float soft=1.-smoothstep(.12,.5,dist);float sparse=mix(mix(.12,.58,step(.62,vSeed)),1.,vGlobe);float alpha=soft*uOpacity*intensity*mix(.55,.95,continent*vGlobe)*mix(1.,mix(.035,1.,vFacing),vGlobe)*sparse;if(vSeed>.989&&vGlobe<.8)alpha*=.14;gl_FragColor=vec4(color,alpha);}`,
  });
  const points = new THREE.Points(particlesGeometry, particlesMaterial);
  points.frustumCulled = false;
  const world = new THREE.Group();
  world.position.copy(cargo.root.position);
  world.add(points);
  scene.add(world);
  const cities = [
    { id: "dubai", lat: 25.2048, lon: 55.2708 },
    { id: "hong-kong", lat: 22.3193, lon: 114.1694 },
  ];
  const cityPositions = cities.map((c) =>
    geo(c.lat, c.lon, 4.26).add(new THREE.Vector3(0, 2.6, 0)),
  );
  const routePoints: THREE.Vector3[] = [];
  const start = geo(cities[0].lat, cities[0].lon, 1),
    end = geo(cities[1].lat, cities[1].lon, 1),
    angle = start.angleTo(end);
  for (let i = 0; i <= 90; i++) {
    const t = i / 90,
      point = start
        .clone()
        .multiplyScalar(Math.sin((1 - t) * angle))
        .add(end.clone().multiplyScalar(Math.sin(t * angle)))
        .divideScalar(Math.sin(angle))
        .multiplyScalar(4.3 + Math.sin(Math.PI * t) * 0.75);
    point.y += 2.6;
    routePoints.push(point);
  }
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff6331,
    transparent: true,
    opacity: 0,
  });
  const route = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(routePoints),
    lineMaterial,
  );
  world.add(route);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0xff7139,
    transparent: true,
    opacity: 0,
  });
  for (const position of cityPositions) {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 12, 8),
      nodeMaterial,
    );
    node.position.copy(position);
    world.add(node);
  }
  const moving = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    }),
  );
  world.add(moving);
  const ringMaterial = new THREE.LineBasicMaterial({
    color: 0x819d9d,
    transparent: true,
    opacity: 0,
  });
  for (const tilt of [0, Math.PI / 2, -1]) {
    const coordinates = [];
    for (let i = 0; i <= 120; i++) {
      const theta = (i / 120) * Math.PI * 2;
      coordinates.push(
        new THREE.Vector3(
          Math.cos(theta) * 4.34,
          Math.sin(theta) * 4.34 + 2.6,
          0,
        ),
      );
    }
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(coordinates),
      ringMaterial,
    );
    if (tilt === -1) { ring.position.y = 2.6; ring.geometry.translate(0, -2.6, 0); ring.rotation.x = Math.PI / 2; }
    else ring.rotation.y = tilt;
    world.add(ring);
  }
  let progress = 0,
    time = 0,
    paused = false,
    disposed = false,
    inView = true,
    last = 0,
    renderedProgress = -1,
    frame = 0,
    videoTexture: THREE.VideoTexture | undefined;
  const pale = new THREE.Color("#ece9e1"),
    dark = new THREE.Color("#09151c");
  const cargoOrange = new THREE.Color(0xd65321),
    scannedSteel = new THREE.Color(0x20343a);
  const resize = () => {
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    const halfHeight =
      (mobile ? 8.5 : 6.9) *
      Math.min(1, plateUniforms.uImageAspect.value / (width / height));
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.left = (-halfHeight * width) / height;
    camera.right = -camera.left;
    camera.updateProjectionMatrix();
    plateUniforms.uAspect.value = width / height;
    if (width < 821) {
      cargo.root.position.set(0.4, -2.2, 0);
      cargo.root.scale.setScalar(0.62);
      world.position.set(0.3, -1.3, 0);
      world.scale.setScalar(0.68);
    } else {
      cargo.root.position.set(3.5, 0, 0);
      world.position.copy(cargo.root.position);
    }
    render(0);
  };
  const render = (timestamp: number) => {
    if (disposed) return;
    if (timestamp) {
      frame = requestAnimationFrame(render);
      if (!inView || document.hidden) return;
      if (
        paused &&
        renderedProgress === progress &&
        mouse.distanceTo(pointerTarget) < 0.0001
      )
        return;
      if (timestamp - last < (mobile ? 32 : 16)) return;
      if (!paused) time += Math.min((timestamp - last) / 1000, 0.05);
      last = timestamp;
    }
    mouse.lerp(pointerTarget, 0.09);
    // Push into the registered cargo only after the beauty plate has peeled away.
    // Return to the original lens before the geographic sphere and projected city buttons.
    const macro = smooth(.28, .44, progress) * (1 - smooth(.55, .72, progress));
    camera.zoom = 1 + macro * (mobile ? .22 : .8);
    camera.lookAt(macro * (mobile ? .5 : 2.1), 2.6 + macro * .25, 0);
    camera.updateProjectionMatrix();
    const darken = smooth(0.12, 0.33, progress);
    host.style.backgroundColor = pale.clone().lerp(dark, darken).getStyle();
    plateUniforms.uPeel.value = clamp((progress - 0.12) / 0.2);
    plateUniforms.uTime.value = time;
    plateUniforms.uImage.value =
      videoTexture && progress < 0.1 ? videoTexture : image;
    const solidOpacity =
      (1 - smooth(0.33, 0.57, progress)) * smooth(0.1, 0.23, progress);
    cargo.materials[0].color
      .copy(cargoOrange)
      .lerp(scannedSteel, smooth(0.22, 0.41, progress));
    for (const material of cargo.materials) material.opacity = solidOpacity;
    cargo.cableMaterial.opacity = solidOpacity;
    cargo.solid.visible = solidOpacity > 0.003;
    cargo.lattice.visible = progress > 0.12 && progress < 0.7;
    cargo.wire.opacity =
      smooth(0.13, 0.28, progress) * (1 - smooth(0.49, 0.7, progress)) * 0.8;
    const explosion = smooth(0.31, 0.59, progress);
    for (const part of cargo.parts)
      part.group.position
        .copy(part.home)
        .addScaledVector(part.direction, explosion);
    for (const edge of cargo.lattice.children) {
      const owner = edge.userData.owner as THREE.Object3D | undefined,
        offset = edge.userData.offset as THREE.Vector3 | undefined;
      if (owner && offset) edge.position.copy(offset).add(owner.position);
    }
    cargo.root.rotation.y =
      -smooth(0.2, 0.59, progress) * 0.28 +
      (progress > 0.21 && Math.abs(mouse.x) <= 1 && Math.abs(mouse.y) <= 1
        ? mouse.x * 0.025
        : 0);
    shadowMaterial.opacity = 0.16 * (1 - smooth(0.12, 0.3, progress));
    floor.visible = progress < 0.3;
    particleUniforms.uProgress.value = progress;
    particleUniforms.uTime.value = time;
    particleUniforms.uOpacity.value = smooth(0.18, 0.36, progress);
    const globeBlend = smooth(0.59, 0.82, progress);
    world.position.copy(cargo.root.position);
    world.scale.copy(cargo.root.scale);
    if (mobile) {
      world.position.lerp(new THREE.Vector3(0.3, -1.3, 0), globeBlend);
      world.scale.lerp(new THREE.Vector3(0.68, 0.68, 0.68), globeBlend);
    }
    world.rotation.y = THREE.MathUtils.lerp(
      cargo.root.rotation.y,
      -0.28,
      globeBlend,
    );
    const globe = smooth(0.69, 0.85, progress);
    lineMaterial.opacity = globe;
    nodeMaterial.opacity = globe;
    ringMaterial.opacity = globe * 0.2;
    moving.material.opacity = globe;
    const index = Math.floor(((time * 0.12) % 1) * 90);
    moving.position.lerpVectors(
      routePoints[index],
      routePoints[Math.min(90, index + 1)],
      ((time * 0.12) % 1) * 90 - index,
    );
    renderer.clear();
    if (progress < 0.35) renderer.render(hud, hudCamera);
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderedProgress = progress;
    if (globe > 0.05) {
      world.updateMatrixWorld();
      options.onNodes(
        cityPositions.map((p, i) => {
          const projected = p
            .clone()
            .applyMatrix4(world.matrixWorld)
            .project(camera);
          return {
            id: cities[i].id,
            x: (projected.x * 0.5 + 0.5) * host.clientWidth,
            y: (-0.5 * projected.y + 0.5) * host.clientHeight,
            front: true,
          };
        }),
      );
    }
  };
  const move = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointerTarget.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2,
    );
  };
  const leave = () => pointerTarget.set(3, 3);
  const lost = (event: Event) => {
    event.preventDefault();
    options.onError();
  };
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
    },
    { rootMargin: "150px" },
  );
  observer.observe(host);
  const sizing = new ResizeObserver(resize);
  sizing.observe(host);
  resize();
  await renderer.compileAsync(scene, camera);
  if (!disposed) {
    options.onReady();
    frame = requestAnimationFrame(render);
  }
  return {
    progress: (value) => {
      progress = clamp(value);
      if (paused) render(0);
    },
    pause: (value) => {
      paused = value;
    },
    video: (element) => {
      videoTexture?.dispose();
      videoTexture = new THREE.VideoTexture(element);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      plateUniforms.uImage.value = videoTexture;
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizing.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeTree(scene);
      disposeTree(hud);
      image.dispose();
      land.dispose();
      videoTexture?.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
