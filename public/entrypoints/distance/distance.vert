#version 300 es
precision highp float;

uniform mat4 perspectiveMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

out float distance;

void main() {
  vec3 cameraSpace = modelMatrix * vec4(inVertexPos, 1.0);
  distance = length(cameraSpace.xyz);

  gl_Position = vec4(perspectiveMatrix * cameraSpace);
}
