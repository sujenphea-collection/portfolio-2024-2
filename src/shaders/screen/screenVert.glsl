varying vec2 v_uv;
varying vec3 v_worldPosition;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  v_uv = uv;
  v_worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
}