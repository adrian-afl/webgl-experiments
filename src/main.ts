import { quat, vec3 } from "gl-matrix";

import {
  DefaultFramebuffer,
  Framebuffer,
  GPUApiInterface,
  Geometry,
  ShaderProgram,
  Texture2D,
} from "./gpu/GPUApiInterface.ts";
import { WebGLApiImplementation } from "./gpu/webgl/WebGLApiImplementation.ts";
import { checkGLError } from "./gpu/webgl/checkGLError.ts";
import { fullScreenQuadData } from "./media/fullScreenQuadData.ts";
import { Camera } from "./scene/Camera.ts";
import { Mesh } from "./scene/Mesh.ts";
import { lookAlongQuat } from "./util/lookAtQuat.ts";

if (document.location.search.includes("debug=true")) {
  void import("spectorjs").then((imported) => {
    const spector = new imported.Spector();
    spector.displayUI();
  });
}

class MeshMRTStage {
  private meshProgram!: ShaderProgram<{
    colorTexture: true;
    elapsed: true;
    perspectiveViewMatrix: true;
    modelMatrix: true;
  }>;
  private framebuffer!: Framebuffer;
  private colorTexture!: Texture2D;
  private distanceTexture!: Texture2D;

  public constructor(private readonly api: GPUApiInterface) {}

  public async initialize(): Promise<void> {
    this.meshProgram = await this.api.createShader(
      "entrypoints/mesh/mesh.vert",
      "entrypoints/mesh/mesh.frag",
      {
        colorTexture: true,
        elapsed: true,
        perspectiveViewMatrix: true,
        modelMatrix: true,
      }
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
      magFilter: "linear",
      minFilter: "linear",
      wrapX: "clamp",
      wrapY: "clamp",
      format: "float16",
      dimensions: 4,
      mipmap: false,
      data: null,
    });

    this.distanceTexture = await this.api.createTexture2D({
      ...framebufferSize,
      magFilter: "nearest",
      minFilter: "nearest",
      wrapX: "clamp",
      wrapY: "clamp",
      format: "float32",
      dimensions: 1,
      mipmap: false,
      data: null,
    });

    await this.framebuffer.setAttachments([
      this.colorTexture,
      this.distanceTexture,
    ]);
  }

  public async recreateTextures(): Promise<void> {
    const defaultFramebuffer = await this.api.getDefaultFramebuffer();
    const size = await defaultFramebuffer.getSize();
    await this.framebuffer.resize(size.width, size.height);
    await this.colorTexture.free();
    await this.distanceTexture.free();
    await this.createTextures();
  }

  public async draw(
    camera: Camera,
    meshes: Mesh[],
    uniforms: { elapsed: number }
  ): Promise<void> {
    await this.framebuffer.bind();
    await this.framebuffer.clear([1, 1, 1, 1], 1.0);
    await this.meshProgram.use();
    await this.meshProgram.setUniform("elapsed", "float", [uniforms.elapsed]);
    await camera.setUniforms(this.meshProgram);
    const count = meshes.length;
    for (let i = 0; i < count; i++) {
      await meshes[i].setUniforms(camera.position, this.meshProgram);
      await meshes[i].draw(this.meshProgram);
    }
  }

  public getOutputs(): {
    color: Texture2D;
    distance: Texture2D;
  } {
    return { color: this.colorTexture, distance: this.distanceTexture };
  }
}

class OutputStage {
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

async function initWebGL2(): Promise<void> {
  const canvas = document.createElement("canvas"); // creates a new canvas element ( <canvas></canvas> )
  canvas.width = 1024;
  canvas.height = 1024;
  document.body.appendChild(canvas); // appends/adds the canvas element to the document's body
  const gl = canvas.getContext("webgl2"); // creates a WebGL2 context, using the canvas

  if (!gl) {
    throw new Error("No WEBGL2 support");
  }

  const api = new WebGLApiImplementation(gl, 1024, 1024, false);

  const dingusGeometry = await api.loadGeometry("dingus.obj");
  const dingusTexture = await api.loadTexture2D("dingus.jpg", {
    magFilter: "linear",
    minFilter: "linear",
    mipmap: true,
    wrapX: "repeat",
    wrapY: "repeat",
  });
  const dingusMesh = new Mesh(dingusGeometry, dingusTexture);

  const scene = [dingusMesh];

  const meshStage = new MeshMRTStage(api);
  await meshStage.initialize();
  let meshStageOutputs = meshStage.getOutputs();

  const outputStage = new OutputStage(api);
  await outputStage.initialize();

  const startTime = Date.now();

  const defaultFramebuffer = await api.getDefaultFramebuffer();

  const camera = new Camera();
  camera.setPerspective(70, 1, 0.01, 1000);
  lookAlongQuat(camera.orientation, [0, 0, -1], [0, 1, 0]);
  vec3.set(camera.position, 0, 0.3, 5);

  const handleResizing = async (force: boolean): Promise<void> => {
    const size = await defaultFramebuffer.getSize();
    if (
      size.width !== document.body.clientWidth ||
      size.height !== document.body.clientHeight ||
      force
    ) {
      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      await defaultFramebuffer.resize(
        document.body.clientWidth,
        document.body.clientHeight
      );
      await meshStage.recreateTextures();
      meshStageOutputs = meshStage.getOutputs();
      const aspect = document.body.clientWidth / document.body.clientHeight;
      camera.setPerspective(70, aspect, 0.01, 1000);
    }
  };

  await handleResizing(true);

  const vec3Up: vec3 = [0, 1, 0];

  const loop = async (): Promise<void> => {
    const elapsed = (Date.now() - startTime) / 1000.0;

    quat.setAxisAngle(dingusMesh.orientation, vec3Up, -elapsed);

    await meshStage.draw(camera, scene, { elapsed });

    await outputStage.draw({
      colorTexture: meshStageOutputs.color,
      distanceTexture: meshStageOutputs.distance,
    });

    // await handleResizing(false);

    checkGLError(gl);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(loop);
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  requestAnimationFrame(loop);
}

void initWebGL2();
