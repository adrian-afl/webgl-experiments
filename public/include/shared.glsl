#pragma once

vec3 getColor(vec2 point) {
  return texture(tex, uv).rgb;
}
