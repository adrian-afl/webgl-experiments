import { mat4, quat, vec3 } from "gl-matrix";

import { glmTemp } from "../glmTemporaryPools.ts";
import { Geometry, ShaderProgram, Texture2D } from "../gpu/GPUApiInterface.ts";

export class Mesh {
  public readonly position: vec3;
  public readonly orientation: quat;
  public readonly scale: vec3;
  private readonly modelMatrix: mat4;

  public constructor(
    private readonly geometry: Geometry,
    private readonly colorTexture: Texture2D
  ) {
    this.position = vec3.create();
    this.orientation = quat.create();
    this.scale = vec3.create();
    vec3.set(this.scale, 1, 1, 1);
    this.modelMatrix = mat4.create();
  }

  public async draw(
    shaderProgram: ShaderProgram<{ colorTexture: true }>
  ): Promise<void> {
    await shaderProgram.setSamplersArray([
      { name: "colorTexture", texture: this.colorTexture },
    ]);
    await this.geometry.draw();
  }

  public async drawDistance(): Promise<void> {
    await this.geometry.draw();
  }

  private updateModelMatrix(cameraPosition: vec3): void {
    vec3.sub(glmTemp.vec3[0], this.position, cameraPosition);
    mat4.fromRotationTranslationScale(
      this.modelMatrix,
      this.orientation,
      glmTemp.vec3[0],
      this.scale
    );
  }

  public async setUniforms(
    cameraPosition: vec3,
    shader: ShaderProgram<{ modelMatrix: true }>
  ): Promise<void> {
    this.updateModelMatrix(cameraPosition);
    await shader.setUniformMatrixArray(
      "modelMatrix",
      4,
      false,
      this.modelMatrix
    );
  }
}
