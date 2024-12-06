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

smooth out float vertexId;

void main() {
  //  vertexId = mod(float(gl_VertexID), 3.0);
  vertexId = float(gl_VertexID % 3);
  uv = inUV;

  vec3 pos = (mat3(matrices[index]) * (inVertexPos * 1.2)) + centers[index].xyz;

  //  pos = normalize(pos);

  worldPos = pos;
  norm = vec3(mat3(matrices[index]) * inNormal);

  gl_Position = vec4(perspectiveMatrix * viewMatrix * vec4(pos, 1.0));
}
