import { mat4, quat, vec3 } from "gl-matrix";

import { ShaderProgram } from "../gpu/GPUApiInterface.ts";

export class Camera {
  private readonly perspectiveMatrix: mat4;
  private readonly viewMatrix: mat4;
  public readonly position: vec3;
  public readonly orientation: quat;

  public constructor() {
    this.perspectiveMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.position = vec3.create();
    this.orientation = quat.create();
  }

  public setPerspective(
    fov: number,
    aspect: number,
    near: number,
    far: number
  ): void {
    mat4.perspective(this.perspectiveMatrix, fov, aspect, near, far);
  }

  public setOrthographic(
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number
  ): void {
    mat4.ortho(this.perspectiveMatrix, left, right, top, bottom, near, far);
  }

  private updateMatrices(): void {
    mat4.fromQuat(this.viewMatrix, this.orientation);
  }

  public async setUniforms(
    shader: ShaderProgram<{ perspectiveMatrix: true; viewMatrix: true }>
  ): Promise<void> {
    this.updateMatrices();
    await shader.setUniformMatrixArray(
      "perspectiveMatrix",
      4,
      false,
      this.perspectiveMatrix
    );
    await shader.setUniformMatrixArray("viewMatrix", 4, false, this.viewMatrix);
  }
}
