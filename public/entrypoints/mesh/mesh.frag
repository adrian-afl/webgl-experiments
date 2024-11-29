#version 300 es
precision highp float;

uniform sampler2D colorTexture;

in vec3 norm;
in vec2 uv;

layout (location = 0) out vec4 outColor;
layout (location = 1) out float outDistance;

void main() {
  float light = dot(norm, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;

  vec3 color = texture(colorTexture, uv).rgb;

  outColor = vec4(color, 1.0);
  outDistance = gl_FragCoord.z;
}
