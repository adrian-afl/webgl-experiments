#version 300 es
precision highp float;

in vec3 norm;
in vec3 worldPos;
in vec2 uv;

layout (location = 0) out vec4 outColor;
layout (location = 1) out float outDistance;
layout (location = 2) out vec3 outWorldPos;
layout (location = 3) out vec3 outNormal;

void main() {
  outColor = vec4(vec3(-worldPos.z * 0.2 - 0.5), 1.0);
  outWorldPos = worldPos;
  outNormal = norm;
  outDistance = gl_FragCoord.z;
}
