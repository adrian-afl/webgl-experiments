import { Texture2D } from "./texture.ts";

function compileShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("createShader failed");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean;
  if (!status) {
    console.log(gl.getShaderInfoLog(shader));
  }

  return status ? shader : null;
}

function compileProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );
  if (!vertexShader || !fragmentShader) {
    throw new Error("compiling shaders failed");
  }

  const program = gl.createProgram();
  if (!program) {
    throw new Error("createProgram failed");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const status = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
  if (!status) {
    console.log(gl.getProgramInfoLog(program));
    throw new Error("program linking failed failed");
  }

  return program;
}

// weird type!!!! but can live with this, kind of like prisma
export class ShaderProgram<T extends Record<string, true>> {
  public readonly handle: WebGLProgram;
  private readonly uniformsLocationsMap: Map<string, WebGLUniformLocation> =
    new Map<string, WebGLUniformLocation>();
  public constructor(
    private readonly gl: WebGL2RenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
    uniforms: T
  ) {
    this.handle = compileProgram(gl, vertexShaderSource, fragmentShaderSource);
    for (const key in uniforms) {
      const location = gl.getUniformLocation(this.handle, key);
      if (!location) {
        throw new Error(`Cannot find the location of uniform ${key}`);
      }
      this.uniformsLocationsMap.set(key, location);
    }
  }

  public use(): void {
    this.gl.useProgram(this.handle);
  }

  public getUniformLocation(
    name: Extract<keyof T, string>
  ): WebGLUniformLocation {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.uniformsLocationsMap.get(name)!; // im 100% sure its not null here
  }

  public bindSampler(
    name: Extract<keyof T, string>,
    slot: number,
    texture: Texture2D
  ): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + slot);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture.handle);
    this.gl.uniform1i(this.getUniformLocation(name), slot);
  }

  // public bindSamplers(
  //   name: Extract<keyof T, string>,
  //   slot: number,
  //   texture: Texture2D
  // ): void {
  //   // Can be done and also could set the slots automatically!!
  // }

  // public updateUniforms(data: Partial<Record<keyof T, >>)
}
