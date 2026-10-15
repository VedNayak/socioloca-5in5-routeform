import * as T from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createHeroStudy, type OpeningKind } from "./hero-study";
import { disposeVehicle } from "./vehicles";
import { createOpeningAssembly } from "./opening-assembly";
import { createOpeningFormation } from "./opening-formation";
export type { OpeningKind } from "./hero-study";
export type OpeningRenderer = {
  update: (p: number) => void;
  pause: (p: boolean) => void;
  visible: (v: boolean) => void;
  dispose: () => void;
};
type Options = { onReady: () => void; onError: () => void };
const smooth = (a: number, b: number, value: number) => {
  const x = T.MathUtils.clamp((value - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
type Window = { l: number; r: number; t: number; b: number };
const blend = (a: Window, b: Window, amount: number): Window => ({
  l: T.MathUtils.lerp(a.l, b.l, amount),
  r: T.MathUtils.lerp(a.r, b.r, amount),
  t: T.MathUtils.lerp(a.t, b.t, amount),
  b: T.MathUtils.lerp(a.b, b.b, amount),
});
/** Per-route staging. `focus` is where the camera pushes into the structure,
 * as a fraction of the subject's bounds; `place` is where the final formation
 * sits on screen, opposite the route's editorial column. */
const staging: Record<
  OpeningKind,
  {
    focus: [number, number, number];
    place: [number, number];
    peel: 1 | -1;
    /** Share of the viewport width the finished formation may span. */
    width: number;
    /** Final rotation of the formation; Home's 0.28 rad lean leads into it. */
    turn: number;
  }
> = {
  services: {
    focus: [0.62, 0.45, 0.5],
    place: [0.64, 0.5],
    peel: 1,
    width: 0.46,
    turn: 0.42,
  },
  industries: {
    focus: [0.55, 0.55, 0.5],
    place: [0.3, 0.54],
    peel: -1,
    width: 0.5,
    turn: 0.4,
  },
  about: {
    focus: [0.45, 0.62, 0.5],
    place: [0.7, 0.56],
    peel: 1,
    width: 0.44,
    turn: 0.45,
  },
  quote: {
    focus: [0.5, 0.7, 0.6],
    place: [0.7, 0.5],
    peel: 1,
    width: 0.5,
    turn: -0.64,
  },
};

/** The same choreography as Home's cargo story, on each route's registered
 * subject: film -> pixel peel -> rendered model -> push into the structure ->
 * separation and particle burst -> sparse geometric formation. */
export async function createOpeningRenderer(
  host: HTMLElement,
  kind: OpeningKind,
  image: HTMLImageElement,
  video: HTMLVideoElement | null,
  options: Options,
): Promise<OpeningRenderer> {
  const mobile = innerWidth < 821,
    stage = staging[kind];
  const renderer = new T.WebGLRenderer({
    antialias: !mobile,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
  renderer.setClearColor("#101d21", 1);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.autoClear = false;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = T.PCFShadowMap;
  // Contact shadows only show while the model is registered to the plate.
  renderer.shadowMap.autoUpdate = false;
  host.append(renderer.domElement);
  const scene = new T.Scene(),
    hud = new T.Scene(),
    hudCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  hudCamera.position.z = 1;
  const study = createHeroStudy(kind);
  const assembly = createOpeningAssembly(study, kind, 1.6);
  const camera = study.camera;
  const room = new RoomEnvironment(),
    pmrem = new T.PMREMGenerator(renderer),
    environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  study.root.updateMatrixWorld(true);
  const rest = new T.Box3().setFromObject(study.root),
    centre = rest.getCenter(new T.Vector3()),
    size = rest.getSize(new T.Vector3());
  scene.add(new T.HemisphereLight(0xf2f2ea, 0x6d625a, 2));
  const sun = new T.DirectionalLight(0xffe9d0, 4);
  sun.position.set(centre.x - 4, centre.y + 12, centre.z + 10);
  sun.target.position.copy(centre);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -20,
    right: 20,
    top: 20,
    bottom: -20,
  });
  scene.add(sun, sun.target);
  const shadowMaterial = new T.ShadowMaterial({ opacity: 0.16 });
  const floor = new T.Mesh(new T.PlaneGeometry(100, 100), shadowMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = rest.min.y;
  floor.receiveShadow = true;
  const meshes: T.Mesh[] = [];
  study.root.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.castShadow = !mobile;
      meshes.push(o);
    }
  });
  const steel = new T.Color("#20343a"),
    originalColors = study.surfaces.map((m) => m.color.clone());
  study.surfaces.forEach((m) => (m.transparent = true));
  study.wire.color.set("#aedbd9");

  const photoTexture = new T.Texture(image);
  photoTexture.colorSpace = T.SRGBColorSpace;
  photoTexture.needsUpdate = true;
  const filmTexture = video ? new T.VideoTexture(video) : null;
  if (filmTexture) {
    filmTexture.colorSpace = T.SRGBColorSpace;
    // A decoded film may already be paused when this renderer is created.
    // Upload its current frame without waiting for another video callback.
    filmTexture.needsUpdate = true;
  }
  const pointer = new T.Vector2(3, 3),
    pointerTarget = new T.Vector2(3, 3);
  const plateUniforms = {
    uPhoto: { value: photoTexture },
    uFilm: { value: filmTexture ?? photoTexture },
    uFilmMix: { value: 0 },
    uCrop: { value: new T.Vector4(1, 1, 0, 0) },
    uPeel: { value: 0 },
    uDirection: { value: stage.peel },
    uPointer: { value: pointer },
    uTime: { value: 0 },
  };
  const plateGeometry = new T.PlaneGeometry(2, 2);
  // Home's pixel-cell peel and orange rim, entering from the subject's side.
  const plateMaterial = new T.ShaderMaterial({
    uniforms: plateUniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `uniform sampler2D uPhoto,uFilm;uniform vec4 uCrop;uniform float uFilmMix,uPeel,uDirection,uTime;uniform vec2 uPointer;varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec2 uv=vUv*uCrop.xy+uCrop.zw;float distanceToPointer=length(vUv*2.-1.-uPointer);uv+=sin(uTime+vUv.yx*12.)*.0015*exp(-distanceToPointer*8.);
    vec3 color=mix(texture2D(uPhoto,uv).rgb,sRGBTransferEOTF(texture2D(uFilm,uv)).rgb,uFilmMix);
    float cell=hash(floor(vUv*vec2(210.,135.)));float across=uDirection>0.?1.-vUv.x:vUv.x;float threshold=across*.66+vUv.y*.2+cell*.14;
    float alpha=1.-smoothstep(threshold-.026,threshold+.026,uPeel);float rim=(1.-smoothstep(0.,.016,abs(threshold-uPeel)))*step(.01,uPeel)*step(uPeel,.99);
    color=mix(color,vec3(1.,.30,.065),rim*.8);gl_FragColor=vec4(color,alpha);
    #include <colorspace_fragment>
    }`,
  });
  hud.add(new T.Mesh(plateGeometry, plateMaterial));

  // Particles start on the actual model surfaces and follow their component.
  type Face = { a: T.Vector3; b: T.Vector3; c: T.Vector3; end: number };
  const faces: (Face & { delta: T.Vector3 })[] = [];
  let area = 0;
  const shown = (o: T.Object3D) => {
    for (let n: T.Object3D | null = o; n; n = n.parent)
      if (!n.visible) return false;
    return true;
  };
  study.root.traverse((o) => {
    if (!shown(o)) return;
    const g = (o as T.Mesh).geometry as T.BufferGeometry | undefined,
      p = g?.getAttribute("position");
    if (!g || !p) return;
    // Slivers such as container ribs and fan blades would crowd the cloud
    // without adding a readable outline.
    g.computeBoundingBox();
    const extent = g
      .boundingBox!.getSize(new T.Vector3())
      .multiply(o.getWorldScale(new T.Vector3()));
    if (
      Math.min(extent.x, extent.y, extent.z) < 0.04 &&
      o.parent !== study.root
    )
      return;
    const vertex = (i: number) =>
      new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
    if (o instanceof T.Mesh) {
      const idx = g.index,
        delta =
          (o.parent?.userData.explode as T.Vector3 | undefined)?.clone() ??
          new T.Vector3();
      for (let i = 0; i < (idx?.count ?? p.count); i += 3) {
        const a = vertex(idx ? idx.getX(i) : i),
          b = vertex(idx ? idx.getX(i + 1) : i + 1),
          c = vertex(idx ? idx.getX(i + 2) : i + 2);
        const size = new T.Triangle(a, b, c).getArea();
        if (size < 0.00001) continue;
        area += size;
        faces.push({ a, b, c, delta, end: area });
      }
    }
  });
  let seed = 117;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const pick = <V extends { end: number }>(list: V[], total: number) => {
    const target = random() * total;
    let lo = 0,
      hi = list.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (list[m].end < target) lo = m + 1;
      else hi = m;
    }
    return list[lo];
  };
  const onSurface = (face: Face) => {
    const r = Math.sqrt(random()),
      s = random();
    return face.a
      .clone()
      .multiplyScalar(1 - r)
      .addScaledVector(face.b, r * (1 - s))
      .addScaledVector(face.c, r * s);
  };
  const land = await new T.TextureLoader().loadAsync(
    "/images/globe-land-mask.png",
  );
  const formation = createOpeningFormation(kind, rest, land);
  const count = mobile ? 6500 : 16000,
    positions = new Float32Array(count * 3),
    explode = new Float32Array(count * 3),
    bursts = new Float32Array(count * 3),
    targets = new Float32Array(count * 3),
    meta = new Float32Array(count * 2),
    seeds = new Float32Array(count);
  const silhouette: T.Vector3[] = [...formation.outline];
  for (let i = 0; i < count; i++) {
    const face = pick(faces, area);
    onSurface(face).toArray(positions, i * 3);
    face.delta.toArray(explode, i * 3);
    // Home's burst volume, centred on this subject.
    const theta = random() * Math.PI * 2,
      radius = 2 + random() * 8;
    bursts.set(
      [
        centre.x + Math.cos(theta) * radius,
        centre.y + (random() - 0.5) * 8,
        centre.z + Math.sin(theta) * radius * 0.55,
      ],
      i * 3,
    );
    const target = formation.sample(i / count);
    target.toArray(targets, i * 3);
    meta.set([0, 0.6], i * 2);
    seeds[i] = random();
  }
  const particleGeometry = new T.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new T.BufferAttribute(positions, 3),
  );
  particleGeometry.setAttribute("aExplode", new T.BufferAttribute(explode, 3));
  particleGeometry.setAttribute("aBurst", new T.BufferAttribute(bursts, 3));
  particleGeometry.setAttribute("aTarget", new T.BufferAttribute(targets, 3));
  particleGeometry.setAttribute("aMeta", new T.BufferAttribute(meta, 2));
  particleGeometry.setAttribute("aSeed", new T.BufferAttribute(seeds, 1));
  const particleUniforms = {
    uExplode: { value: 0 },
    uBurst: { value: 0 },
    uForm: { value: 0 },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uWave: { value: 0 },
    uScan: { value: -100 },
    uScanAxis: { value: 0 },
    uPointer: { value: pointer },
    uDpr: { value: renderer.getPixelRatio() },
  };
  // Home's particle shader, with a finite formation in place of the globe.
  const particleMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: particleUniforms,
    vertexShader: `attribute vec3 aExplode,aBurst,aTarget;attribute vec2 aMeta;attribute float aSeed;uniform float uExplode,uBurst,uForm,uTime,uDpr,uWave,uScan,uScanAxis;uniform vec2 uPointer;varying float vSeed,vForm,vFade,vScan;
    void main(){vec3 target=aTarget;float ground=step(.5,aMeta.x)*step(aMeta.x,1.5);target.y+=(sin(target.x*.55+uTime*.9)*.16+sin(target.z*.8+uTime*.6)*.11)*uWave*ground;
    vec3 p=mix(position+aExplode*uExplode,aBurst,uBurst);p=mix(p,target,uForm);float wave=sin(uTime*.35+aSeed*20.);p+=vec3(sin(aSeed*40.+uTime*.2),wave,cos(aSeed*30.+uTime*.2))*.18*uBurst*(1.-uForm);
    vec4 projected=projectionMatrix*modelViewMatrix*vec4(p,1.);vec2 ndc=projected.xy/projected.w;float repel=exp(-length(ndc-uPointer)*16.);p+=normalize(vec3(ndc-uPointer,.3))*repel*.65*uBurst;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);float coord=uScanAxis<.5?aTarget.x:aTarget.y;vScan=exp(-pow((coord-uScan)*1.5,2.))*uForm*step(aMeta.x,.5);
    float large=step(.989,aSeed)*(1.-uForm)*uBurst;gl_PointSize=uDpr*mix(1.6+1.8*aSeed+vScan*1.2,30.+25.*aSeed,large);vSeed=aSeed;vForm=uForm;vFade=mix(1.,aMeta.y,uForm);}`,
    fragmentShader: `uniform float uOpacity;varying float vSeed,vForm,vFade,vScan;
    void main(){float dist=length(gl_PointCoord-.5);if(dist>.5)discard;vec3 color=mix(vec3(.64,.80,.80),vec3(1.,.28,.065),step(.83,vSeed));color=mix(color,vec3(1.,.52,.28),vScan*.55);
    float soft=1.-smoothstep(.12,.5,dist);float sparse=mix(mix(.12,.58,step(.62,vSeed)),.7,vForm);float alpha=soft*uOpacity*sparse*vFade*(1.+vScan*1.6);if(vSeed>.989&&vForm<.8)alpha*=.14;gl_FragColor=vec4(color,alpha);}`,
  });
  const points = new T.Points(particleGeometry, particleMaterial);
  points.frustumCulled = false;
  const pivot = new T.Group(),
    contents = new T.Group();
  pivot.position.copy(centre);
  contents.position.copy(centre).negate();
  contents.add(study.root, floor, points, formation.root);
  pivot.add(contents);
  scene.add(pivot);

  // Camera windows: registered to the plate, pushed into the structure, then
  // framed on the finished formation. Only the orthographic window moves.
  let registered: Window = { l: -1, r: 1, t: 1, b: -1 },
    macro: Window = registered,
    settled: Window = registered;
  const lean = 0.28 * Math.sign(stage.turn),
    settledTurn = stage.turn;
  const toView = (point: T.Vector3, turn: number) =>
    point
      .clone()
      .sub(centre)
      .applyAxisAngle(new T.Vector3(0, 1, 0), turn)
      .add(centre)
      .applyMatrix4(camera.matrixWorldInverse);
  const frame = () => {
    const w = host.clientWidth,
      h = host.clientHeight,
      aspect = w / h;
    registered = {
      l: camera.left,
      r: camera.right,
      t: camera.top,
      b: camera.bottom,
    };
    const focus = toView(
        new T.Vector3(
          rest.min.x + size.x * stage.focus[0],
          rest.min.y + size.y * stage.focus[1],
          rest.min.z + size.z * stage.focus[2],
        ),
        0,
      ),
      zoom = mobile ? 1.35 : 1.8,
      halfX = (registered.r - registered.l) / 2 / zoom,
      halfY = (registered.t - registered.b) / 2 / zoom,
      mx = T.MathUtils.lerp((registered.l + registered.r) / 2, focus.x, 0.7),
      my = T.MathUtils.lerp((registered.t + registered.b) / 2, focus.y, 0.7);
    macro = { l: mx - halfX, r: mx + halfX, t: my + halfY, b: my - halfY };
    const outline = silhouette.map((point) => toView(point, settledTurn));
    const box = new T.Box3().setFromPoints(outline),
      extent = box.getSize(new T.Vector3()),
      mid = box.getCenter(new T.Vector3());
    let cx = stage.place[0],
      cy = stage.place[1],
      heightShare = 0.46,
      widthShare = stage.width;
    if (mobile) {
      // Fit between the later copy and the scene controls.
      const area = host.getBoundingClientRect(),
        copy = Math.max(
          ...[
            ...(host.parentElement?.querySelectorAll<HTMLElement>(
              ".opening-later",
            ) ?? []),
          ].map((el) => el.getBoundingClientRect().bottom - area.top),
          area.height * 0.45,
        ),
        controls =
          (host.parentElement
            ?.querySelector(".opening-controls")
            ?.getBoundingClientRect().top ?? area.bottom) - area.top;
      const start = (copy + 16) / area.height,
        end = Math.max(start + 0.12, (controls - 16) / area.height);
      cx = 0.5;
      cy = (start + end) / 2;
      heightShare = (end - start) * 0.92;
      widthShare = 0.9;
    }
    const sy = Math.max(
        extent.y / heightShare,
        extent.x / (aspect * widthShare),
      ),
      sx = sy * aspect;
    settled = {
      l: mid.x - sx * cx,
      r: mid.x + sx * (1 - cx),
      t: mid.y + sy * cy,
      b: mid.y - sy * (1 - cy),
    };
  };
  const fit = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    const iw = image.naturalWidth,
      ih = image.naturalHeight,
      portrait = iw / ih < 1,
      scale = Math.max(w / iw, h / ih),
      cw = w / (iw * scale),
      ch = h / (ih * scale);
    const xPosition = portrait
      ? 0.5
      : kind === "industries"
        ? 0
        : kind === "about"
          ? 0.65
          : 1;
    plateUniforms.uCrop.value.set(
      cw,
      ch,
      (1 - cw) * xPosition,
      (1 - ch) * (portrait ? 0.35 : 0.5),
    );
    host.dataset.coverTransform = plateUniforms.uCrop.value
      .toArray()
      .map((v) => v.toFixed(5))
      .join(",");
    camera.zoom = 1;
    study.fit(w, h, portrait);
    frame();
    renderer.setSize(w, h, false);
    kick();
  };

  let alive = true,
    inView = true,
    paused = false,
    raf = 0,
    p = 0,
    time = 0,
    previous = performance.now(),
    last = 0,
    filmReady = false;
  const draw = () => {
    // The source is chosen only while the film is on screen; a film that
    // finishes loading after the handoff never replaces the poster.
    if (p < 0.14)
      filmReady = !!(video && video.readyState >= 2 && !video.error && !mobile);
    plateUniforms.uFilm.value =
      filmReady && filmTexture ? filmTexture : photoTexture;
    pointer.lerp(pointerTarget, 0.09);
    // Film crossfades to its registered first frame before the peel begins.
    plateUniforms.uFilmMix.value = filmReady ? 1 - smooth(0.06, 0.12, p) : 0;
    plateUniforms.uPeel.value = T.MathUtils.clamp((p - 0.12) / 0.2, 0, 1);
    plateUniforms.uTime.value = time;
    const solid = (1 - smooth(0.33, 0.57, p)) * smooth(0.1, 0.23, p),
      scanned = smooth(0.22, 0.41, p);
    study.surfaces.forEach((m, i) => {
      m.color.copy(originalColors[i]).lerp(steel, scanned);
      m.opacity = solid;
      m.depthWrite = solid > 0.5;
    });
    for (const mesh of meshes) mesh.visible = solid > 0.003;
    study.wire.opacity =
      smooth(0.13, 0.28, p) * (1 - smooth(0.49, 0.7, p)) * 0.8;
    const explosion = smooth(0.31, 0.59, p);
    assembly.update(explosion);
    shadowMaterial.opacity = 0.16 * (1 - smooth(0.12, 0.3, p));
    floor.visible = p < 0.3;
    if (floor.visible) renderer.shadowMap.needsUpdate = true;
    const form = smooth(0.59, 0.82, p);
    particleUniforms.uExplode.value = explosion;
    particleUniforms.uBurst.value = smooth(0.34, 0.57, p);
    particleUniforms.uForm.value = form;
    particleUniforms.uOpacity.value =
      smooth(0.18, 0.36, p) * (1 - smooth(0.64, 0.86, p));
    particleUniforms.uTime.value = time;
    particleUniforms.uScan.value = -100;
    points.visible = particleUniforms.uOpacity.value > 0.001;
    formation.update(smooth(0.65, 0.86, p), time);
    const pointed = Math.abs(pointer.x) <= 1 && Math.abs(pointer.y) <= 1;
    pivot.rotation.y =
      T.MathUtils.lerp(
        smooth(0.2, 0.59, p) * lean,
        stage.turn,
        smooth(0.59, 0.86, p),
      ) +
      Math.sin(time * 0.16) * 0.05 * form +
      (p > 0.21 && pointed ? pointer.x * 0.03 : 0);
    // Push inside the structure once the plate has gone, then settle.
    const inside = smooth(0.28, 0.44, p) * (1 - smooth(0.55, 0.72, p));
    const view = blend(
      blend(registered, macro, inside),
      settled,
      smooth(0.55, 0.82, p),
    );
    camera.left = view.l;
    camera.right = view.r;
    camera.top = view.t;
    camera.bottom = view.b;
    camera.updateProjectionMatrix();
    renderer.clear();
    if (p < 0.33) renderer.render(hud, hudCamera);
    renderer.clearDepth();
    renderer.render(scene, camera);
    host.dataset.progress = p.toFixed(3);
    host.dataset.workTime = time.toFixed(3);
    host.dataset.frameSource = filmReady ? "film" : "poster";
    host.dataset.registered = "true";
    host.dataset.geometry = "volumetric";
    host.dataset.anchorCount = String(count);
    host.dataset.explosion = explosion.toFixed(3);
    host.dataset.particleBurst = particleUniforms.uBurst.value.toFixed(3);
    host.dataset.particleConnection = form.toFixed(3);
    host.dataset.finalForm = formation.name;
    host.dataset.particleOpacity = particleUniforms.uOpacity.value.toFixed(3);
  };
  const render = (now: number) => {
    raf = 0;
    if (!alive || !inView || document.hidden) return;
    // Home's cadence: about 60Hz desktop and 30Hz at phone widths.
    if (now - last < (mobile ? 32 : 16)) {
      raf = requestAnimationFrame(render);
      return;
    }
    const dt = T.MathUtils.clamp((now - previous) / 1000, 0, 0.05);
    previous = now;
    last = now;
    if (!paused) time += dt;
    draw();
    if (!paused || pointer.distanceTo(pointerTarget) > 0.001) kick();
  };
  function kick() {
    if (!raf && alive && inView && !document.hidden)
      raf = requestAnimationFrame(render);
  }
  const move = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointerTarget.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      1 - ((e.clientY - r.top) / r.height) * 2,
    );
    kick();
  };
  const leave = () => {
    pointerTarget.set(3, 3);
    kick();
  };
  const lost = (e: Event) => {
    e.preventDefault();
    options.onError();
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      previous = performance.now();
      kick();
    }
  };
  const loaded = () => {
    photoTexture.needsUpdate = true;
    fit();
  };
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", visibility);
  image.addEventListener("load", loaded);
  const sizing = new ResizeObserver(fit);
  sizing.observe(host);
  fit();
  const dispose = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    sizing.disconnect();
    image.removeEventListener("load", loaded);
    document.removeEventListener("visibilitychange", visibility);
    host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerleave", leave);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    disposeVehicle(study.root);
    disposeVehicle(formation.root);
    land.dispose();
    floor.geometry.dispose();
    shadowMaterial.dispose();
    plateGeometry.dispose();
    plateMaterial.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
    photoTexture.dispose();
    filmTexture?.dispose();
    environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  try {
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    dispose();
    throw error;
  }
  if (alive) {
    draw();
    options.onReady();
    kick();
  }
  return {
    update(value) {
      p = value;
      kick();
    },
    pause(value) {
      paused = value;
      previous = performance.now();
      kick();
    },
    visible(value) {
      inView = value;
      if (!value) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        previous = performance.now();
        kick();
      }
    },
    dispose,
  };
}
