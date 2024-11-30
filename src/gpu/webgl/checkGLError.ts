export function checkGLError(gl: WebGL2RenderingContext): void {
  const err = gl.getError();
  if (err !== gl.NO_ERROR) {
    console.error("OpenGL error detected\n");
    switch (err) {
      case gl.INVALID_ENUM:
        throw new Error("gl.INVALID_ENUM");
      case gl.INVALID_VALUE:
        throw new Error("gl.INVALID_VALUE");
      case gl.INVALID_OPERATION:
        throw new Error("gl.INVALID_OPERATION");
      case gl.INVALID_FRAMEBUFFER_OPERATION:
        throw new Error("gl.INVALID_FRAMEBUFFER_OPERATION");
      case gl.OUT_OF_MEMORY:
        throw new Error("gl.OUT_OF_MEMORY");
    }
  }
}
