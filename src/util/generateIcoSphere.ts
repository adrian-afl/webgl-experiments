/*
 Also it would be better to do it in 2 steps - first generate the geometries at various levels, cache it here
 and then use it to create the O3Ds in Three, so the geos are created only once
 */
import { vec2, vec3 } from "gl-matrix";
import * as fs from "node:fs";
import * as path from "node:path";

import { Object3dIntermediate, Vertex } from "../media/Object3dIntermediate.ts";

export interface GenerateIcoSphereInput {
  outDir: string;
  name: string;
  levels: number;
  radius: number;
  heightScale: number;
  heightMap: string;
}

type FixedArray<T, L> = T[] & { length: L };
type Triangle = FixedArray<vec3, 3>;

const baseTriangles: Triangle[] = [
  [
    [-1, 1.618033988749895, 0],
    [-1.618033988749895, 0, 1],
    [0, 1, 1.618033988749895],
  ],
  [
    [-1, 1.618033988749895, 0],
    [0, 1, 1.618033988749895],
    [1, 1.618033988749895, 0],
  ],
  [
    [-1, 1.618033988749895, 0],
    [1, 1.618033988749895, 0],
    [0, 1, -1.618033988749895],
  ],
  [
    [-1, 1.618033988749895, 0],
    [0, 1, -1.618033988749895],
    [-1.618033988749895, 0, -1],
  ],
  [
    [-1, 1.618033988749895, 0],
    [-1.618033988749895, 0, -1],
    [-1.618033988749895, 0, 1],
  ],
  [
    [1, 1.618033988749895, 0],
    [0, 1, 1.618033988749895],
    [1.618033988749895, 0, 1],
  ],
  [
    [0, 1, 1.618033988749895],
    [-1.618033988749895, 0, 1],
    [0, -1, 1.618033988749895],
  ],
  [
    [-1.618033988749895, 0, 1],
    [-1.618033988749895, 0, -1],
    [-1, -1.618033988749895, 0],
  ],
  [
    [-1.618033988749895, 0, -1],
    [0, 1, -1.618033988749895],
    [0, -1, -1.618033988749895],
  ],
  [
    [0, 1, -1.618033988749895],
    [1, 1.618033988749895, 0],
    [1.618033988749895, 0, -1],
  ],
  [
    [1, -1.618033988749895, 0],
    [1.618033988749895, 0, 1],
    [0, -1, 1.618033988749895],
  ],
  [
    [1, -1.618033988749895, 0],
    [0, -1, 1.618033988749895],
    [-1, -1.618033988749895, 0],
  ],
  [
    [1, -1.618033988749895, 0],
    [-1, -1.618033988749895, 0],
    [0, -1, -1.618033988749895],
  ],
  [
    [1, -1.618033988749895, 0],
    [0, -1, -1.618033988749895],
    [1.618033988749895, 0, -1],
  ],
  [
    [1, -1.618033988749895, 0],
    [1.618033988749895, 0, -1],
    [1.618033988749895, 0, 1],
  ],
  [
    [0, -1, 1.618033988749895],
    [1.618033988749895, 0, 1],
    [0, 1, 1.618033988749895],
  ],
  [
    [-1, -1.618033988749895, 0],
    [0, -1, 1.618033988749895],
    [-1.618033988749895, 0, 1],
  ],
  [
    [0, -1, -1.618033988749895],
    [-1, -1.618033988749895, 0],
    [-1.618033988749895, 0, -1],
  ],
  [
    [1.618033988749895, 0, -1],
    [0, -1, -1.618033988749895],
    [0, 1, -1.618033988749895],
  ],
  [
    [1.618033988749895, 0, 1],
    [1.618033988749895, 0, -1],
    [1, 1.618033988749895, 0],
  ],
];

// const tmp1 = vec3.create();
// const tmp2 = vec3.create();

// default culling is counter clock wise

function subdivideTriangle(tri: Triangle): FixedArray<Triangle, 4> {
  const halfEdgeA = vec3.create();
  const halfEdgeB = vec3.create();
  const halfEdgeC = vec3.create();

  vec3.lerp(halfEdgeA, tri[0], tri[1], 0.5);
  vec3.lerp(halfEdgeB, tri[1], tri[2], 0.5);
  vec3.lerp(halfEdgeC, tri[2], tri[0], 0.5);

  return [
    [tri[0], halfEdgeA, halfEdgeC],
    [tri[1], halfEdgeB, halfEdgeA],
    [tri[2], halfEdgeC, halfEdgeB],
    [halfEdgeA, halfEdgeB, halfEdgeC],
  ];
}

function subdivideTriangleMultipleTimes(
  tri: Triangle,
  iterations: number
): Triangle[] {
  let triangles = [tri];
  for (let i = 0; i < iterations; i++) {
    const tmpList: Triangle[] = [];
    for (const triangle of triangles) {
      tmpList.push(...subdivideTriangle(triangle));
    }
    triangles = tmpList;
  }
  return triangles;
}

function normalizeTriangle(tri: Triangle): void {
  vec3.normalize(tri[0], tri[0]);
  vec3.normalize(tri[1], tri[1]);
  vec3.normalize(tri[2], tri[2]);
}

function verticesCenter(vertices: vec3[]): vec3 {
  const center = vec3.create();
  for (const item of vertices) {
    vec3.add(center, center, item);
  }
  vec3.divide(center, center, [
    vertices.length,
    vertices.length,
    vertices.length,
  ]);
  return center;
}

function clamp(num: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, num));
}

function xyzToPolar(xyz: vec3): vec2 {
  const theta = Math.atan2(xyz[1], xyz[0]);
  const phi = Math.acos(clamp(xyz[2], -1.0, 1.0));
  const tmp: vec2 = [theta, phi];
  vec2.divide(tmp, tmp, [2.0 * Math.PI, Math.PI]);
  return tmp;
}

function polarToXyz(xyIn: vec2): vec3 {
  const xy: vec2 = [xyIn[0] * 2.0 * Math.PI, xyIn[1] * Math.PI];
  const z = Math.cos(xy[1]);
  const x = Math.cos(xy[0]) * Math.sin(xy[1]);
  const y = Math.sin(xy[0]) * Math.sin(xy[1]);
  const tmp: vec3 = [x, y, z];
  vec3.normalize(tmp, tmp);
  return tmp;
}

export async function generateIcoSphere(
  input: GenerateIcoSphereInput
): Promise<void> {
  /*
  How it works:
  Initial Icosahedron (i will jsut say ICO) has 20 triangles (a lot!!!!)
  the triangles will be subdivided using the center of the edges ONCE to create the separate meshes, at LOD 0
  this will make each triangle into 4 triangles making in total 100 meshes (holy shit!)
  The vertices are already lay down on a sphere coordinates
  This constitutes 100 geometries at LOD0
  Then this is subdivided once again

  You know maybe RSI2 wont be that fucking stupid at this stage of bullshit
  Time to do ray sphere intersection and raymarching way later, this will be way more flexible
  but I need to reimplement shadowmapping, not a big deal honestly





  AAAAAAAAAAAAAAAAAAAAAA I know

  there are 2 ways to do it then
  A:
    1. there is icosphere that is reasonably tesselated like x2 or x3 or x4 or well, 50, who knows, target is like 200 mb? idk
    2. vertices of that sphere are usually spread around evenly but once player starts to get close to the surface, the vertices
       get moved closer and closer to the planet
   FUCK this doesnt solve issues with percision

   So another way:
   B:
   There is an ico sphere teselated to some intense degree so for example for earth the resolution is 10 km
   the iso sphere is split into blocks like the code here does
   there is a loader that loads those just using som LOD leveling techniques
   there is only one of that sphere generated and its used for every other body (reasonbaly)
   this sphere rendering is used to draw the low-terrain, high-terrain, atmosphere and various clouds layers spheres
   to avoid precision issues, the sphere blocks are scaled and translated to the correct places in camera space on cpu in js
   */

  if (input.levels < 1) {
    throw new Error("Cannot generate less than 1 level");
  }
  if (input.levels > 8) {
    throw new Error("Cannot generate more than 8 levels, that would be insane");
  }

  const descriptions: {
    level: number;
    center: number[];
    fileName: string;
  }[] = [];

  for (let level = 0; level < input.levels; level++) {
    console.log(`\nGenerating level ${(level + 1).toString()}`);
    let printedFirst = false;
    for (const originalTriangle of baseTriangles) {
      process.stdout.write(".");
      const subTriangles = subdivideTriangleMultipleTimes(originalTriangle, 3); // already divide in many smaller ones
      for (const triangle of subTriangles) {
        const subdividedTriangles = subdivideTriangleMultipleTimes(
          triangle,
          level * 2 // wellllll, remember about this
        );

        subdividedTriangles.map((x) => {
          normalizeTriangle(x);
        });
        const vertices = subdividedTriangles.flat();
        const center = verticesCenter(vertices);
        const centerUV = xyzToPolar(center);
        vec3.mul(center, center, [input.radius, input.radius, input.radius]);

        if (!printedFirst) {
          console.log(
            `Triangle count per face ${subdividedTriangles.length.toString()}`
          );
          console.log(
            `Triangle count per sphere ${(subdividedTriangles.length * baseTriangles.length).toString()}`
          );
          console.log(
            `Vertex distance: ${(vec3.distance(vertices[0], vertices[1]) * input.radius).toFixed(3)}`
          );
          printedFirst = true;
        }

        const intermediate = new Object3dIntermediate(
          // Here height might be adjusted according to the image
          // also normal and UV can be adjusted as well
          vertices.map((normal) => {
            const vert: vec3 = vec3.clone(normal);
            vec3.mul(vert, vert, [input.radius, input.radius, input.radius]);
            vec3.sub(vert, vert, center);
            return new Vertex(vert, xyzToPolar(normal), normal);
          })
        );
        printedFirst = true;
        intermediate.recalculateTangents();
        const raw = intermediate.getVertexArray();
        const fileName = `${input.name}-l${level.toString()}-uv${centerUV[0].toFixed(4)}x${centerUV[1].toFixed(4)}.raw`;
        descriptions.push({ level, center: [...center], fileName });
        fs.writeFileSync(path.join(input.outDir, fileName), raw);
      }
    }
    const fileName = `${input.name}-description.json`;
    fs.writeFileSync(
      path.join(input.outDir, fileName),
      JSON.stringify(descriptions, undefined, 2)
    );
  }
}
