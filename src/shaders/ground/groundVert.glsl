uniform mat4 u_textureMatrix;

varying vec4 v_uv;
varying vec2 v_uv2;

#include <common>
#include <logdepthbuf_pars_vertex>

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  v_uv = u_textureMatrix * vec4(position, 1.0);
  v_uv2 = uv;
  #include <logdepthbuf_vertex>
}