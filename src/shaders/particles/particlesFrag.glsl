varying vec3 v_pos;
varying float v_opacity;

void main() {
  vec3 color = vec3(1.0);
  float alpha = v_pos.y * v_opacity;
  
  gl_FragColor = vec4(color, alpha);
}