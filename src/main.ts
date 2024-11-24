import {
  attachAttachmentToFramebuffer,
  createAttachment,
  createFramebuffer,
  setDrawBuffersCount,
} from "./gl/framebuffer.ts";
import { createFullScreenQuad, drawMesh } from "./gl/mesh.ts";
import { compileProgram } from "./gl/shader.ts";
import { loadAndResolveShaderSource } from "./media/loadAndResolveShaderSource.ts";
import { loadObjFileAsSingleMesh } from "./media/loadObjFile.ts";

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
  outColor = vec4(norm, 1.0);
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
  const program = compileProgram(gl, vs, fs);
  const programOutput = compileProgram(
    gl,
    await loadAndResolveShaderSource("output.vert"),
    await loadAndResolveShaderSource("output.frag")
  );

  const framebuffer = createFramebuffer(gl, 256, 256, true);
  const attachment = createAttachment(gl, 256, 256, {
    magFilter: gl.LINEAR,
    minFilter: gl.LINEAR,
    type: gl.UNSIGNED_BYTE,
    format: gl.RGBA,
    internalFormat: gl.RGBA,
  });
  attachAttachmentToFramebuffer(gl, framebuffer, attachment, 0);
  setDrawBuffersCount(gl, framebuffer, 1);

  const uniformTexLocation = gl.getUniformLocation(programOutput, "tex");

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  const loop = (): void => {
    // render to framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, 256, 256);
    gl.useProgram(program);

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawMesh(gl, mesh);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(programOutput);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, attachment);
    gl.uniform1i(uniformTexLocation, 0);

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawMesh(gl, quad);

    const err = gl.getError();
    if (err !== gl.NO_ERROR) {
      console.error("OpenGL error detected\n");
      switch (err) {
        case gl.INVALID_ENUM:
          console.error("gl.INVALID_ENUM");
          break;
        case gl.INVALID_VALUE:
          console.error("gl.INVALID_VALUE");
          break;
        case gl.INVALID_OPERATION:
          console.error("gl.INVALID_OPERATION");
          break;
        case gl.INVALID_FRAMEBUFFER_OPERATION:
          console.error("gl.INVALID_FRAMEBUFFER_OPERATION");
          break;
        case gl.OUT_OF_MEMORY:
          console.error("gl.OUT_OF_MEMORY");
          break;
      }
    }
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

void initWebGL2();
