export interface CreateAttachmentInputBaseWithoutFormats {
  minFilter:
    | WebGL2RenderingContext["LINEAR"]
    | WebGL2RenderingContext["NEAREST"];
  magFilter:
    | WebGL2RenderingContext["LINEAR"]
    | WebGL2RenderingContext["NEAREST"];
  wrapS?:
    | WebGL2RenderingContext["CLAMP_TO_EDGE"]
    | WebGL2RenderingContext["MIRRORED_REPEAT"]
    | WebGL2RenderingContext["REPEAT"];
  wrapT?:
    | WebGL2RenderingContext["CLAMP_TO_EDGE"]
    | WebGL2RenderingContext["MIRRORED_REPEAT"]
    | WebGL2RenderingContext["REPEAT"];

  // https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
  internalFormat:
    | WebGL2RenderingContext["RGBA"]
    | WebGL2RenderingContext["RGB"]
    | WebGL2RenderingContext["R8"]
    | WebGL2RenderingContext["R16F"]
    | WebGL2RenderingContext["R32F"]
    | WebGL2RenderingContext["R8UI"]
    | WebGL2RenderingContext["RG8"]
    | WebGL2RenderingContext["RG16F"]
    | WebGL2RenderingContext["RG32F"]
    | WebGL2RenderingContext["RG8UI"]
    | WebGL2RenderingContext["RG16UI"]
    | WebGL2RenderingContext["RG32UI"]
    | WebGL2RenderingContext["RGB8"]
    | WebGL2RenderingContext["SRGB8"]
    | WebGL2RenderingContext["RGB565"]
    | WebGL2RenderingContext["R11F_G11F_B10F"]
    | WebGL2RenderingContext["RGB9_E5"]
    | WebGL2RenderingContext["RGB16F"]
    | WebGL2RenderingContext["RGB32F"]
    | WebGL2RenderingContext["RGB8UI"]
    | WebGL2RenderingContext["RGBA8"]
    | WebGL2RenderingContext["SRGB8_ALPHA8"]
    | WebGL2RenderingContext["RGB5_A1"]
    | WebGL2RenderingContext["RGB10_A2"]
    | WebGL2RenderingContext["RGBA4"]
    | WebGL2RenderingContext["RGBA16F"]
    | WebGL2RenderingContext["RGBA32F"]
    | WebGL2RenderingContext["RGBA8UI"];
  format:
    | WebGL2RenderingContext["LUMINANCE_ALPHA"]
    | WebGL2RenderingContext["LUMINANCE"]
    | WebGL2RenderingContext["ALPHA"]
    | WebGL2RenderingContext["RED"]
    | WebGL2RenderingContext["RED_INTEGER"]
    | WebGL2RenderingContext["RG"]
    | WebGL2RenderingContext["RGB"]
    | WebGL2RenderingContext["RGB_INTEGER"]
    | WebGL2RenderingContext["RGBA"]
    | WebGL2RenderingContext["RGBA_INTEGER"];
  type:
    | WebGL2RenderingContext["UNSIGNED_BYTE"]
    | WebGL2RenderingContext["UNSIGNED_SHORT_5_6_5"]
    | WebGL2RenderingContext["UNSIGNED_SHORT_4_4_4_4"]
    | WebGL2RenderingContext["UNSIGNED_SHORT_5_5_5_1"]
    | WebGL2RenderingContext["BYTE"]
    | WebGL2RenderingContext["UNSIGNED_SHORT"]
    | WebGL2RenderingContext["SHORT"]
    | WebGL2RenderingContext["UNSIGNED_INT"]
    | WebGL2RenderingContext["INT"]
    | WebGL2RenderingContext["HALF_FLOAT"]
    | WebGL2RenderingContext["FLOAT"];
}

export function createAttachment(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  parameters: CreateAttachmentInputBaseWithoutFormats
): WebGLTexture {
  const textureColorbuffer = gl.createTexture();
  if (!textureColorbuffer) {
    throw new Error("createTexture failed");
  }
  gl.bindTexture(gl.TEXTURE_2D, textureColorbuffer);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    parameters.internalFormat,
    width,
    height,
    0,
    parameters.format,
    parameters.type,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, parameters.minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, parameters.magFilter);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    parameters.wrapS ?? gl.REPEAT
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    parameters.wrapT ?? gl.REPEAT
  );

  return textureColorbuffer;
}

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

export function attachAttachmentToFramebuffer(
  gl: WebGL2RenderingContext,
  framebuffer: WebGLFramebuffer,
  texture: WebGLTexture,
  index: number
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0 + index,
    gl.TEXTURE_2D,
    texture,
    0
  );

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error("framebufferTexture2D failed, not complete");
  }
}

export function setDrawBuffersCount(
  gl: WebGL2RenderingContext,
  framebuffer: WebGLFramebuffer,
  count: number
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  const buffers: GLenum[] = [];

  for (let i = 0; i < count; i++) {
    buffers.push(gl.COLOR_ATTACHMENT0 + i);
  }
  gl.drawBuffers(buffers);
}
