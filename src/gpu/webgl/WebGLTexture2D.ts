import { Texture2D, TextureInput2DParameters } from "../GPUApiInterface.ts";

export interface CreateTextureInputBaseWithoutFormats {
  minFilter: number;
  magFilter: number;
  wrapS?: number;
  wrapT?: number;
  mipmap: boolean;
}

export const genericToWebGLMappers = {
  minFilter: (
    v: NonNullable<TextureInput2DParameters["minFilter"]>
  ): number => {
    switch (v) {
      case "nearest":
        return WebGL2RenderingContext.NEAREST;
      case "linear":
        return WebGL2RenderingContext.LINEAR;
      case "mipmap-linear":
        return WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR;
    }
  },

  magFilter: (
    v: NonNullable<TextureInput2DParameters["magFilter"]>
  ): number => {
    switch (v) {
      case "nearest":
        return WebGL2RenderingContext.NEAREST;
      case "linear":
        return WebGL2RenderingContext.LINEAR;
    }
  },

  wrapX: (v: NonNullable<TextureInput2DParameters["wrapX"]>): number => {
    switch (v) {
      case "clamp":
        return WebGL2RenderingContext.CLAMP_TO_EDGE;
      case "repeat":
        return WebGL2RenderingContext.REPEAT;
      case "mirrored-repeat":
        return WebGL2RenderingContext.MIRRORED_REPEAT;
    }
  },

  wrapY: (v: NonNullable<TextureInput2DParameters["wrapY"]>): number => {
    switch (v) {
      case "clamp":
        return WebGL2RenderingContext.CLAMP_TO_EDGE;
      case "repeat":
        return WebGL2RenderingContext.REPEAT;
      case "mirrored-repeat":
        return WebGL2RenderingContext.MIRRORED_REPEAT;
    }
  },

  format: (
    dimensions: TextureInput2DParameters["dimensions"],
    format: TextureInput2DParameters["format"]
  ): {
    internalFormat: number;
    format: number;
    type: number;
    pixelByteSize: number;
  } => {
    switch (format) {
      case "int8":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R8I,
              format: WebGL2RenderingContext.RED,
              type: WebGL2RenderingContext.BYTE,
              pixelByteSize: 1,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG8I,
              format: WebGL2RenderingContext.RG,
              type: WebGL2RenderingContext.BYTE,
              pixelByteSize: 2,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB8I,
              format: WebGL2RenderingContext.RGB,
              type: WebGL2RenderingContext.BYTE,
              pixelByteSize: 3,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA8I,
              format: WebGL2RenderingContext.RGBA,
              type: WebGL2RenderingContext.BYTE,
              pixelByteSize: 4,
            };
        }
        break;
      case "uint8":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R8UI,
              format: WebGL2RenderingContext.RED,
              type: WebGL2RenderingContext.UNSIGNED_BYTE,
              pixelByteSize: 1,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG8UI,
              format: WebGL2RenderingContext.RG,
              type: WebGL2RenderingContext.UNSIGNED_BYTE,
              pixelByteSize: 2,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB8UI,
              format: WebGL2RenderingContext.RGB,
              type: WebGL2RenderingContext.UNSIGNED_BYTE,
              pixelByteSize: 3,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA8UI,
              format: WebGL2RenderingContext.RGBA,
              type: WebGL2RenderingContext.UNSIGNED_BYTE,
              pixelByteSize: 4,
            };
        }
        break;
      case "int16":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R16I,
              format: WebGL2RenderingContext.RED_INTEGER,
              type: WebGL2RenderingContext.SHORT,
              pixelByteSize: 2,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG16I,
              format: WebGL2RenderingContext.RG_INTEGER,
              type: WebGL2RenderingContext.SHORT,
              pixelByteSize: 4,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB16I,
              format: WebGL2RenderingContext.RGB_INTEGER,
              type: WebGL2RenderingContext.SHORT,
              pixelByteSize: 6,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA16I,
              format: WebGL2RenderingContext.RGBA_INTEGER,
              type: WebGL2RenderingContext.SHORT,
              pixelByteSize: 8,
            };
        }
        break;
      case "uint16":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R16UI,
              format: WebGL2RenderingContext.RED_INTEGER,
              type: WebGL2RenderingContext.UNSIGNED_SHORT,
              pixelByteSize: 2,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG16UI,
              format: WebGL2RenderingContext.RG_INTEGER,
              type: WebGL2RenderingContext.UNSIGNED_SHORT,
              pixelByteSize: 4,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB16UI,
              format: WebGL2RenderingContext.RGB_INTEGER,
              type: WebGL2RenderingContext.UNSIGNED_SHORT,
              pixelByteSize: 6,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA16UI,
              format: WebGL2RenderingContext.RGBA_INTEGER,
              type: WebGL2RenderingContext.UNSIGNED_SHORT,
              pixelByteSize: 8,
            };
        }
        break;
      case "int32":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R32I,
              format: WebGL2RenderingContext.RED,
              type: WebGL2RenderingContext.INT,
              pixelByteSize: 4,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG32I,
              format: WebGL2RenderingContext.RG,
              type: WebGL2RenderingContext.INT,
              pixelByteSize: 8,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB32I,
              format: WebGL2RenderingContext.RGB,
              type: WebGL2RenderingContext.INT,
              pixelByteSize: 12,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA32I,
              format: WebGL2RenderingContext.RGBA,
              type: WebGL2RenderingContext.INT,
              pixelByteSize: 16,
            };
        }
        break;
      case "uint32":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R32UI,
              format: WebGL2RenderingContext.RED,
              type: WebGL2RenderingContext.UNSIGNED_INT,
              pixelByteSize: 4,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG32UI,
              format: WebGL2RenderingContext.RG,
              type: WebGL2RenderingContext.UNSIGNED_INT,
              pixelByteSize: 8,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB32UI,
              format: WebGL2RenderingContext.RGB,
              type: WebGL2RenderingContext.UNSIGNED_INT,
              pixelByteSize: 12,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA32UI,
              format: WebGL2RenderingContext.RGBA,
              type: WebGL2RenderingContext.UNSIGNED_INT,
              pixelByteSize: 16,
            };
        }
        break;
      case "float16":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R16F,
              format: WebGL2RenderingContext.RED,
              type: WebGL2RenderingContext.HALF_FLOAT,
              pixelByteSize: 2,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG16F,
              format: WebGL2RenderingContext.RG,
              type: WebGL2RenderingContext.HALF_FLOAT,
              pixelByteSize: 4,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB16F,
              format: WebGL2RenderingContext.RGB,
              type: WebGL2RenderingContext.HALF_FLOAT,
              pixelByteSize: 6,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA16F,
              format: WebGL2RenderingContext.RGBA,
              type: WebGL2RenderingContext.HALF_FLOAT,
              pixelByteSize: 8,
            };
        }
        break;
      case "float32":
        switch (dimensions) {
          case 1:
            return {
              internalFormat: WebGL2RenderingContext.R32F,
              format: WebGL2RenderingContext.RED,
              type: WebGL2RenderingContext.FLOAT,
              pixelByteSize: 4,
            };
          case 2:
            return {
              internalFormat: WebGL2RenderingContext.RG32F,
              format: WebGL2RenderingContext.RG,
              type: WebGL2RenderingContext.FLOAT,
              pixelByteSize: 8,
            };
          case 3:
            return {
              internalFormat: WebGL2RenderingContext.RGB32F,
              format: WebGL2RenderingContext.RGB,
              type: WebGL2RenderingContext.FLOAT,
              pixelByteSize: 12,
            };
          case 4:
            return {
              internalFormat: WebGL2RenderingContext.RGBA32F,
              format: WebGL2RenderingContext.RGBA,
              type: WebGL2RenderingContext.FLOAT,
              pixelByteSize: 16,
            };
        }
        break;
    }
  },
};

export interface CreateTextureInputBase
  extends CreateTextureInputBaseWithoutFormats {
  // https://registry.khronos.org/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
  internalFormat: number;
  format: number;
  type: number;
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

// function isPowerOf2(value: number): boolean {
//   return (value & (value - 1)) === 0;
// }

export class WebGLTexture2D implements Texture2D {
  public readonly handle: WebGLTexture;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly parameters: TextureInput2DParameters,
    input:
      | CreateTextureInputFromArrayBufferView
      | CreateTextureInputFromHTMLImage
  ) {
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

    if (input.mipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
      // Apparently in WebGL2 this is not a requirement anymore
      // const width =
      //   (input as { width?: number }).width ??
      //   (input.data as HTMLImageElement).width;
      // const height =
      //   (input as { height?: number }).height ??
      //   (input.data as HTMLImageElement).height;
      // if (isPowerOf2(width) && isPowerOf2(height)) {
      //   gl.generateMipmap(gl.TEXTURE_2D);
      // } else {
      //   throw new Error("Dimensions not power of 2, cannot mipmap");
      // }
    }

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      input.wrapS ?? gl.REPEAT
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      input.wrapT ?? gl.REPEAT
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, input.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, input.magFilter);

    this.handle = texture;
  }

  public getHandle(): unknown {
    return this.handle;
  }

  public getParameters(): TextureInput2DParameters {
    return this.parameters;
  }

  public getByteSize(): number {
    const mappedFormat = genericToWebGLMappers.format(
      this.parameters.dimensions,
      this.parameters.format
    );
    return (
      this.parameters.width *
      this.parameters.height *
      mappedFormat.pixelByteSize
    );
  }

  public free(): void {
    this.gl.deleteTexture(this.handle);
  }
}
