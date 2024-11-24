import {
  CreateTextureInputBaseWithoutFormats,
  createTexture2D,
} from "../gl/texture.ts";

export function loadTextureFromImage(
  gl: WebGL2RenderingContext,
  url: string,
  parameters: CreateTextureInputBaseWithoutFormats
): Promise<WebGLTexture> {
  return new Promise<WebGLTexture>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const texture = createTexture2D(gl, {
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        internalFormat: gl.RGBA,
        ...parameters,
        data: image,
      });
      resolve(texture);
    };
    image.onerror = reject;
    image.src = url;
  });
}
