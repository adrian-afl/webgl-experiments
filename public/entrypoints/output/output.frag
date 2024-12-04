#version 300 es
precision highp float;

uniform sampler2D colorTexture;
uniform sampler2D distanceTexture;

in vec2 uv;

out vec4 outColor;

void main() {
  outColor = vec4(texture(colorTexture, uv).rgb, 1.0);
}
