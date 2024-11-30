import {
  DefaultFramebuffer,
  Framebuffer,
  Texture2D,
} from "../GPUApiInterface.ts";

export class WebGLDefaultFramebuffer implements DefaultFramebuffer {
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

export class WebGLFramebufferClass
  extends WebGLDefaultFramebuffer
  implements Framebuffer
{
  public override readonly handle: WebGLFramebuffer;
  private framebuffer: WebGLFramebuffer;
  private renderBuffer: WebGLRenderbuffer | null = null;
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
    this.framebuffer = framebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    if (this.withDepth) {
      this.renderBuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer);
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
        this.renderBuffer
      );
    }

    this.handle = framebuffer;
  }

  public override resize(width: number, height: number): void {
    super.resize(width, height);

    if (this.withDepth) {
      if (this.renderBuffer) {
        this.gl.deleteRenderbuffer(this.renderBuffer);
      }
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
      this.renderBuffer = this.gl.createRenderbuffer();
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
      this.gl.renderbufferStorage(
        this.gl.RENDERBUFFER,
        this.gl.DEPTH_COMPONENT32F,
        width,
        height
      );
      this.gl.framebufferRenderbuffer(
        this.gl.FRAMEBUFFER,
        this.gl.DEPTH_ATTACHMENT,
        this.gl.RENDERBUFFER,
        this.renderBuffer
      );
    }
  }

  public setAttachments(textures: Texture2D[]): void {
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
