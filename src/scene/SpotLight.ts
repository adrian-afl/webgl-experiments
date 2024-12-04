import { mat4, quat, vec3 } from "gl-matrix";

import { glmTemp } from "../glmTemporaryPools.ts";
import { ShaderProgram } from "../gpu/GPUApiInterface.ts";
import { Camera } from "./Camera.ts";

export class SpotLight {
  private readonly perspectiveMatrix: mat4;
  private readonly viewMatrix: mat4;
  public readonly position: vec3;
  public readonly orientation: quat;
  public readonly color: vec3;

  public constructor() {
    this.perspectiveMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.position = vec3.create();
    this.orientation = quat.create();
    this.color = vec3.fromValues(1, 1, 1);
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

  public async setUniformsForRendering(
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

  public async setUniformsForResolving(
    camera: Camera,
    shader: ShaderProgram<{
      lightPerspectiveMatrix: true;
      lightViewMatrix: true;
      lightColor: true;
      lightCameraRelativePosition: true;
    }>
  ): Promise<void> {
    this.updateMatrices();
    await shader.setUniformMatrixArray(
      "lightPerspectiveMatrix",
      4,
      false,
      this.perspectiveMatrix
    );
    await shader.setUniformMatrixArray(
      "lightViewMatrix",
      4,
      false,
      this.viewMatrix
    );
    await shader.setUniform("lightColor", "float", [
      this.color[0],
      this.color[1],
      this.color[2],
    ]);
    vec3.sub(glmTemp.vec3[0], this.position, camera.position);
    await shader.setUniform("lightCameraRelativePosition", "float", [
      glmTemp.vec3[0][0],
      glmTemp.vec3[0][1],
      glmTemp.vec3[0][2],
    ]);
  }
}
