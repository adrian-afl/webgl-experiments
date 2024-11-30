import { mat3, mat4, quat, vec3 } from "gl-matrix";

import { glmTemp } from "../glmTemporaryPools.ts";

export function lookAtQuat(out: quat, from: vec3, to: vec3, up: vec3): void {
  mat4.lookAt(glmTemp.mat4[0], from, to, up);
  mat3.fromMat4(glmTemp.mat3[0], glmTemp.mat4[0]);
  quat.fromMat3(out, glmTemp.mat3[0]);
}

export function lookAlongQuat(out: quat, normal: vec3, up: vec3): void {
  vec3.zero(glmTemp.vec3[0]);
  mat4.lookAt(glmTemp.mat4[0], glmTemp.vec3[0], normal, up);
  mat3.fromMat4(glmTemp.mat3[0], glmTemp.mat4[0]);
  quat.fromMat3(out, glmTemp.mat3[0]);
  console.log(out);
}
