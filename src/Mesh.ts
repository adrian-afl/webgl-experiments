import {
  GenericGeometry,
  GenericShaderProgram,
  GenericTexture2D,
} from "./GenericAPI.ts";

export class Mesh {
  public constructor(
    private readonly geometry: GenericGeometry,
    private readonly colorTexture: GenericTexture2D
  ) {}

  public draw(
    shaderProgram: GenericShaderProgram<{ colorTexture: true }>
  ): void {
    shaderProgram.setSamplersArray([
      { name: "colorTexture", texture: this.colorTexture },
    ]);
    this.geometry.draw();
  }
}
