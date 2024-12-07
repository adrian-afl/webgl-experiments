/*
 Also it would be better to do it in 2 steps - first generate the geometries at various levels, cache it here
 and then use it to create the O3Ds in Three, so the geos are created only once
 */
import { mat3, quat, vec2, vec3 } from "gl-matrix";
import * as fs from "node:fs";
import * as path from "node:path";

import { glmTemp } from "../glmTemporaryPools.ts";
import { Object3dIntermediate, Vertex } from "../media/Object3dIntermediate.ts";
import { loadObjFileAsSingleGeometry } from "../media/loadObjFile.ts";
import { lookAlongQuat } from "./lookAtQuat.ts";

import normalFromMat4 = module;

export interface GenerateIcoSphereInput {
  outDir: string;
  levels: number;
}

type FixedArray<T, L> = T[] & { length: L };
type Triangle = FixedArray<vec3, 3>;

const icoSphere = loadObjFileAsSingleGeometry(
  fs.readFileSync("public/icosphere-3div.obj").toString()
);

const baseTriangles = icoSphere.intermediate.getTriangles();

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

function scaleInPlaceTriangle(tri: Triangle, num: number): void {
  const center = verticesCenter(tri);

  vec3.sub(tri[0], tri[0], center);
  vec3.sub(tri[1], tri[1], center);
  vec3.sub(tri[2], tri[2], center);

  vec3.scale(tri[0], tri[0], num);
  vec3.scale(tri[1], tri[1], num);
  vec3.scale(tri[2], tri[2], num);

  vec3.add(tri[0], tri[0], center);
  vec3.add(tri[1], tri[1], center);
  vec3.add(tri[2], tri[2], center);
}

function scaleTriangle(tri: Triangle, num: number): void {
  vec3.scale(tri[0], tri[0], num);
  vec3.scale(tri[1], tri[1], num);
  vec3.scale(tri[2], tri[2], num);
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

// function polarToXyz(xyIn: vec2): vec3 {
//   const xy: vec2 = [xyIn[0] * 2.0 * Math.PI, xyIn[1] * Math.PI];
//   const z = Math.cos(xy[1]);
//   const x = Math.cos(xy[0]) * Math.sin(xy[1]);
//   const y = Math.sin(xy[0]) * Math.sin(xy[1]);
//   const tmp: vec3 = [x, y, z];
//   vec3.normalize(tmp, tmp);
//   return tmp;
// }

// eslint-disable-next-line @typescript-eslint/require-await
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

  const min = vec3.fromValues(999, 999, 999);
  const max = vec3.fromValues(-999, -999, -999);

  const levelsMeshes: string[] = [];
  //
  /*
    unit triangle of sides 1
    h is 0.8660254038

    y downwards is 1/3 * 0.8660254038 = 0.2886751346
    y upwards is 2/3 = 0.5773502692

    x left is 0.5
    x right is 0.5
 */
  const aAAbaseTriangle: Triangle = [
    [0, 0.5773502692, 0.0],
    [-0.5, -0.2886751346, 0.0],
    [0.5, -0.2886751346, 0.0],
    // [-1, 1, 0],
    // [-1, 0, 0],
    // [0, 1, 1],
  ];

  // const aAAbaseTriangle: Triangle = [
  //   [0, 0, 1.618033988749895],
  //   [-1, 0, -1],
  //   [1, 0, -1],
  // ];

  // const bbbb: Triangle = [
  //   [-1, 1.618033988749895, 0],
  //   [-1.618033988749895, 0, 1],
  //   [0, 1, 1.618033988749895],
  // ];

  const initiallySubdividedTriangle = subdivideTriangleMultipleTimes(
    aAAbaseTriangle,
    2
  );
  scaleInPlaceTriangle(aAAbaseTriangle, 0.7);
  const baseTriangle = initiallySubdividedTriangle[0];
  console.log("COUNT HERE", baseTriangle.length);
  for (let level = 0; level < input.levels; level++) {
    console.log(`generating ${level.toString()}`);
    const subdivided = subdivideTriangleMultipleTimes(
      aAAbaseTriangle,
      level * 2
    );
    subdivided.map((x) => {
      vec3.add(x[0], x[0], [0, 0, 1]);
      vec3.add(x[1], x[1], [0, 0, 1]);
      vec3.add(x[2], x[2], [0, 0, 1]);
      normalizeTriangle(x); // is this really a good idea?
      vec3.sub(x[0], x[0], [0, 0, 1]);
      vec3.sub(x[1], x[1], [0, 0, 1]);
      vec3.sub(x[2], x[2], [0, 0, 1]);
    });
    const vertices = subdivided.flat();

    console.log(`Vertex count  ${vertices.length.toString()}`);
    console.log(
      `Vertex distance for example earth: ${(vec3.distance(vertices[0], vertices[1]) * 6378000).toFixed(3)}`
    );

    const center = verticesCenter(vertices);

    const intermediate = new Object3dIntermediate(
      // Here height might be adjusted according to the image
      // also normal and UV can be adjusted as well
      vertices.map((normal) => {
        const vert: vec3 = vec3.clone(normal);
        vec3.sub(vert, vert, center);
        return new Vertex(vert, xyzToPolar(normal), normal);
      })
    );

    intermediate.recalculateTangents();
    const raw = intermediate.getVertexArray();

    const fileName = `l${level.toString()}.raw`;
    levelsMeshes.push(fileName);
    fs.writeFileSync(path.join(input.outDir, fileName), raw);
  }

  const icoSphere: {
    levelsMeshes: string[];
    positionMatrices: {
      center: vec3;
      mat3: mat3;
    }[];
  } = { levelsMeshes, positionMatrices: [] };

  const firstMat3 = mat3.create();
  const firstMat = false;

  const minDot = -999;

  for (const triangle of baseTriangles) {
    // normalizeTriangle(originalTriangle);
    process.stdout.write(".");
    // const subTriangles = subdivideTriangleMultipleTimes(originalTriangle, 2); // already divide in many smaller ones
    // for (const triangle of originalTriangle) {
    const center = verticesCenter(triangle);
    vec3.scale(center, center, 1.8);

    const u1 = vec3.sub(glmTemp.vec3[2], triangle[1], triangle[0]);
    vec3.normalize(u1, u1);

    const v2a = vec3.sub(glmTemp.vec3[3], triangle[2], triangle[1]);
    vec3.normalize(v2a, v2a);

    const n = vec3.cross(glmTemp.vec3[4], u1, v2a);
    vec3.normalize(n, n);

    const v1 = vec3.cross(glmTemp.vec3[6], n, u1);
    vec3.normalize(v1, v1);

    const a1 = u1;
    const a2 = v1;
    const a3 = n;

    const matrix = mat3.fromValues(
      // its already transposed...
      a1[0],
      a1[1],
      a1[2],

      a2[0],
      a2[1],
      a2[2],

      a3[0],
      a3[1],
      a3[2]
    );

    icoSphere.positionMatrices.push({ center, mat3: matrix });
    // }
  }

  console.log("firstMat", firstMat3);

  console.log("min", min);
  console.log("max", max);

  console.log("main parts count", icoSphere.positionMatrices.length);
  fs.writeFileSync(
    path.join(input.outDir, `icosphere.json`),
    JSON.stringify(icoSphere, undefined, 2)
  );

  const centersStrings = icoSphere.positionMatrices.map((x) => {
    return `vec3(${x.center[0].toString()}, ${x.center[1].toString()}, ${x.center[2].toString()}),`;
  });
  const matricesStrings = icoSphere.positionMatrices.map((x) => {
    return `mat3(${x.mat3[0].toString()}, ${x.mat3[1].toString()}, ${x.mat3[2].toString()}, ${x.mat3[3].toString()}, ${x.mat3[4].toString()}, ${x.mat3[5].toString()}, ${x.mat3[6].toString()}, ${x.mat3[7].toString()}, ${x.mat3[8].toString()}),`;
  });
  const glslCenters = centersStrings.join("\n");
  const glslMatrices = matricesStrings.join("\n");
  fs.writeFileSync(
    path.join(input.outDir, `genCenters.glsl`),
    glslCenters.substring(0, glslCenters.length - 1)
  );
  fs.writeFileSync(
    path.join(input.outDir, `genMatrices.glsl`),
    glslMatrices.substring(0, glslMatrices.length - 1)
  );
}
