attribute vec3 a_instancePosition;
attribute float a_instanceRand;

uniform float u_time;

varying vec3 v_pos;

void main() {
  vec3 pos = position + a_instancePosition;

  float progressTime = 100. + u_time * 0.2;
  float progress = mod(progressTime + a_instanceRand, 5.0);

  pos.x += progress * 0.8;
  pos.y -= progress;
  pos.z -= progress;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  // set varyings
  v_pos = (modelViewMatrix * vec4(pos, 1.0)).xyz;
}