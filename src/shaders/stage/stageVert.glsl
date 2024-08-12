varying vec3 v_worldPosition;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  // set varyings
  v_worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
}