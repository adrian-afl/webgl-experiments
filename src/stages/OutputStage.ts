import {
  DefaultFramebuffer,
  GPUApiInterface,
  Geometry,
  ShaderProgram,
  Texture2D,
} from "../gpu/GPUApiInterface.ts";
import { fullScreenQuadData } from "../media/fullScreenQuadData.ts";

export class OutputStage {
  private outputProgram!: ShaderProgram<{
    colorTexture: true;
    distanceTexture: true;
  }>;
  private framebuffer!: DefaultFramebuffer;
  private fullScreenQuadGeometry!: Geometry;

  public constructor(private readonly api: GPUApiInterface) {}

  public async initialize(): Promise<void> {
    this.fullScreenQuadGeometry =
      await this.api.createGeometry(fullScreenQuadData);

    this.outputProgram = await this.api.createShader(
      "entrypoints/output/output.vert",
      "entrypoints/output/output.frag",
      {
        colorTexture: true,
        distanceTexture: true,
      }
    );

    this.framebuffer = await this.api.getDefaultFramebuffer();
  }

  public async draw(uniforms: {
    colorTexture: Texture2D;
    distanceTexture: Texture2D;
  }): Promise<void> {
    await this.framebuffer.bind();
    await this.framebuffer.clear([1, 1, 1, 1], 1.0);
    await this.outputProgram.use();
    await this.outputProgram.setSamplersArray([
      { name: "colorTexture", texture: uniforms.colorTexture },
      { name: "distanceTexture", texture: uniforms.distanceTexture },
    ]);
    await this.fullScreenQuadGeometry.draw();
  }
}
