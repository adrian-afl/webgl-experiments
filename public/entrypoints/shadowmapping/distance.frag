#version 300 es
precision highp float;

layout (location = 0) out float outDistance;

void main() {
  outDistance = gl_FragCoord.z;
}
