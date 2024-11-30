import { vec2, vec3, vec4 } from "gl-matrix";

export class Vertex {
  public position: vec3;
  public uv: vec2;
  public normal: vec3;
  public tangent: vec4;

  public constructor(
    position: vec3,
    uv: vec2,
    normal: vec3,
    tangent: vec4 = [0.0, 0.0, 0.0, 0.0]
  ) {
    this.position = position;
    this.uv = uv;
    this.normal = normal;
    this.tangent = tangent;
  }
}

export class Object3dIntermediate {
  public readonly vertices: Vertex[];
  public constructor(vertices: Vertex[]) {
    this.vertices = vertices;
    this.recalculateTangents();
  }

  public getVertexArray(): Float32Array {
    const verticesCount = this.vertices.length;
    const arr = new Float32Array(verticesCount * 12);
    let g = 0;
    for (let i = 0; i < verticesCount; i++) {
      const v = this.vertices[i];
      arr[g++] = v.position[0];
      arr[g++] = v.position[1];
      arr[g++] = v.position[2];

      arr[g++] = v.uv[0];
      arr[g++] = v.uv[1];

      arr[g++] = v.normal[0];
      arr[g++] = v.normal[1];
      arr[g++] = v.normal[2];

      arr[g++] = v.tangent[0];
      arr[g++] = v.tangent[1];
      arr[g++] = v.tangent[2];
      arr[g++] = v.tangent[3];
    }
    return arr;
  }

  // vengine port, from 2015, i have forgotten how it works
  public recalculateTangents(): void {
    const t1a: vec3[] = new Array<vec3>();
    const t2a: vec3[] = new Array<vec3>();
    for (let i = 0; i < this.vertices.length; i += 3) {
      const vboIndex1 = i;
      const vboIndex2 = i + 1;
      const vboIndex3 = i + 2;

      const pos1 = this.vertices[vboIndex1].position;
      const pos2 = this.vertices[vboIndex2].position;
      const pos3 = this.vertices[vboIndex3].position;
      const uv1 = this.vertices[vboIndex1].uv;
      const uv2 = this.vertices[vboIndex2].uv;
      const uv3 = this.vertices[vboIndex3].uv;
      // const nor1 = this.vertices[vboIndex1].normal;
      // const nor2 = this.vertices[vboIndex2].normal;
      // const nor3 = this.vertices[vboIndex3].normal;

      const x1 = pos2[0] - pos1[0];
      const x2 = pos3[0] - pos1[0];

      const y1 = pos2[1] - pos1[1];
      const y2 = pos3[1] - pos1[1];

      const z1 = pos2[2] - pos1[2];
      const z2 = pos3[2] - pos1[2];

      const s1 = uv2[0] - uv1[0];
      const s2 = uv3[0] - uv1[0];

      const t1 = uv2[1] - uv1[1];
      const t2 = uv3[1] - uv1[1];

      const r = 1.0 / (s1 * t2 - s2 * t1);
      const sdir: vec3 = [
        (t2 * x1 - t1 * x2) * r,
        (t2 * y1 - t1 * y2) * r,
        (t2 * z1 - t1 * z2) * r,
      ];
      const tdir: vec3 = [
        (s1 * x2 - s2 * x1) * r,
        (s1 * y2 - s2 * y1) * r,
        (s1 * z2 - s2 * z1) * r,
      ];
      t1a.push(sdir);
      t1a.push(sdir);
      t1a.push(sdir);
      t2a.push(tdir);
      t2a.push(tdir);
      t2a.push(tdir);

      // const addedToTangents = new vec4([sdir[0], sdir[1], sdir[2], 0.0]);
      // this.vertices[vboIndex1].tangent = Vector.add(
      //   this.vertices[vboIndex1].tangent,
      //   addedToTangents
      // );
      // this.vertices[vboIndex2].tangent = Vector.add(
      //   this.vertices[vboIndex1].tangent,
      //   addedToTangents
      // );
      // this.vertices[vboIndex3].tangent = Vector.add(
      //   this.vertices[vboIndex1].tangent,
      //   addedToTangents
      // );
    }

    for (let i = 0; i < this.vertices.length; i++) {
      const vboIndex1 = i;

      const nor1 = this.vertices[vboIndex1].normal;
      const tan1 = t1a[i];
      const dot = vec3.dot(nor1, tan1);
      const nor1mulled: vec3 = [0, 0, 0];
      vec3.mul(nor1mulled, nor1, [dot, dot, dot]);
      const difference: vec3 = [0, 0, 0];
      vec3.sub(difference, tan1, nor1mulled);
      vec3.normalize(difference, difference);
      const tan: vec3 = [0, 0, 0];
      vec3.mul(tan, difference, [-1, -1, -1]);
      const tmp: vec3 = [0, 0, 0];
      const h =
        vec3.dot(vec3.cross(tmp, nor1, tan1), t2a[i]) < 0.0 ? -1.0 : 1.0;

      this.vertices[vboIndex1].tangent = [tan[0], tan[1], tan[2], h];
    }
  }

  public recalculateNormalsFlat(): void {
    const verticesCount = this.vertices.length;
    const tmp1: vec3 = [0, 0, 0];
    const tmp2: vec3 = [0, 0, 0];
    for (let i = 0; i < verticesCount; i += 3) {
      const v1 = this.vertices[i];
      const v2 = this.vertices[i + 1];
      const v3 = this.vertices[i + 2];
      vec3.cross(
        v1.normal,
        vec3.sub(tmp1, v2.position, v1.position),
        vec3.sub(tmp2, v3.position, v1.position)
      );
      vec3.normalize(v1.normal, v1.normal);
      v2.normal = v1.normal;
      v3.normal = v1.normal;
    }
  }
}
