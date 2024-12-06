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
out vec3 worldPos;
out vec2 uv;

uniform vec3 sphereCenter;
uniform int index;
uniform vec4 centers[320];
uniform mat4 matrices[320];

void main() {
  uv = inUV;

  vec3 pos = (mat3(matrices[index]) * (inVertexPos * 0.2)) + centers[index].xyz;

  worldPos = pos;
  norm = vec3(mat3(matrices[index]) * inNormal);

  gl_Position = vec4(perspectiveMatrix * viewMatrix * vec4(pos, 1.0));
}
