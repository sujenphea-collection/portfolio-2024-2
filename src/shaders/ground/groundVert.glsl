uniform mat4 u_textureMatrix;

varying vec4 v_uv;
varying vec2 v_uv2;
varying vec3 v_pos;
varying vec3 v_normal;

#include <common>
#include <logdepthbuf_pars_vertex>

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  v_uv = u_textureMatrix * vec4(position, 1.0);
  v_uv2 = uv;
  v_pos = (modelViewMatrix * vec4(position, 1.0)).xyz;
  v_normal = normal;
  
  #include <logdepthbuf_vertex>
  #include <begin_vertex>
  #include <project_vertex>
}