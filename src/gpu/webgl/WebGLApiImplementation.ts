import { loadObjFileAsSingleGeometry } from "../../media/loadObjFile.ts";
import {
  DefaultFramebuffer,
  Framebuffer,
  GPUApiInterface,
  Geometry,
  LoadTextureInput2D,
  MaybePromise,
  ShaderProgram,
  Texture2D,
  TextureInput2DParameters,
} from "../GPUApiInterface.ts";
import {
  WebGLDefaultFramebuffer,
  WebGLFramebufferClass,
} from "./WebGLFramebuffer.ts";
import { WebGLGeometry } from "./WebGLGeometry.ts";
import { WebGLShaderProgram } from "./WebGLShaderProgram.ts";
import { WebGLTexture2D, genericToWebGLMappers } from "./WebGLTexture2D.ts";
import { loadAndResolveShaderSource } from "./loadAndResolveShaderSource.ts";

export class WebGLApiImplementation implements GPUApiInterface {
  private readonly defaultFramebuffer: WebGLDefaultFramebuffer;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
    outputWidth: number,
    outputHeight: number,
    withDepth: boolean
  ) {
    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error("Rendering to floating point textures not supported");
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    this.defaultFramebuffer = new WebGLDefaultFramebuffer(
      this.gl,
      outputWidth,
      outputHeight,
      withDepth
    );
  }

  public createGeometry(data: Float32Array): MaybePromise<Geometry> {
    return new WebGLGeometry(this.gl, data);
  }

  public async loadGeometry(file: string): Promise<Geometry> {
    const fileRequest = await fetch(file);
    if (fileRequest.headers.get("Content-type") === "text/html") {
      throw new Error(`Failed loading mesh ${file}, got html`);
    }
    if (file.endsWith(".obj")) {
      const fileContent = await fileRequest.text();

      const objFileData = loadObjFileAsSingleGeometry(fileContent);
      return this.createGeometry(objFileData.intermediate.getVertexArray());
    } else if (file.endsWith(".raw")) {
      const fileContent = new Float32Array(await fileRequest.arrayBuffer());
      return this.createGeometry(fileContent);
    } else {
      throw new Error(`Unsupported model type for file ${file}`);
    }
  }

  public async createShader<T extends Record<string, true>>(
    vertex: string,
    fragment: string,
    uniforms: T
  ): Promise<ShaderProgram<T>> {
    const vertexSrc = await loadAndResolveShaderSource(vertex);
    const fragmentSrc = await loadAndResolveShaderSource(fragment);

    return new WebGLShaderProgram(this.gl, vertexSrc, fragmentSrc, uniforms);
  }

  public createTexture2D(
    params: TextureInput2DParameters,
    data?: ArrayBufferView | null
  ): MaybePromise<Texture2D> {
    const mappedFormats = genericToWebGLMappers.format(
      params.dimensions,
      params.format
    );
    return new WebGLTexture2D(this.gl, params, {
      data: data ?? null,
      width: params.width,
      height: params.height,
      mipmap: params.mipmap ?? false,
      internalFormat: mappedFormats.internalFormat,
      type: mappedFormats.type,
      format: mappedFormats.format,
      magFilter: genericToWebGLMappers.magFilter(params.magFilter ?? "nearest"),
      minFilter: genericToWebGLMappers.minFilter(params.minFilter ?? "nearest"),
      wrapS: genericToWebGLMappers.wrapX(params.wrapX ?? "clamp"),
      wrapT: genericToWebGLMappers.wrapY(params.wrapY ?? "clamp"),
    });
  }

  public loadTexture2D(
    file: string,
    params: LoadTextureInput2D
  ): MaybePromise<Texture2D> {
    const webglParams = {
      mipmap: params.mipmap ?? true,
      magFilter: genericToWebGLMappers.magFilter(params.magFilter ?? "linear"),
      minFilter: genericToWebGLMappers.minFilter(params.minFilter ?? "linear"),
      wrapS: genericToWebGLMappers.wrapX(params.wrapX ?? "repeat"),
      wrapT: genericToWebGLMappers.wrapY(params.wrapY ?? "repeat"),
    };
    return new Promise<WebGLTexture2D>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const texture = new WebGLTexture2D(
          this.gl,
          {
            ...params,
            width: image.width,
            height: image.height,
            dimensions: 4,
            format: "uint8",
          },
          {
            format: this.gl.RGBA,
            type: this.gl.UNSIGNED_BYTE,
            internalFormat: this.gl.RGBA,
            ...webglParams,
            data: image,
          }
        );
        resolve(texture);
      };
      image.onerror = reject;
      image.src = file;
    });
  }

  public getDefaultFramebuffer(): MaybePromise<DefaultFramebuffer> {
    return this.defaultFramebuffer;
  }

  public resizeDefaultFramebuffer(width: number, height: number): void {
    this.defaultFramebuffer.resize(width, height);
  }

  public createFramebuffer(
    width: number,
    height: number,
    withDepth: boolean
  ): MaybePromise<Framebuffer> {
    return new WebGLFramebufferClass(this.gl, width, height, withDepth);
  }
}
