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
out vec2 uv;

void main() {
  norm = inNormal;
  uv = inUV;

  gl_Position = vec4(perspectiveMatrix * viewMatrix * modelMatrix * vec4(inVertexPos, 1.0));
}
