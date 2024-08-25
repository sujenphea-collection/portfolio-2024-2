varying vec3 v_pos;

void main() {
  float alpha = v_pos.y;

  gl_FragColor = vec4(1.0, 0.0, 0.0, alpha);
}