#version 300 es
precision highp float;

in float distance;

layout (location = 0) out float outDistance;

void main() {
  outDistance = distance;
}
