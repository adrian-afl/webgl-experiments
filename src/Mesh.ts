import { mat4, quat, vec3 } from "gl-matrix";

import {
  GenericGeometry,
  GenericShaderProgram,
  GenericTexture2D,
} from "./GenericAPI.ts";

export class Mesh {
  public readonly position: vec3;
  public readonly orientation: quat;
  public readonly scale: vec3;
  private readonly modelMatrix: mat4;

  public constructor(
    private readonly geometry: GenericGeometry,
    private readonly colorTexture: GenericTexture2D
  ) {
    this.position = vec3.create();
    this.orientation = quat.create();
    this.scale = vec3.create();
    vec3.set(this.scale, 1, 1, 1);
    this.modelMatrix = mat4.create();
  }

  public draw(
    shaderProgram: GenericShaderProgram<{ colorTexture: true }>
  ): void {
    shaderProgram.setSamplersArray([
      { name: "colorTexture", texture: this.colorTexture },
    ]);
    this.geometry.draw();
  }

  private updateModelMatrix(): void {
    mat4.fromRotationTranslationScale(
      this.modelMatrix,
      this.orientation,
      this.position,
      this.scale
    );
  }

  public setUniforms(
    shader: GenericShaderProgram<{ modelMatrix: true }>
  ): void {
    this.updateModelMatrix();
    shader.setUniformMatrixArray("modelMatrix", 4, false, this.modelMatrix);
  }
}
