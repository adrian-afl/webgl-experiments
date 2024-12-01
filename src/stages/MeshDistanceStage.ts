import {
  Framebuffer,
  GPUApiInterface,
  ShaderProgram,
  Texture2D,
} from "../gpu/GPUApiInterface.ts";
import { Camera } from "../scene/Camera.ts";
import { Mesh } from "../scene/Mesh.ts";

export class MeshDistanceStage {
  private distanceProgram!: ShaderProgram<{
    perspectiveMatrix: true;
    viewMatrix: true;
    modelMatrix: true;
  }>;
  private framebuffer!: Framebuffer;
  private distanceTexture!: Texture2D;

  public constructor(
    private readonly api: GPUApiInterface,
    private readonly width: number,
    private readonly height: number
  ) {}

  public async initialize(): Promise<void> {
    this.distanceProgram = await this.api.createShader(
      "entrypoints/mesh/distance.vert",
      "entrypoints/mesh/distance.frag",
      {
        perspectiveMatrix: true,
        viewMatrix: true,
        modelMatrix: true,
      } as const
    );

    this.framebuffer = await this.api.createFramebuffer(
      this.width,
      this.height,
      true
    );

    await this.createTextures();
  }

  private async createTextures(): Promise<void> {
    const framebufferSize = await this.framebuffer.getSize();

    this.distanceTexture = await this.api.createTexture2D({
      ...framebufferSize,
      format: "float32",
      dimensions: 1,
    });

    await this.framebuffer.setAttachments([this.distanceTexture]);
  }

  public async draw(camera: Camera, meshes: Mesh[]): Promise<void> {
    await this.framebuffer.bind();
    await this.framebuffer.clear([1, 1, 1, 1], 1.0);
    await this.distanceProgram.use();
    await camera.setUniforms(this.distanceProgram);
    const count = meshes.length;
    for (let i = 0; i < count; i++) {
      await meshes[i].setUniforms(camera.position, this.distanceProgram);
      await meshes[i].drawDistance();
    }
  }

  public getOutput(): Texture2D {
    return this.distanceTexture;
  }
}
