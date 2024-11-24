#version 300 es
precision highp float;

uniform sampler2D tex;

in vec2 uv;

out vec4 outColor;

#pragma include "shared.glsl"

void main() {
  outColor = vec4(texture(tex, uv).rgb, 1.0);
}
