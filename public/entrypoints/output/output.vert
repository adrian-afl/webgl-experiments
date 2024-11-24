#version 300 es
precision highp float;

in vec3 inVertexPos;
in vec2 inUV;
in vec3 inNormal;
in vec4 inTangent;

out vec3 norm;
out vec2 uv;

void main() {
    gl_Position = vec4(inVertexPos, 1.0);
    norm = inNormal;
    uv = inUV;
}
