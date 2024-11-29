interface GLMeshCreateResult {
  vao: WebGLVertexArrayObject;
  vertexCount: number;
}

function createMesh(
  gl: WebGL2RenderingContext,
  data: Float32Array
): GLMeshCreateResult {
  if (data.length % 12 !== 0) {
    throw new Error("invalid vertex data");
  }
  const vao = gl.createVertexArray();
  if (!vao) {
    throw new Error("createVertexArray failed");
  }
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  if (!vbo) {
    throw new Error("createBuffer failed");
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 4 * 12, 0);

  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 4 * 12, 4 * 3);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 4 * 12, 4 * 5);

  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 4 * 12, 4 * 8);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return {
    vao,
    vertexCount: data.length / 12,
  };
}

export function createFullScreenQuad(gl: WebGL2RenderingContext): Mesh {
  const fullScreenQuadFloats = new Float32Array([
    1,
    -1,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0, // v1
    -1,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    0,
    0, // v2
    -1,
    -1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0, // v3
    1,
    -1,
    0,
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0, // v4
    1,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    0,
    0,
    0, // v5
    -1,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
  ]); // v6
  return createMesh(gl, fullScreenQuadFloats);
}

export function drawMesh(
  gl: WebGL2RenderingContext,
  mesh: GLMeshCreateResult
): void {
  gl.bindVertexArray(mesh.vao);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
}

export class Mesh {
  private createdMesh: GLMeshCreateResult | null;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
    data: Float32Array
  ) {
    this.createdMesh = createMesh(gl, data);
  }

  public draw(): void {
    if (this.createdMesh) {
      this.gl.bindVertexArray(this.createdMesh.vao);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.createdMesh.vertexCount);
    } else {
      throw new Error("Draw after free");
    }
  }

  public free(): void {
    if (this.createdMesh) {
      this.gl.deleteVertexArray(this.createdMesh.vao);
    }
    this.createdMesh = null;
  }
}
