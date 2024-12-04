#version 300 es
precision highp float;

uniform sampler2D colorTexture;

in vec3 norm;
in vec3 worldPos;
in vec2 uv;

layout (location = 0) out vec4 outColor;
layout (location = 1) out float outDistance;
layout (location = 2) out vec3 outWorldPos;
layout (location = 3) out vec3 outNormal;

void main() {
  vec3 color = texture(colorTexture, uv).rgb;

  outColor = vec4(color, 1.0);
  outWorldPos = worldPos;
  outNormal = norm;
  outDistance = gl_FragCoord.z;
}
