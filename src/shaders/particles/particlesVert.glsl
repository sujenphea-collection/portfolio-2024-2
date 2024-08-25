attribute vec3 a_instancePosition;

void main() {
  vec3 pos = position + a_instancePosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}