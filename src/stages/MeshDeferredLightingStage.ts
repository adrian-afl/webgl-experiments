import {
  Framebuffer,
  GPUApiInterface,
  Geometry,
  ShaderProgram,
  Texture2D,
} from "../gpu/GPUApiInterface.ts";
import { fullScreenQuadData } from "../media/fullScreenQuadData.ts";
import { Camera } from "../scene/Camera.ts";
import { Mesh } from "../scene/Mesh.ts";
import { SpotLight } from "../scene/SpotLight.ts";
import { MRTTextures } from "./MeshMRTStage.ts";

export class MeshDeferredLightingStage {
  private distanceProgram!: ShaderProgram<{
    perspectiveMatrix: true;
    viewMatrix: true;
    modelMatrix: true;
  }>;

  private distanceFramebuffer!: Framebuffer;
  private distanceTexture!: Texture2D;

  private resolveSpotlightWithShadowMapProgram!: ShaderProgram<{
    distanceTexture: true;
    worldPosTexture: true;
    normalTexture: true;
    lightPerspectiveMatrix: true;
    lightViewMatrix: true;
    lightColor: true;
    lightCameraRelativePosition: true;
  }>;

  private resolvingFramebuffer!: Framebuffer;
  private resolvedLightTexture!: Texture2D;

  private shadowMapSize = [1024, 1024];

  private fullScreenQuadGeometry!: Geometry;

  public constructor(private readonly api: GPUApiInterface) {}

  public async initialize(): Promise<void> {
    this.fullScreenQuadGeometry =
      await this.api.createGeometry(fullScreenQuadData);

    this.distanceProgram = await this.api.createShader(
      "entrypoints/shadowmapping/distance.vert",
      "entrypoints/shadowmapping/distance.frag",
      {
        perspectiveMatrix: true,
        viewMatrix: true,
        modelMatrix: true,
      } as const
    );

    this.resolveSpotlightWithShadowMapProgram = await this.api.createShader(
      "entrypoints/shadowmapping/resolve.vert",
      "entrypoints/shadowmapping/resolve.frag",
      {
        distanceTexture: true,
        worldPosTexture: true,
        normalTexture: true,
        lightPerspectiveMatrix: true,
        lightViewMatrix: true,
        lightColor: true,
        lightCameraRelativePosition: true,
      } as const
    );

    this.distanceFramebuffer = await this.api.createFramebuffer(
      this.shadowMapSize[0],
      this.shadowMapSize[1],
      true
    );

    const defaultFramebuffer = await this.api.getDefaultFramebuffer();
    const size = await defaultFramebuffer.getSize();

    this.resolvingFramebuffer = await this.api.createFramebuffer(
      size.width,
      size.height,
      false
    );

    await this.createTextures();
  }

  private async createTextures(): Promise<void> {
    const distanceFramebufferSize = await this.distanceFramebuffer.getSize();

    this.distanceTexture = await this.api.createTexture2D({
      ...distanceFramebufferSize,
      format: "float32",
      dimensions: 1,
    });

    await this.distanceFramebuffer.setAttachments([this.distanceTexture]);

    const resolvingFramebufferSize = await this.resolvingFramebuffer.getSize();

    this.resolvedLightTexture = await this.api.createTexture2D({
      ...resolvingFramebufferSize,
      format: "float32", // mega overkill, todo
      dimensions: 4,
    });

    await this.resolvingFramebuffer.setAttachments([this.resolvedLightTexture]);
  }

  private async drawShadowMap(light: SpotLight, meshes: Mesh[]): Promise<void> {
    await this.distanceFramebuffer.bind();
    await this.distanceFramebuffer.clear([1, 1, 1, 1], 1.0);
    await this.distanceProgram.use();
    await light.setUniformsForRendering(this.distanceProgram);
    const count = meshes.length;
    for (let i = 0; i < count; i++) {
      await meshes[i].setUniforms(light.position, this.distanceProgram);
      await meshes[i].drawDistance();
    }
  }

  private async drawResolve(
    camera: Camera,
    light: SpotLight,
    mrt: MRTTextures
  ): Promise<void> {
    await this.resolvingFramebuffer.bind();
    await this.resolveSpotlightWithShadowMapProgram.use();
    await light.setUniformsForResolving(
      camera,
      this.resolveSpotlightWithShadowMapProgram
    );
    await this.resolveSpotlightWithShadowMapProgram.setSamplersArray([
      { name: "distanceTexture", texture: this.distanceTexture },
      { name: "worldPosTexture", texture: mrt.worldPos },
      { name: "normalTexture", texture: mrt.normal },
    ]);
    await this.fullScreenQuadGeometry.draw();
  }

  public async draw(
    camera: Camera,
    lights: SpotLight[], // todo in future more types
    meshes: Mesh[],
    mrt: MRTTextures
  ): Promise<void> {
    await this.resolvingFramebuffer.bind();
    await this.resolvingFramebuffer.clear([0, 0, 0, 0], 1.0);
    await this.resolvingFramebuffer.setBlending("add");
    for (const light of lights) {
      await this.drawShadowMap(light, meshes);
      await this.drawResolve(camera, light, mrt);
    }
  }

  public getOutput(): Texture2D {
    return this.resolvedLightTexture;
  }
}
