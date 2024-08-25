attribute vec3 a_instancePosition;
attribute float a_instanceRand;
attribute float a_instanceOpacity;
attribute float a_instanceScale;

uniform float u_time;

varying vec2 v_uv;
varying vec3 v_pos;
varying float v_opacity;

void main() {
  vec3 pos = a_instanceScale * position + a_instancePosition;

  float progressTime = 100. + u_time * 0.2;
  float progress = mod(progressTime + a_instanceRand, 5.0);

  pos.x += progress * 0.8;
  pos.y -= progress;
  pos.z -= progress * 0.2;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // set varyings
  v_uv = uv;
  v_pos = (modelViewMatrix * vec4(pos, 1.0)).xyz;
  v_opacity = a_instanceOpacity;
}