import { WebGLApiImplementation } from "./WebGLApiImplementation.ts";
import { checkGLError } from "./gl/checkGLError.ts";
import { fullScreenQuadData } from "./media/fullScreenQuadData.ts";

if (document.location.search.includes("debug=true")) {
  void import("spectorjs").then((imported) => {
    const spector = new imported.Spector();
    spector.displayUI();
  });
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

  const quad = await api.createMesh(fullScreenQuadData);
  const dingus = await api.loadMesh("dingus.obj");
  const dingusTexture = await api.loadTexture2D("dingus.jpg", {
    magFilter: "linear",
    minFilter: "linear",
    mipmap: true,
    wrapX: "repeat",
    wrapY: "repeat",
  });

  const meshProgram = await api.createShader(
    "entrypoints/mesh/mesh.vert",
    "entrypoints/mesh/mesh.frag",
    { colorTexture: true, elapsed: true }
  );

  const outputProgram = await api.createShader(
    "entrypoints/output/output.vert",
    "entrypoints/output/output.frag",
    { tex: true }
  );

  const defaultFramebuffer = await api.getDefaultFramebuffer();

  const framebuffer = await api.createFramebuffer(2048, 2048, true);

  const colorAttachment = await api.createTexture2D({
    ...framebuffer.getSize(),
    magFilter: "linear",
    minFilter: "linear",
    wrapX: "clamp",
    wrapY: "clamp",
    format: "float16",
    dimensions: 4,
    mipmap: false,
    data: null,
  });

  const distanceAttachment = await api.createTexture2D({
    ...framebuffer.getSize(),
    magFilter: "nearest",
    minFilter: "nearest",
    wrapX: "clamp",
    wrapY: "clamp",
    format: "float32",
    dimensions: 1,
    mipmap: false,
    data: null,
  });

  framebuffer.setAttachments([colorAttachment, distanceAttachment]);

  const startTime = Date.now();

  const loop = (): void => {
    const elapsed = (Date.now() - startTime) / 1000.0;
    framebuffer.bind();
    framebuffer.clear([1, 1, 1, 1], 1.0);
    meshProgram.use();
    meshProgram.setSamplersArray([
      { name: "colorTexture", texture: dingusTexture },
    ]);
    meshProgram.setUniform("elapsed", "float", [elapsed]);
    dingus.draw();

    defaultFramebuffer.bind();
    defaultFramebuffer.clear([1, 0, 0, 1]);
    //
    outputProgram.use();
    outputProgram.setSamplersArray([{ name: "tex", texture: colorAttachment }]);

    quad.draw();
    requestAnimationFrame(loop);

    checkGLError(gl);
  };

  requestAnimationFrame(loop);
}

void initWebGL2();
