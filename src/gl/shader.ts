import {
  GenericShaderProgram,
  GenericShaderUniformType,
  GenericShaderUniformVectorArrayType,
  GenericTexture2D,
} from "../GenericAPI.ts";

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
export class ShaderProgram<T extends Record<string, true>>
  implements GenericShaderProgram<T>
{
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

  private getUniformLocation(
    name: Extract<keyof T, string>
  ): WebGLUniformLocation {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.uniformsLocationsMap.get(name)!; // im 100% sure its not null here
  }
  //
  // public setSampler(
  //   name: Extract<keyof T, string>,
  //   slot: number,
  //   texture: Texture2D
  // ): void {
  //   this.gl.activeTexture(this.gl.TEXTURE0 + slot);
  //   this.gl.bindTexture(this.gl.TEXTURE_2D, texture.handle);
  //   this.gl.uniform1i(this.getUniformLocation(name), slot);
  // }

  public setSamplersArray(
    // this MIGHT have performance penality but fuck it anyway
    binds: { name: Extract<keyof T, string>; texture: GenericTexture2D }[]
  ): void {
    for (let i = 0; i < binds.length; i++) {
      this.gl.activeTexture(this.gl.TEXTURE0 + i);
      this.gl.bindTexture(
        this.gl.TEXTURE_2D,
        binds[i].texture.getHandle() as WebGLTexture
      );
      this.gl.uniform1i(this.getUniformLocation(binds[i].name), i);
    }
  }

  public setUniform(
    name: Extract<keyof T, string>,
    type: GenericShaderUniformType,
    values: number[] & { length: 1 | 2 | 3 | 4 }
  ): void {
    switch (values.length) {
      case 1:
        this.setUniform1(name, type, values[0]);
        break;
      case 2:
        this.setUniform2(name, type, values[0], values[1]);
        break;
      case 3:
        this.setUniform3(name, type, values[0], values[1], values[2]);
        break;
      case 4:
        this.setUniform4(
          name,
          type,
          values[0],
          values[1],
          values[2],
          values[3]
        );
        break;
    }
  }

  private setUniform1(
    name: Extract<keyof T, string>,
    type: GenericShaderUniformType,
    value: number
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform1f(this.getUniformLocation(name), value);
        break;
      case "int":
        this.gl.uniform1i(this.getUniformLocation(name), value);
        break;
      case "uint":
        this.gl.uniform1ui(this.getUniformLocation(name), value);
        break;
    }
  }

  private setUniform2(
    name: Extract<keyof T, string>,
    type: GenericShaderUniformType,
    x: number,
    y: number
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform2f(this.getUniformLocation(name), x, y);
        break;
      case "int":
        this.gl.uniform2i(this.getUniformLocation(name), x, y);
        break;
      case "uint":
        this.gl.uniform2ui(this.getUniformLocation(name), x, y);
        break;
    }
  }

  private setUniform3(
    name: Extract<keyof T, string>,
    type: GenericShaderUniformType,
    x: number,
    y: number,
    z: number
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform3f(this.getUniformLocation(name), x, y, z);
        break;
      case "int":
        this.gl.uniform3i(this.getUniformLocation(name), x, y, z);
        break;
      case "uint":
        this.gl.uniform3ui(this.getUniformLocation(name), x, y, z);
        break;
    }
  }

  private setUniform4(
    name: Extract<keyof T, string>,
    type: GenericShaderUniformType,
    x: number,
    y: number,
    z: number,
    w: number
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform4f(this.getUniformLocation(name), x, y, z, w);
        break;
      case "int":
        this.gl.uniform4i(this.getUniformLocation(name), x, y, z, w);
        break;
      case "uint":
        this.gl.uniform4ui(this.getUniformLocation(name), x, y, z, w);
        break;
    }
  }

  public setUniformArray<TV extends GenericShaderUniformType>(
    name: Extract<keyof T, string>,
    type: TV,
    dimensions: 1 | 2 | 3 | 4,
    values: GenericShaderUniformVectorArrayType[TV]
  ): void {
    switch (dimensions) {
      case 1:
        this.setUniform1Array(name, type, values);
        break;
      case 2:
        this.setUniform2Array(name, type, values);
        break;
      case 3:
        this.setUniform3Array(name, type, values);
        break;
      case 4:
        this.setUniform4Array(name, type, values);
        break;
    }
  }

  private setUniform1Array<TV extends GenericShaderUniformType>(
    name: Extract<keyof T, string>,
    type: TV,
    values: GenericShaderUniformVectorArrayType[TV]
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform1fv(this.getUniformLocation(name), values);
        break;
      case "int":
        this.gl.uniform1iv(this.getUniformLocation(name), values);
        break;
      case "uint":
        this.gl.uniform1uiv(this.getUniformLocation(name), values);
        break;
    }
  }

  private setUniform2Array<TV extends GenericShaderUniformType>(
    name: Extract<keyof T, string>,
    type: TV,
    values: GenericShaderUniformVectorArrayType[TV]
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform2fv(this.getUniformLocation(name), values);
        break;
      case "int":
        this.gl.uniform2iv(this.getUniformLocation(name), values);
        break;
      case "uint":
        this.gl.uniform2uiv(this.getUniformLocation(name), values);
        break;
    }
  }

  private setUniform3Array<TV extends GenericShaderUniformType>(
    name: Extract<keyof T, string>,
    type: TV,
    values: GenericShaderUniformVectorArrayType[TV]
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform3fv(this.getUniformLocation(name), values);
        break;
      case "int":
        this.gl.uniform3iv(this.getUniformLocation(name), values);
        break;
      case "uint":
        this.gl.uniform3uiv(this.getUniformLocation(name), values);
        break;
    }
  }

  private setUniform4Array<TV extends GenericShaderUniformType>(
    name: Extract<keyof T, string>,
    type: TV,
    values: GenericShaderUniformVectorArrayType[TV]
  ): void {
    switch (type) {
      case "float":
        this.gl.uniform4fv(this.getUniformLocation(name), values);
        break;
      case "int":
        this.gl.uniform4iv(this.getUniformLocation(name), values);
        break;
      case "uint":
        this.gl.uniform4uiv(this.getUniformLocation(name), values);
        break;
    }
  }

  public setUniformMatrixArray(
    name: Extract<keyof T, string>,
    dimensionsBoth: 2 | 3 | 4,
    transpose: boolean,
    values: Float32Array
  ): void {
    switch (dimensionsBoth) {
      case 2:
        this.gl.uniformMatrix2fv(
          this.getUniformLocation(name),
          transpose,
          values
        );
        break;
      case 3:
        this.gl.uniformMatrix3fv(
          this.getUniformLocation(name),
          transpose,
          values
        );
        break;
      case 4:
        this.gl.uniformMatrix4fv(
          this.getUniformLocation(name),
          transpose,
          values
        );
        break;
    }
  }
}
