#version 300 es
precision highp float;

uniform float elapsed;
uniform mat4 perspectiveMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

out vec3 norm;
out vec3 worldPos;
out vec2 uv;

uniform vec3 sphereCenter;
uniform int index;
uniform vec4 centers[320];
uniform mat4 matrices[320];

mat3 correctiveMatrix = mat3(
0.6395798921585083,
-0.5510198473930359,
-0.775638997554779,
0.49808451533317566,
0.828161358833313,
-0.5536257028579712,
-0.5855334401130676,
0.10259559005498886,
0.3031216263771057
);

void main() {
  uv = inUV;

  vec3 pos = inverse(mat3(matrices[0])) * mat3(matrices[index]) * inVertexPos + centers[index].xyz;

  worldPos = pos;
  norm = vec3(mat3(matrices[index]) * inNormal);

  gl_Position = vec4(perspectiveMatrix * viewMatrix * vec4(pos, 1.0));
}
