import { Texture2D } from "./texture.ts";

export class DefaultFramebuffer {
  public readonly handle: WebGLFramebuffer | null = null;
  public constructor(
    protected readonly gl: WebGL2RenderingContext,
    protected readonly width: number,
    protected readonly height: number,
    protected readonly withDepth: boolean
  ) {}

  public clear(red = 0, green = 0, blue = 0, alpha = 1, depth = 1): void {
    this.gl.clearColor(red, green, blue, alpha);
    if (this.withDepth) {
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
}

export class Framebuffer extends DefaultFramebuffer {
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

  public setAttachments(textures: Texture2D[]): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.handle);
    const buffers: GLenum[] = [];
    for (let i = 0; i < textures.length; i++) {
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        textures[i].handle,
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
