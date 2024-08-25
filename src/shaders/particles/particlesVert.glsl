attribute vec3 a_instancePosition;
attribute float a_instanceRand;

uniform float u_time;

void main() {
  vec3 pos = position + a_instancePosition;

  float progressTime = 100. + u_time * 0.8;
  float progress = mod(progressTime + a_instanceRand, 5.0);

  pos.x += progress * 0.8;
  pos.y -= progress;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}