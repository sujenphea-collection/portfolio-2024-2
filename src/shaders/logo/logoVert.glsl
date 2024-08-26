varying vec3 v_pos;
varying vec3 v_normal;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  // set varyings
  v_pos = (modelViewMatrix * vec4(position, 1.0)).xyz;
  v_normal = normal;
}