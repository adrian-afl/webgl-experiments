export function createFramebuffer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  withDepth: boolean
): WebGLFramebuffer {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    throw new Error("createFramebuffer failed");
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  if (withDepth) {
    const renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT32F,
      width,
      height
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      renderBuffer
    );
  }

  return framebuffer;
}

export function setFramebufferAttachments(
  gl: WebGL2RenderingContext,
  framebuffer: WebGLFramebuffer,
  textures: WebGLTexture[]
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  const buffers: GLenum[] = [];
  for (let i = 0; i < textures.length; i++) {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0 + i,
      gl.TEXTURE_2D,
      textures[i],
      0
    );
    buffers.push(gl.COLOR_ATTACHMENT0 + i);
  }

  gl.drawBuffers(buffers);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error("framebufferTexture2D failed, not complete");
  }
}
