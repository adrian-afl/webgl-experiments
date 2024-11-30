export type MaybePromise<T> = Promise<T> | T;

export type ShaderUniformType = "int" | "uint" | "float";
export interface ShaderUniformVectorArrayType {
  int: Int32List;
  uint: Uint32List;
  float: Float32List;
}

export interface CreateTextureInput2D {
  width: number;
  height: number;
  mipmap: boolean;
  dimensions: 1 | 2 | 3 | 4;
  format:
    | "int8"
    | "uint8"
    | "int16"
    | "uint16"
    | "int32"
    | "uint32"
    | "float16"
    | "float32";
  minFilter: "nearest" | "linear" | "mipmap-linear";
  magFilter: "nearest" | "linear";
  wrapX: "clamp" | "repeat" | "mirrored-repeat";
  wrapY: "clamp" | "repeat" | "mirrored-repeat";
  data: ArrayBufferView | null;
}

export interface LoadTextureInput2D {
  mipmap: boolean;
  minFilter: "nearest" | "linear" | "mipmap-linear";
  magFilter: "nearest" | "linear";
  wrapX: "clamp" | "repeat" | "mirrored-repeat";
  wrapY: "clamp" | "repeat" | "mirrored-repeat";
}

export interface Geometry {
  draw(): MaybePromise<void>;
  free(): MaybePromise<void>;
}

export interface DefaultFramebuffer {
  clear(color: number[] & { length: 4 }, depth?: number): MaybePromise<void>;
  bind(): MaybePromise<void>;
  resize(width: number, height: number): MaybePromise<void>;
  getSize(): MaybePromise<{ width: number; height: number }>;
}

export interface Framebuffer extends DefaultFramebuffer {
  setAttachments(textures: Texture2D[]): MaybePromise<void>;
}

export interface Texture2D {
  getHandle(): MaybePromise<unknown>;
  free(): MaybePromise<void>;
}

export interface ShaderProgram<T extends Record<string, true>> {
  use(): MaybePromise<void>;

  setSamplersArray(
    binds: { name: Extract<keyof T, string>; texture: Texture2D }[]
  ): MaybePromise<void>;

  setUniform(
    name: Extract<keyof T, string>,
    type: ShaderUniformType,
    values: number[] & { length: 1 | 2 | 3 | 4 }
  ): MaybePromise<void>;

  setUniformArray<TV extends ShaderUniformType>(
    name: Extract<keyof T, string>,
    type: TV,
    dimensions: 1 | 2 | 3 | 4,
    values: ShaderUniformVectorArrayType[TV]
  ): MaybePromise<void>;

  setUniformMatrixArray(
    name: Extract<keyof T, string>,
    dimensionsBoth: 2 | 3 | 4,
    transpose: boolean,
    values: Float32List
  ): MaybePromise<void>;
}

export interface GPUApiInterface {
  createGeometry(data: Float32Array): MaybePromise<Geometry>;
  loadGeometry(file: string): MaybePromise<Geometry>;

  createShader<T extends Record<string, true>>(
    vertex: string,
    fragment: string,
    uniforms: T
  ): MaybePromise<ShaderProgram<T>>;

  createTexture2D(params: CreateTextureInput2D): MaybePromise<Texture2D>;
  loadTexture2D(
    file: string,
    params: LoadTextureInput2D
  ): MaybePromise<Texture2D>;

  getDefaultFramebuffer(): MaybePromise<DefaultFramebuffer>;
  resizeDefaultFramebuffer(width: number, height: number): MaybePromise<void>;
  createFramebuffer(
    width: number,
    height: number,
    withDepth: boolean
  ): MaybePromise<Framebuffer>;
}
