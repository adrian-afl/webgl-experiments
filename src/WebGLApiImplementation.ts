import {
  CreateGenericTextureInput2D,
  GenericAPI,
  GenericDefaultFramebuffer,
  GenericFramebuffer,
  GenericGeometry,
  GenericShaderProgram,
  GenericTexture2D,
  LoadGenericTextureInput2D,
  MaybePromise,
} from "./GenericAPI.ts";
import { DefaultFramebuffer, Framebuffer } from "./gl/Framebuffer.ts";
import { Geometry } from "./gl/geometry.ts";
import { ShaderProgram } from "./gl/shader.ts";
import { Texture2D, genericToWebGLMappers } from "./gl/texture.ts";
import { loadAndResolveShaderSource } from "./media/loadAndResolveShaderSource.ts";
import { loadObjFileAsSingleGeometry } from "./media/loadObjFile.ts";
import { loadTextureFromImage } from "./media/loadTextureFromImage.ts";

export class WebGLApiImplementation implements GenericAPI {
  private readonly defaultFramebuffer: DefaultFramebuffer;

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
    this.defaultFramebuffer = new DefaultFramebuffer(
      this.gl,
      outputWidth,
      outputHeight,
      withDepth
    );
  }

  public createGeometry(data: Float32Array): MaybePromise<GenericGeometry> {
    return new Geometry(this.gl, data);
  }

  public async loadGeometry(file: string): Promise<GenericGeometry> {
    const fileRequest = await fetch(file);
    if (fileRequest.headers.get("Content-type") === "text/html") {
      throw new Error(`Failed loading mesh ${file}, got html`);
    }
    const fileContent = await fileRequest.text();

    const objFileData = loadObjFileAsSingleGeometry(fileContent);
    return objFileData.intermediate.createDrawableGeometry(this.gl);
  }

  public async createShader<T extends Record<string, true>>(
    vertex: string,
    fragment: string,
    uniforms: T
  ): Promise<GenericShaderProgram<T>> {
    const vertexSrc = await loadAndResolveShaderSource(vertex);
    const fragmentSrc = await loadAndResolveShaderSource(fragment);

    return new ShaderProgram(this.gl, vertexSrc, fragmentSrc, uniforms);
  }

  public createTexture2D(
    params: CreateGenericTextureInput2D
  ): MaybePromise<GenericTexture2D> {
    const mappedFormats = genericToWebGLMappers.format(
      params.dimensions,
      params.format
    );
    return new Texture2D(this.gl, {
      data: params.data,
      width: params.width,
      height: params.height,
      mipmap: params.mipmap,
      internalFormat: mappedFormats.internalFormat,
      type: mappedFormats.type,
      format: mappedFormats.format,
      magFilter: genericToWebGLMappers.magFilter(params.magFilter),
      minFilter: genericToWebGLMappers.minFilter(params.minFilter),
      wrapS: genericToWebGLMappers.wrapX(params.wrapX),
      wrapT: genericToWebGLMappers.wrapY(params.wrapY),
    });
  }

  public loadTexture2D(
    file: string,
    params: LoadGenericTextureInput2D
  ): MaybePromise<GenericTexture2D> {
    return loadTextureFromImage(this.gl, file, {
      mipmap: params.mipmap,
      magFilter: genericToWebGLMappers.magFilter(params.magFilter),
      minFilter: genericToWebGLMappers.minFilter(params.minFilter),
      wrapS: genericToWebGLMappers.wrapX(params.wrapX),
      wrapT: genericToWebGLMappers.wrapY(params.wrapY),
    });
  }

  public getDefaultFramebuffer(): MaybePromise<GenericDefaultFramebuffer> {
    return this.defaultFramebuffer;
  }

  public resizeDefaultFramebuffer(width: number, height: number): void {
    this.defaultFramebuffer.resize(width, height);
  }

  public createFramebuffer(
    width: number,
    height: number,
    withDepth: boolean
  ): MaybePromise<GenericFramebuffer> {
    return new Framebuffer(this.gl, width, height, withDepth);
  }
}
