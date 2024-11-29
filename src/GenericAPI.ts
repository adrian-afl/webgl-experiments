export type MaybePromise<T> = Promise<T> | T;

export type GenericShaderUniformType = "int" | "uint" | "float";
export interface GenericShaderUniformVectorArrayType {
  int: Int32Array;
  uint: Uint32Array;
  float: Float32Array;
}

export interface GenericMesh {
  draw(): void;
  free(): void;
}

export interface CreateGenericTextureInput2D {
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

export interface LoadGenericTextureInput2D {
  mipmap: boolean;
  minFilter: "nearest" | "linear" | "mipmap-linear";
  magFilter: "nearest" | "linear";
  wrapX: "clamp" | "repeat" | "mirrored-repeat";
  wrapY: "clamp" | "repeat" | "mirrored-repeat";
}

export interface GenericDefaultFramebuffer {
  clear(color: number[] & { length: 4 }, depth?: number): void;
  bind(): void;
  resize(width: number, height: number): void;
  getSize(): { width: number; height: number };
}

export interface GenericFramebuffer extends GenericDefaultFramebuffer {
  setAttachments(textures: GenericTexture2D[]): void;
}

export interface GenericTexture2D {
  getHandle(): unknown;
}

export interface GenericShaderProgram<T extends Record<string, true>> {
  use(): void;

  setSamplersArray(
    binds: { name: Extract<keyof T, string>; texture: GenericTexture2D }[]
  ): void;

  setUniform(
    name: Extract<keyof T, string>,
    type: GenericShaderUniformType,
    values: number[] & { length: 1 | 2 | 3 | 4 }
  ): void;

  setUniformArray<TV extends GenericShaderUniformType>(
    name: Extract<keyof T, string>,
    type: TV,
    dimensions: 1 | 2 | 3 | 4,
    values: GenericShaderUniformVectorArrayType[TV]
  ): void;

  setUniformMatrixArray(
    name: Extract<keyof T, string>,
    dimensionsBoth: 2 | 3 | 4,
    transpose: boolean,
    values: Float32Array
  ): void;
}

export interface GenericAPI {
  createMesh(data: Float32Array): MaybePromise<GenericMesh>;
  loadMesh(file: string): MaybePromise<GenericMesh>;

  createShader<T extends Record<string, true>>(
    vertex: string,
    fragment: string,
    uniforms: T
  ): MaybePromise<GenericShaderProgram<T>>;

  createTexture2D(
    params: CreateGenericTextureInput2D
  ): MaybePromise<GenericTexture2D>;
  loadTexture2D(
    file: string,
    params: LoadGenericTextureInput2D
  ): MaybePromise<GenericTexture2D>;

  getDefaultFramebuffer(): MaybePromise<GenericDefaultFramebuffer>;
  resizeDefaultFramebuffer(width: number, height: number): MaybePromise<void>;
  createFramebuffer(
    width: number,
    height: number,
    withDepth: boolean
  ): MaybePromise<GenericFramebuffer>;
}
