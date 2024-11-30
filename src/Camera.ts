import { mat4, quat } from "gl-matrix";

import { GenericShaderProgram } from "./GenericAPI.ts";
import { glmTemp } from "./glmTemporaryPools.ts";

export class Camera {
  private readonly perspectiveMatrix: mat4;
  private readonly perspectiveViewMatrix: mat4;
  public readonly orientation: quat;

  public constructor() {
    this.perspectiveMatrix = mat4.create();
    this.perspectiveViewMatrix = mat4.create();
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

  private updatePerspectiveViewMatrix(): void {
    mat4.fromQuat(glmTemp.mat4[0], this.orientation);
    mat4.mul(
      this.perspectiveViewMatrix,
      this.perspectiveMatrix,
      glmTemp.mat4[0]
    );
  }

  public setUniforms(
    shader: GenericShaderProgram<{ perspectiveViewMatrix: true }>
  ): void {
    this.updatePerspectiveViewMatrix();
    shader.setUniformMatrixArray(
      "perspectiveViewMatrix",
      4,
      false,
      this.perspectiveViewMatrix
    );
  }
}
