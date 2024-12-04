#version 300 es
precision highp float;

uniform sampler2D distanceTexture;
uniform sampler2D worldPosTexture;
uniform sampler2D normalTexture;

uniform mat4 lightPerspectiveMatrix;
uniform mat4 lightViewMatrix;

uniform vec3 lightColor;
uniform vec3 lightCameraRelativePosition;

in vec2 uv;

out vec4 outColor;

void main() {
  vec3 worldPos = texture(worldPosTexture, uv).rgb - lightCameraRelativePosition;
  vec3 normal = texture(normalTexture, uv).rgb;

  vec4 lightClipSpace = lightPerspectiveMatrix * lightViewMatrix * vec4(worldPos, 1.0);
  vec3 ndc = (lightClipSpace.xyz / lightClipSpace.w) * 0.5 + 0.5;

  float lightProjectionDepth = texture(distanceTexture, ndc.xy).r;

  float shadow = smoothstep(-0.04, -0.001, lightProjectionDepth - ndc.z);

  //  outColor = vec4(vec3(sin(texture(distanceTexture, uv.xy).r * 101123.0)), 1.0); // todo normals
  outColor = vec4(vec3(shadow), 1.0); // todo normals
  //  outColor = vec4(vec3(sin(texture(distanceTexture, ndc.xy).r * 101123.0)), 1.0); // todo normals

}
