#version 300 es
precision highp float;

uniform mat4 perspectiveMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

void main() {
  gl_Position = vec4(perspectiveMatrix * viewMatrix * modelMatrix * vec4(inVertexPos, 1.0));
}
