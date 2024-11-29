import { GenericGeometry } from "../GenericAPI.ts";

interface GLGeometryCreateResult {
  vao: WebGLVertexArrayObject;
  vertexCount: number;
}

function createGeometry(
  gl: WebGL2RenderingContext,
  data: Float32Array
): GLGeometryCreateResult {
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

export function drawGeometry(
  gl: WebGL2RenderingContext,
  mesh: GLGeometryCreateResult
): void {
  gl.bindVertexArray(mesh.vao);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
}

export class Geometry implements GenericGeometry {
  private createdGeometry: GLGeometryCreateResult | null;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
    data: Float32Array
  ) {
    this.createdGeometry = createGeometry(gl, data);
  }

  public draw(): void {
    if (this.createdGeometry) {
      this.gl.bindVertexArray(this.createdGeometry.vao);
      this.gl.drawArrays(
        this.gl.TRIANGLES,
        0,
        this.createdGeometry.vertexCount
      );
    } else {
      throw new Error("Draw after free");
    }
  }

  public free(): void {
    if (this.createdGeometry) {
      this.gl.deleteVertexArray(this.createdGeometry.vao);
    }
    this.createdGeometry = null;
  }
}
