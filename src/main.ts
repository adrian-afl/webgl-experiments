import { DefaultFramebuffer, Framebuffer } from "./gl/Framebuffer.ts";
import { checkGLError } from "./gl/checkGLError.ts";
import { createFullScreenQuad, drawMesh } from "./gl/mesh.ts";
import { ShaderProgram } from "./gl/shader.ts";
import { Texture2D } from "./gl/texture.ts";
import { loadAndResolveShaderSource } from "./media/loadAndResolveShaderSource.ts";
import { loadObjFileAsSingleMesh } from "./media/loadObjFile.ts";

if (document.location.search.includes("debug=true")) {
  void import("spectorjs").then((imported) => {
    const spector = new imported.Spector();
    spector.displayUI();
  });
}

const vs = `#version 300 es 
precision highp float;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

out vec3 norm;

void main(){
  gl_Position =  vec4(inVertexPos.xy * 0.1, inVertexPos.z * 0.1, 1.0);
  norm = inNormal;
}
`;

const fs = `#version 300 es 
precision highp float;

uniform sampler2D tex;

in vec3 norm;

out vec4 outColor;

void main(){
  float c = dot(norm, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
  outColor = vec4(c, c, c, 1.0);
}
`;

async function initWebGL2(): Promise<void> {
  const canvas = document.createElement("canvas"); // creates a new canvas element ( <canvas></canvas> )
  canvas.width = 1024;
  canvas.height = 1024;
  document.body.appendChild(canvas); // appends/adds the canvas element to the document's body
  const gl = canvas.getContext("webgl2"); // creates a WebGL2 context, using the canvas

  if (!gl) {
    throw new Error("No WEBGL2 support");
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  gl.clearColor(1.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const lucyObjFileRequest = await fetch("lucylowpoly.obj");
  const lucyObjFileContent = await lucyObjFileRequest.text();

  // const tex = await loadTextureFromImage(gl, "texture.png", {
  //   magFilter: gl.LINEAR,
  //   minFilter: gl.LINEAR_MIPMAP_LINEAR,
  //   mipmapped: true,
  // });

  const lucyIntermediate = loadObjFileAsSingleMesh(lucyObjFileContent);
  const mesh = lucyIntermediate.intermediate.createDrawableMesh(gl);
  const quad = createFullScreenQuad(gl);
  const program = new ShaderProgram(gl, vs, fs, {});
  const programOutput = new ShaderProgram(
    gl,
    await loadAndResolveShaderSource("entrypoints/output/output.vert"),
    await loadAndResolveShaderSource("entrypoints/output/output.frag"),
    { tex: true }
  );

  const defaultFramebuffer = new DefaultFramebuffer(
    gl,
    canvas.width,
    canvas.height,
    false
  );

  const framebuffer = new Framebuffer(gl, 256, 256, true);

  const attachment = new Texture2D(gl, {
    width: 256,
    height: 256,
    magFilter: gl.LINEAR,
    minFilter: gl.LINEAR,
    type: gl.UNSIGNED_BYTE,
    format: gl.RGBA,
    internalFormat: gl.RGBA,
    mipmapped: false,
    data: null,
  });

  framebuffer.setAttachments([attachment]);

  gl.enable(gl.CULL_FACE);

  const loop = (): void => {
    framebuffer.bind();
    framebuffer.clear();
    program.use();
    drawMesh(gl, mesh);

    defaultFramebuffer.bind();
    defaultFramebuffer.clear();

    programOutput.use();
    programOutput.bindSampler("tex", 0, attachment);

    drawMesh(gl, quad);

    checkGLError(gl);
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

void initWebGL2();
