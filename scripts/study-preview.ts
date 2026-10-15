import * as T from "three";
import { createHeroStudy, type OpeningKind } from "../src/freight/hero-study";
const kind =
  (new URLSearchParams(location.search).get("kind") as OpeningKind) ||
  "services";
const study = createHeroStudy(kind);
const renderer = new T.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(1);
renderer.setClearColor("#101d21");
renderer.toneMapping = T.ACESFilmicToneMapping;
document.body.append(renderer.domElement);
const scene = new T.Scene();
scene.add(study.root, new T.HemisphereLight(0xf1f4ee, 0x182b36, 2.5));
const light = new T.DirectionalLight(0xffe7ce, 4);
light.position.set(6, 15, 10);
scene.add(light);
const fill = new T.DirectionalLight(0xa0c7d2, 2);
fill.position.set(-8, 10, -8);
scene.add(fill);
study.fit(innerWidth, innerHeight, false);
renderer.render(scene, study.camera);
document.body.dataset.ready = "true";
