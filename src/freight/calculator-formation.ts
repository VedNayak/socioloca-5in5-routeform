import * as T from "three";
/** Original dotted calculator: all points belong to a chassis, display or key.
 * Display is an illustrative cargo-volume calculation, never a freight price. */
export function createCalculatorFormation(
  bounds: T.Box3,
  orientation: T.Quaternion,
) {
  const centre = bounds.getCenter(new T.Vector3()),
    r = Math.max(...bounds.getSize(new T.Vector3()).toArray()) * 0.36;
  const root = new T.Group();
  root.position.copy(centre);
  root.quaternion.copy(orientation);
  const vertices: number[] = [],
    groups: number[] = [],
    seeds: number[] = [];
  const point = (x: number, y: number, z: number, group = 0) => {
    vertices.push(x * r, y * r, z * r);
    groups.push(group);
    seeds.push(((vertices.length * 104729) % 65521) / 65521);
  };
  const line = (a: number[], b: number[], group = 0, spacing = 0.025) => {
    const n = Math.ceil(Math.hypot(...a.map((v, i) => v - b[i])) / spacing);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      point(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        group,
      );
    }
  };
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    z: number,
    g = 0,
  ) => {
    const a = [
      [x, y, z],
      [x + w, y, z],
      [x + w, y + h, z],
      [x, y + h, z],
    ];
    a.forEach((p, i) => line(p, a[(i + 1) % 4], g));
  };
  // Rounded body layers form a solid, lightly raked handheld object.
  const body = (z: number, g = 0) => {
    const w = 0.65,
      h = 0.94,
      c = 0.1;
    const corners = [
      [-w + c, -h + c, Math.PI],
      [w - c, -h + c, Math.PI * 1.5],
      [w - c, h - c, 0],
      [-w + c, h - c, Math.PI * 0.5],
    ];
    const pts: number[][] = [];
    for (const [x, y, a] of corners)
      for (let i = 0; i <= 10; i++)
        pts.push([
          x + Math.cos(a + ((i / 10) * Math.PI) / 2) * c,
          y + Math.sin(a + ((i / 10) * Math.PI) / 2) * c,
          z,
        ]);
    pts.forEach((p, i) => line(p, pts[(i + 1) % pts.length], g));
  };
  for (const z of [-0.12, -0.06, 0, 0.06, 0.12]) body(z);
  for (let x = -0.57; x <= 0.57; x += 0.045)
    for (let y = -0.85; y <= 0.85; y += 0.045) {
      if (y > 0.37 && y < 0.81 && Math.abs(x) < 0.54) continue;
      if (y < 0.29 && y > -0.8 && Math.abs(x) < 0.54) continue;
      point(x, y, 0.12);
    }
  rect(-0.54, 0.39, 1.08, 0.4, 0.135, 1);
  rect(-0.49, 0.44, 0.98, 0.3, 0.14, 1);
  const segments = [
    [
      [0, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 0.5],
    ],
    [
      [1, 0.5],
      [1, 0],
    ],
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0, 0],
      [0, 0.5],
    ],
    [
      [0, 0.5],
      [0, 1],
    ],
    [
      [0, 0.5],
      [1, 0.5],
    ],
  ];
  const digits: Record<string, number[]> = {
    "0": [0, 1, 2, 3, 4, 5],
    "1": [1, 2],
    "2": [0, 1, 6, 4, 3],
    "3": [0, 1, 6, 2, 3],
    "4": [5, 6, 1, 2],
    "5": [0, 5, 6, 2, 3],
    "6": [0, 5, 6, 4, 2, 3],
    "7": [0, 1, 2],
    "8": [0, 1, 2, 3, 4, 5, 6],
    "9": [0, 1, 2, 3, 5, 6],
  };
  const digit = (
    s: string,
    x: number,
    y: number,
    w: number,
    h: number,
    g: number,
  ) =>
    digits[s].forEach((i) =>
      line(
        [x + segments[i][0][0] * w, y + segments[i][0][1] * h, 0.164],
        [x + segments[i][1][0] * w, y + segments[i][1][1] * h, 0.164],
        g,
        0.016,
      ),
    );
  ["1", "2", "8", "4"].forEach((s, i) =>
    digit(s, -0.3 + i * 0.19, 0.48, 0.1, 0.19, 1),
  );
  point(0.21, 0.48, 0.164, 1);
  const labels = [
    "7",
    "8",
    "9",
    "+",
    "4",
    "5",
    "6",
    "-",
    "1",
    "2",
    "3",
    "x",
    "0",
    ".",
    "C",
    "=",
  ];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      const index = row * 4 + col,
        g = index + 2,
        x = -0.53 + col * 0.275,
        y = 0.08 - row * 0.26,
        w = 0.225,
        h = 0.205;
      rect(x, y, w, h, 0.16, g);
      rect(x, y, w, h, 0.2, g);
      for (const [dx, dy] of [
        [0, 0],
        [w, 0],
        [w, h],
        [0, h],
      ])
        line([x + dx, y + dy, 0.16], [x + dx, y + dy, 0.2], g);
      const label = labels[index],
        cx = x + w * 0.5,
        cy = y + h * 0.5;
      if (digits[label]) digit(label, cx - 0.037, cy - 0.052, 0.074, 0.104, g);
      else if (label === ".") point(cx, cy - 0.04, 0.23, g);
      else if (label === "C") {
        line([cx + 0.035, cy + 0.05, 0.23], [cx - 0.035, cy + 0.05, 0.23], g);
        line([cx - 0.035, cy + 0.05, 0.23], [cx - 0.035, cy - 0.05, 0.23], g);
        line([cx - 0.035, cy - 0.05, 0.23], [cx + 0.035, cy - 0.05, 0.23], g);
      } else if (label === "x") {
        line([cx - 0.035, cy - 0.04, 0.23], [cx + 0.035, cy + 0.04, 0.23], g);
        line([cx - 0.035, cy + 0.04, 0.23], [cx + 0.035, cy - 0.04, 0.23], g);
      } else {
        line([cx - 0.045, cy, 0.23], [cx + 0.045, cy, 0.23], g);
        if (label === "+")
          line([cx, cy - 0.045, 0.23], [cx, cy + 0.045, 0.23], g);
        if (label === "=")
          line([cx - 0.045, cy - 0.04, 0.23], [cx + 0.045, cy - 0.04, 0.23], g);
      }
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("aGroup", new T.Float32BufferAttribute(groups, 1));
  geometry.setAttribute("aSeed", new T.Float32BufferAttribute(seeds, 1));
  const mat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: {
      uOpacity: { value: 0 },
      uKey: { value: 2 },
      uTime: { value: 0 },
      uDpr: {
        value: Math.min(
          typeof devicePixelRatio === "undefined" ? 1 : devicePixelRatio,
          1.75,
        ),
      },
    },
    vertexShader: `attribute float aGroup,aSeed;uniform float uKey,uDpr,uTime;varying float vAccent,vSeed;void main(){vAccent=step(abs(aGroup-uKey),.1);vSeed=aSeed;vec3 p=position; p.z-=vAccent*.025*(.5+.5*sin(uTime*4.));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=uDpr*(1.6+1.8*aSeed);}`,
    fragmentShader: `uniform float uOpacity;varying float vAccent,vSeed;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=mix(vec3(.64,.80,.80),vec3(1.,.28,.065),max(vAccent,step(.96,vSeed)));gl_FragColor=vec4(c,(1.-smoothstep(.12,.5,d))*uOpacity*.85);}`,
  });
  root.add(new T.Points(geometry, mat));
  const vectors = Array.from({ length: vertices.length / 3 }, (_, i) =>
    new T.Vector3()
      .fromArray(vertices, i * 3)
      .applyQuaternion(orientation)
      .add(centre),
  );
  return {
    root,
    name: "dotted-calculator",
    outline: vectors,
    sample(t: number) {
      return vectors[
        Math.min(vectors.length - 1, Math.floor(t * vectors.length))
      ].clone();
    },
    update(amount: number, time: number) {
      root.visible = amount > 0.001;
      mat.uniforms.uOpacity.value = amount;
      mat.uniforms.uTime.value = time;
      mat.uniforms.uKey.value = [2, 3, 9, 17][Math.floor(time * 0.65) % 4];
    },
  };
}
