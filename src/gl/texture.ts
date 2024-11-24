export interface CreateTextureInputBaseWithoutFormats {
  minFilter:
    | WebGL2RenderingContext["LINEAR"]
    | WebGL2RenderingContext["NEAREST"]
    | WebGL2RenderingContext["NEAREST_MIPMAP_NEAREST"]
    | WebGL2RenderingContext["LINEAR_MIPMAP_NEAREST"]
    | WebGL2RenderingContext["NEAREST_MIPMAP_LINEAR"]
    | WebGL2RenderingContext["LINEAR_MIPMAP_LINEAR"];
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
  mipmapped: boolean;
}

export interface CreateTextureInputBase
  extends CreateTextureInputBaseWithoutFormats {
  // https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
  internalFormat:
    | WebGL2RenderingContext["RGBA"]
    | WebGL2RenderingContext["RGB"]
    | WebGL2RenderingContext["LUMINANCE_ALPHA"]
    | WebGL2RenderingContext["LUMINANCE"]
    | WebGL2RenderingContext["ALPHA"]
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

export interface CreateTextureInputFromArrayBufferView
  extends CreateTextureInputBase {
  width: number;
  height: number;

  data: ArrayBufferView | null;
}

export interface CreateTextureInputFromHTMLImage
  extends CreateTextureInputBase {
  data: HTMLImageElement;
}

function isPowerOf2(value: number): boolean {
  return (value & (value - 1)) === 0;
}

export function createTexture2D(
  gl: WebGL2RenderingContext,
  input: CreateTextureInputFromArrayBufferView | CreateTextureInputFromHTMLImage
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("createTexture failed");
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const border = 0;

  if ((input as CreateTextureInputFromArrayBufferView).width) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      input.internalFormat,
      (input as CreateTextureInputFromArrayBufferView).width,
      (input as CreateTextureInputFromArrayBufferView).height,
      border,
      input.format,
      input.type,
      (input as CreateTextureInputFromArrayBufferView).data
    );
  } else {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      input.internalFormat,
      input.format,
      input.type,
      input.data as HTMLImageElement
    );
  }

  if (input.mipmapped) {
    const width =
      (input as { width?: number }).width ??
      (input.data as HTMLImageElement).width;
    const height =
      (input as { height?: number }).height ??
      (input.data as HTMLImageElement).height;
    if (isPowerOf2(width) && isPowerOf2(height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      throw new Error("Dimensions not power of 2, cannot mipmap");
    }
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, input.wrapS ?? gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, input.wrapT ?? gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, input.minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, input.magFilter);

  return texture;
}
