import { mat3, mat4, quat, vec3 } from "gl-matrix";

import { glmTemp } from "../glmTemporaryPools.ts";

export function lookAtQuat(out: quat, from: vec3, to: vec3, up: vec3): void {
  mat4.lookAt(glmTemp.mat4[10], from, to, up);
  mat3.fromMat4(glmTemp.mat3[10], glmTemp.mat4[10]);
  quat.fromMat3(out, glmTemp.mat3[10]);
}

export function lookAlongQuat(out: quat, normal: vec3, up: vec3): void {
  vec3.zero(glmTemp.vec3[10]);
  mat4.lookAt(glmTemp.mat4[10], glmTemp.vec3[10], normal, up);
  mat3.fromMat4(glmTemp.mat3[10], glmTemp.mat4[10]);
  quat.fromMat3(out, glmTemp.mat3[10]);
}
