#version 300 es
precision highp float;

in vec3 norm;
in vec3 worldPos;
in vec3 sphereSpace;
uniform mat4 modelMatrix;
in vec2 uv;
in float vertexId;
uniform sampler2D tex;

layout (location = 0) out vec4 outColor;
layout (location = 1) out float outDistance;
layout (location = 2) out vec3 outWorldPos;
layout (location = 3) out vec3 outNormal;

#include "include/polar.glsl"

void main() {
  vec3 red = vec3(1.0, 0.0, 0.0);
  vec3 green = vec3(0.0, 1.0, 0.0);
  vec3 blue = vec3(0.0, 0.0, 1.0);
  vec3 color = vec3(0.0);
  if (vertexId < 1.0) {
    color = mix(red, green, vertexId);
  } else if (vertexId < 2.0) {
    color = mix(green, blue, vertexId - 1.0);
  } else if (vertexId < 3.0) {
    color = mix(blue, red, vertexId - 2.0);
  }

  color = vec3(1.0) * vertexId * 0.33;//step(0.1, fract(vertexId));

  vec3 normed = normalize(sphereSpace);
  vec3 normed2 = inverse(mat3(modelMatrix)) * normalize(sphereSpace);

  vec3 ssnModelSpace = normalize(cross(
                                   dFdx(normed2),
                                   dFdy(normed2)
                                 ));

  vec3 ssnWorldSpace = normalize(cross(
                                   dFdx(normed),
                                   dFdy(normed)
                                 ));

  vec2 uv = xyzToPolar(ssnModelSpace.zxy * vec3(1.0, 1.0, -1.0)).xy;
  //  uv.x = uv.x * 0.5 + 0.5;
  uv.x = fract(uv.x);

  //  outColor = vec4(vec3(-worldPos.z * 0.52 - 1.0) * color, 1.0);
  //  outColor = vec4(pow(dot(normalize(ssn), normalize(vec3(-1.0, 1.0, 1.0))), 3.0) * vec3(1.0), 1.0);
  //  outColor = vec4(step(0.0, uv.x), 0.0, 0.0, 1.0);
  float dt = pow(dot(normalize(ssnWorldSpace), normalize(vec3(0.5, 0.5, 1.0))), 1.0);
  outColor = vec4(texture(tex, uv).xyz * dt * 1.2, 1.0);
  outWorldPos = worldPos;

  outNormal = norm;
  outDistance = gl_FragCoord.z;
}
