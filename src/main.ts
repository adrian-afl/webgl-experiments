import {
  GenericAPI,
  GenericDefaultFramebuffer,
  GenericFramebuffer,
  GenericGeometry,
  GenericShaderProgram,
  GenericTexture2D,
} from "./GenericAPI.ts";
import { Mesh } from "./Mesh.ts";
import { WebGLApiImplementation } from "./WebGLApiImplementation.ts";
import { checkGLError } from "./gl/checkGLError.ts";
import { fullScreenQuadData } from "./media/fullScreenQuadData.ts";

if (document.location.search.includes("debug=true")) {
  void import("spectorjs").then((imported) => {
    const spector = new imported.Spector();
    spector.displayUI();
  });
}

class MeshMRTStage {
  private meshProgram!: GenericShaderProgram<{
    colorTexture: true;
    elapsed: true;
  }>;
  private framebuffer!: GenericFramebuffer;
  private colorTexture!: GenericTexture2D;
  private distanceTexture!: GenericTexture2D;

  public constructor(private readonly api: GenericAPI) {}

  public async initialize(): Promise<void> {
    this.meshProgram = await this.api.createShader(
      "entrypoints/mesh/mesh.vert",
      "entrypoints/mesh/mesh.frag",
      { colorTexture: true, elapsed: true }
    );

    this.framebuffer = await this.api.createFramebuffer(2048, 2048, true);

    this.colorTexture = await this.api.createTexture2D({
      ...this.framebuffer.getSize(),
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
      ...this.framebuffer.getSize(),
      magFilter: "nearest",
      minFilter: "nearest",
      wrapX: "clamp",
      wrapY: "clamp",
      format: "float32",
      dimensions: 1,
      mipmap: false,
      data: null,
    });

    this.framebuffer.setAttachments([this.colorTexture, this.distanceTexture]);
  }

  public draw(meshes: Mesh[], uniforms: { elapsed: number }): void {
    this.framebuffer.bind();
    this.framebuffer.clear([1, 1, 1, 1], 1.0);
    this.meshProgram.use();
    this.meshProgram.setUniform("elapsed", "float", [uniforms.elapsed]);
    const count = meshes.length;
    for (let i = 0; i < count; i++) {
      meshes[i].draw(this.meshProgram);
    }
  }

  public getOutputs(): {
    color: GenericTexture2D;
    distance: GenericTexture2D;
  } {
    return { color: this.colorTexture, distance: this.distanceTexture };
  }
}

class OutputStage {
  private outputProgram!: GenericShaderProgram<{
    colorTexture: true;
    distanceTexture: true;
  }>;
  private framebuffer!: GenericDefaultFramebuffer;
  private fullScreenQuadGeometry!: GenericGeometry;

  public constructor(private readonly api: GenericAPI) {}

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

  public draw(uniforms: {
    colorTexture: GenericTexture2D;
    distanceTexture: GenericTexture2D;
  }): void {
    this.framebuffer.bind();
    this.framebuffer.clear([1, 1, 1, 1], 1.0);
    this.outputProgram.use();
    this.outputProgram.setSamplersArray([
      { name: "colorTexture", texture: uniforms.colorTexture },
      { name: "distanceTexture", texture: uniforms.distanceTexture },
    ]);
    this.fullScreenQuadGeometry.draw();
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
  const dignusMesh = new Mesh(dingusGeometry, dingusTexture);

  const scene = [dignusMesh];

  const meshStage = new MeshMRTStage(api);
  await meshStage.initialize();
  const meshStageOutputs = meshStage.getOutputs();

  const outputStage = new OutputStage(api);
  await outputStage.initialize();

  const startTime = Date.now();

  const loop = (): void => {
    const elapsed = (Date.now() - startTime) / 1000.0;
    meshStage.draw(scene, { elapsed });

    outputStage.draw({
      colorTexture: meshStageOutputs.color,
      distanceTexture: meshStageOutputs.distance,
    });

    requestAnimationFrame(loop);

    checkGLError(gl);
  };

  requestAnimationFrame(loop);
}

void initWebGL2();
