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

void main() {
  uv = inUV;

  worldPos = vec4(modelMatrix * vec4(inVertexPos, 1.0)).xyz;
  norm = vec4(modelMatrix * vec4(inNormal, 0.0)).xyz;

  gl_Position = vec4(perspectiveMatrix * viewMatrix * modelMatrix * vec4(inVertexPos, 1.0));
}
