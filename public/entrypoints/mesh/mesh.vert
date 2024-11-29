#version 300 es
precision highp float;

uniform float elapsed;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

out vec3 norm;
out vec2 uv;

#include "include/axisAngleMat3.glsl"

void main() {
  norm = inNormal;
  uv = inUV;

  mat3 rotmat = axisAngleMat3(vec3(0.0, 1.0, 0.0), elapsed);

  vec3 transformed = rotmat * inVertexPos.xyz * 0.5;
  transformed.z *= -1.0;

  gl_Position = vec4(transformed, 1.0);
}
