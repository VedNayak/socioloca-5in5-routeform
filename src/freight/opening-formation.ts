import * as T from "three";
import type { OpeningKind } from "./hero-study";

/** Geographic destinations use the same Natural Earth mask and dot treatment as Home.
 * Routes are illustrative, not a claim of operating lanes or company locations. */
export function createOpeningFormation(
  kind: OpeningKind,
  bounds: T.Box3,
  land?: T.Texture,
) {
  const centre = bounds.getCenter(new T.Vector3());
  const size = bounds.getSize(new T.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.36;
  const root = new T.Group();
  root.position.copy(centre);
  // Keep north upright despite each original subject's different camera pitch.
  const globe = new T.Group();
  root.add(globe);
  const count = 16000;
  const positions = new Float32Array(count * 3),
    uvs = new Float32Array(count * 2),
    seeds = new Float32Array(count);
  const sphere = (lat: number, lon: number, r = radius) => {
    const a = (lat * Math.PI) / 180,
      b = (lon * Math.PI) / 180;
    return new T.Vector3(
      Math.cos(a) * Math.sin(b),
      Math.sin(a),
      Math.cos(a) * Math.cos(b),
    ).multiplyScalar(r);
  };
  for (let i = 0; i < count; i++) {
    const lat = Math.asin(1 - (2 * (i + 0.5)) / count),
      lon = ((i * Math.PI * (3 - Math.sqrt(5))) % (Math.PI * 2)) - Math.PI;
    positions.set(
      sphere((lat * 180) / Math.PI, (lon * 180) / Math.PI).toArray(),
      i * 3,
    );
    uvs.set([lon / (Math.PI * 2) + 0.5, lat / Math.PI + 0.5], i * 2);
    seeds[i] = ((i * 104729) % 65521) / 65521;
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
  geometry.setAttribute("aEarthUV", new T.BufferAttribute(uvs, 2));
  geometry.setAttribute("aSeed", new T.BufferAttribute(seeds, 1));
  const material = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: {
      uLand: { value: land },
      uOpacity: { value: 0 },
      uDpr: {
        value:
          typeof devicePixelRatio === "undefined"
            ? 1
            : Math.min(devicePixelRatio, 1.75),
      },
    },
    vertexShader: `attribute vec2 aEarthUV;attribute float aSeed;uniform float uDpr;varying vec2 vUV;varying float vSeed,vFacing;void main(){vUV=aEarthUV;vSeed=aSeed;vFacing=smoothstep(-.1,.7,(mat3(modelViewMatrix)*normalize(position)).z);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=uDpr*(1.6+1.8*aSeed);}`,
    fragmentShader: `uniform sampler2D uLand;uniform float uOpacity;varying vec2 vUV;varying float vSeed,vFacing;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float land=texture2D(uLand,vUV).r;vec3 color=mix(vec3(.64,.80,.80),vec3(1.,.28,.065),step(.83,fract(vSeed*127.)));float alpha=(1.-smoothstep(.12,.5,d))*uOpacity*mix(.025,1.,land)*mix(.55,.95,land)*mix(.035,1.,vFacing);gl_FragColor=vec4(color,alpha);}`,
  });
  globe.add(new T.Points(geometry, material));
  const routeMaterial = new T.LineBasicMaterial({
    color: 0xff733e,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const markerMaterial = new T.MeshBasicMaterial({
    color: 0xffd0aa,
    transparent: true,
    opacity: 0,
  });
  const nodesMaterial = new T.MeshBasicMaterial({
    color: 0xff733e,
    transparent: true,
    opacity: 0,
  });
  // Flight arcs use spherical interpolation. Ocean routes follow explicit sea waypoints.
  const lanes: number[][][] =
    kind === "about"
      ? [
          [
            [51.9, 4.5],
            [50.95, 1.4],
            [50.1, -1.5],
            [49.7, -6],
            [50, -12],
            [43, -35],
            [40.7, -74],
          ],
          [
            [1.3, 103.8],
            [1.2, 103.4],
            [2.7, 100.6],
            [5.5, 97],
            [6, 95],
            [6, 80],
            [10, 65],
            [24, 60],
            [26.5, 57],
            [26.4, 56.4],
            [25.2, 55.3],
          ],
        ]
      : [
          [
            [25.2, 55.3],
            [22.3, 114.2],
          ],
          [
            [51.5, -0.1],
            [25.2, 55.3],
          ],
          [
            [1.3, 103.8],
            [-33.9, 151.2],
          ],
        ];
  const routes = lanes
    .slice(0, kind === "quote" ? 1 : kind === "industries" ? 2 : 3)
    .map((lane, index) => {
      const points: T.Vector3[] = [];
      for (let j = 0; j < lane.length - 1; j++) {
        const start = sphere(lane[j][0], lane[j][1], 1),
          end = sphere(lane[j + 1][0], lane[j + 1][1], 1),
          angle = start.angleTo(end);
        for (let i = 0; i <= 64; i++) {
          const t = i / 64;
          points.push(
            start
              .clone()
              .multiplyScalar(Math.sin((1 - t) * angle))
              .addScaledVector(end, Math.sin(t * angle))
              .divideScalar(Math.sin(angle))
              .multiplyScalar(
                radius *
                  (1.025 +
                    Math.sin(Math.PI * t) * (kind === "about" ? 0.025 : 0.17)),
              ),
          );
        }
      }
      const curve = new T.CatmullRomCurve3(points);
      const line = new T.Line(
        new T.BufferGeometry().setFromPoints(curve.getPoints(192)),
        routeMaterial,
      );
      globe.add(line);
      for (const p of [points[0], points[points.length - 1]]) {
        const node = new T.Mesh(
          new T.SphereGeometry(radius * 0.012, 10, 8),
          nodesMaterial,
        );
        node.position.copy(p);
        globe.add(node);
      }
      const marker = new T.Group();
      if (kind === "services") {
        // Local +Z points forward: fuselage, swept wings and tail form a legible aircraft.
        const shape = new T.Shape();
        const outline = [
          [0, 0.12],
          [0.014, 0.02],
          [0.105, -0.035],
          [0.105, -0.055],
          [0.014, -0.025],
          [0.012, -0.08],
          [0.042, -0.105],
          [0.042, -0.12],
          [0, -0.103],
          [-0.042, -0.12],
          [-0.042, -0.105],
          [-0.012, -0.08],
          [-0.014, -0.025],
          [-0.105, -0.055],
          [-0.105, -0.035],
          [-0.014, 0.02],
        ];
        outline.forEach(([x, z], i) =>
          i
            ? shape.lineTo(x * radius, z * radius)
            : shape.moveTo(x * radius, z * radius),
        );
        shape.closePath();
        const plane = new T.Mesh(new T.ShapeGeometry(shape), markerMaterial);
        plane.rotation.x = Math.PI / 2;
        marker.add(plane);
        markerMaterial.side = T.DoubleSide;
      } else
        marker.add(
          new T.Mesh(
            new T.SphereGeometry(radius * 0.018, 10, 8),
            markerMaterial,
          ),
        );
      globe.add(marker);
      return { curve, marker, index };
    });
  // Full spherical silhouette bounds also reserve room for arcs on small screens.
  const outline = Array.from({ length: 512 }, (_, i) =>
    new T.Vector3()
      .fromArray(positions, ((i * 31) % count) * 3)
      .multiplyScalar(1.25)
      .add(centre),
  );
  return {
    root,
    name: `geographic-${kind}`,
    outline,
    sample(t: number) {
      return new T.Vector3()
        .fromArray(positions, Math.min(count - 1, Math.floor(t * count)) * 3)
        .add(centre);
    },
    update(amount: number, time: number) {
      root.visible = amount > 0.001;
      material.uniforms.uOpacity.value = amount;
      routeMaterial.opacity = amount * 0.48;
      markerMaterial.opacity = amount * 0.95;
      nodesMaterial.opacity = amount * 0.8;
      for (const { curve, marker, index } of routes) {
        const t = (time * 0.035 + index * 0.31) % 1;
        curve.getPointAt(t, marker.position);
        const forward = curve.getTangentAt(t).normalize(),
          up = marker.position.clone().normalize(),
          right = new T.Vector3().crossVectors(up, forward).normalize();
        up.crossVectors(forward, right).normalize();
        marker.quaternion.setFromRotationMatrix(
          new T.Matrix4().makeBasis(right, up, forward),
        );
      }
    },
  };
}
