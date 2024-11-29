#version 300 es
precision highp float;

uniform sampler2D colorTexture;
uniform sampler2D distanceTexture;

in vec2 uv;

out vec4 outColor;

void main() {
  outColor = vec4(
  mix(texture(colorTexture, uv).rgb, vec3(1.0), texture(distanceTexture, uv).r),
  1.0
  );
}
