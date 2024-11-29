import {
  GenericDefaultFramebuffer,
  GenericFramebuffer,
  GenericTexture2D,
} from "../GenericAPI.ts";

export class DefaultFramebuffer implements GenericDefaultFramebuffer {
  public readonly handle: WebGLFramebuffer | null = null;
  public constructor(
    protected readonly gl: WebGL2RenderingContext,
    protected width: number,
    protected height: number,
    protected readonly withDepth: boolean
  ) {}

  public clear(color: number[] & { length: 4 }, depth?: number): void {
    this.gl.clearColor(color[0], color[1], color[2], color[3]);
    if (this.withDepth && depth) {
      this.gl.clearDepth(depth);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    } else {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }

  public bind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.handle);
    this.gl.viewport(0, 0, this.width, this.height);
    if (this.withDepth) {
      this.gl.enable(this.gl.DEPTH_TEST);
    } else {
      this.gl.disable(this.gl.DEPTH_TEST);
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public getSize(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height,
    };
  }
}

export class Framebuffer
  extends DefaultFramebuffer
  implements GenericFramebuffer
{
  public override readonly handle: WebGLFramebuffer;
  public constructor(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    withDepth: boolean
  ) {
    super(gl, width, height, withDepth);
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

    this.handle = framebuffer;
  }

  public setAttachments(textures: GenericTexture2D[]): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.handle);
    const buffers: GLenum[] = [];
    for (let i = 0; i < textures.length; i++) {
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        textures[i].getHandle() as WebGLTexture,
        0
      );
      buffers.push(this.gl.COLOR_ATTACHMENT0 + i);
    }

    this.gl.drawBuffers(buffers);

    if (
      this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !==
      this.gl.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error("framebufferTexture2D failed, not complete");
    }
  }
}
