#define GLSLIFY 1
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform sampler2D u_toScene;

uniform float u_progress;
uniform float u_time;

void main() {
  vec2 uv = v_uv;

  vec4 fromScene = texture2D(u_toScene, v_uv);
  vec4 toScene = texture2D(u_texture, v_uv);

  gl_FragColor = mix(fromScene, toScene, u_progress);
}