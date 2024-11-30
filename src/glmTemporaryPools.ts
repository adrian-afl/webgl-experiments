import { mat2, mat3, mat4, quat, vec2, vec3, vec4 } from "gl-matrix";

import { initConstArray } from "./util/initArray.ts";

export const glmTemp = {
  vec2: initConstArray(16, () => vec2.create()),
  vec3: initConstArray(16, () => vec3.create()),
  vec4: initConstArray(16, () => vec4.create()),
  mat2: initConstArray(16, () => mat2.create()),
  mat3: initConstArray(16, () => mat3.create()),
  mat4: initConstArray(16, () => mat4.create()),
  quat: initConstArray(16, () => quat.create()),
} as const;
