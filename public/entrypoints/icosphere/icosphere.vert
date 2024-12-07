#version 300 es
precision highp float;

uniform float elapsed;
uniform mat4 perspectiveMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

out vec3 norm;
out vec3 sphereSpace;
out vec3 worldPos;
out vec2 uv;

uniform vec3 sphereCenter;
uniform float scale;
uniform int index;
uniform vec4 centers[320];
uniform vec4 centersWithoutTranslation[320];
uniform mat4 matrices[320];

smooth out float vertexId;

#include "include/polar.glsl"

void main() {
  //  vertexId = mod(float(gl_VertexID), 3.0);
  vertexId = float(gl_VertexID % 3);
  uv = inUV;

  mat3 triangleRotmat = mat3(modelMatrix) * mat3(matrices[index]);
  vec3 centerDisplacement = centers[index].xyz;
  vec3 pos = triangleRotmat * (inVertexPos * scale) + centerDisplacement;

  //  pos = normalize(pos);

  worldPos = pos;
  sphereSpace = normalize(mat3(modelMatrix) * mat3(matrices[index]) * (inVertexPos * scale) + centersWithoutTranslation[index].xyz);
  //  norm = vec3(triangleRotmat * (vec3(0, 0, 1) + (inVertexPos * 0.57)));
  norm = normalize(triangleRotmat * ((inVertexPos * scale) + centersWithoutTranslation[index].xyz));

  gl_Position = vec4(perspectiveMatrix * viewMatrix * vec4(pos, 1.0));
}
