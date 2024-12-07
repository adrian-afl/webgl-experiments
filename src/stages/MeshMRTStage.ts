import {
  Framebuffer,
  GPUApiInterface,
  ShaderProgram,
  Texture2D,
} from "../gpu/GPUApiInterface.ts";
import { Camera } from "../scene/Camera.ts";
import { Mesh } from "../scene/Mesh.ts";

export interface MRTTextures {
  color: Texture2D;
  distance: Texture2D;
  worldPos: Texture2D;
  normal: Texture2D;
}

export class MeshMRTStage {
  private meshProgram!: ShaderProgram<{
    colorTexture: true;
    elapsed: true;
    perspectiveMatrix: true;
    viewMatrix: true;
    modelMatrix: true;
  }>;
  private framebuffer!: Framebuffer;
  private colorTexture!: Texture2D;
  private distanceTexture!: Texture2D;
  private worldPosTexture!: Texture2D;
  private normalTexture!: Texture2D;

  public constructor(private readonly api: GPUApiInterface) {}

  public async initialize(): Promise<void> {
    this.meshProgram = await this.api.createShader(
      "entrypoints/mesh/mesh.vert",
      "entrypoints/mesh/mesh.frag",
      {
        colorTexture: true,
        elapsed: true,
        perspectiveMatrix: true,
        viewMatrix: true,
        modelMatrix: true,
      } as const
    );

    const defaultFramebuffer = await this.api.getDefaultFramebuffer();
    const size = await defaultFramebuffer.getSize();

    this.framebuffer = await this.api.createFramebuffer(
      size.width,
      size.height,
      true
    );

    await this.createTextures();
  }

  private async createTextures(): Promise<void> {
    const framebufferSize = await this.framebuffer.getSize();

    this.colorTexture = await this.api.createTexture2D({
      ...framebufferSize,
      format: "float16",
      dimensions: 4,
    });

    this.distanceTexture = await this.api.createTexture2D({
      ...framebufferSize,
      format: "float32",
      dimensions: 1,
    });

    this.worldPosTexture = await this.api.createTexture2D({
      ...framebufferSize,
      format: "float32",
      dimensions: 4,
    });

    this.normalTexture = await this.api.createTexture2D({
      ...framebufferSize,
      format: "float32",
      dimensions: 4,
    });

    await this.framebuffer.setAttachments([
      this.colorTexture,
      this.distanceTexture,
      this.worldPosTexture,
      this.normalTexture,
    ]);
  }

  public async recreateTextures(): Promise<void> {
    const defaultFramebuffer = await this.api.getDefaultFramebuffer();
    const size = await defaultFramebuffer.getSize();
    await this.framebuffer.resize(size.width, size.height);
    await this.colorTexture.free();
    await this.distanceTexture.free();
    await this.worldPosTexture.free();
    await this.normalTexture.free();
    await this.createTextures();
  }

  public async draw(
    camera: Camera,
    meshes: Mesh[],
    uniforms: { elapsed: number }
  ): Promise<void> {
    await this.framebuffer.bind();
    await this.framebuffer.clear([0, 0, 0, 1], 1.0);
    await this.meshProgram.use();
    await this.meshProgram.setUniform("elapsed", "float", [uniforms.elapsed]);
    await camera.setUniforms(this.meshProgram);
    const count = meshes.length;
    for (let i = 0; i < count; i++) {
      await meshes[i].setUniforms(camera.position, this.meshProgram);
      await meshes[i].draw(this.meshProgram);
    }
  }

  public getOutputs(): MRTTextures {
    return {
      color: this.colorTexture,
      distance: this.distanceTexture,
      worldPos: this.worldPosTexture,
      normal: this.normalTexture,
    };
  }
}
