uniform sampler2D u_texture;

varying vec2 v_uv;

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec3 color = vec3(0.0);

  // get texture
  vec3 texture = texture2D(u_texture, v_uv).rgb;

  // get alpha
  float alpha = smoothstep(0.1, 1.0, texture.b);
  color = vec3(alpha);


  // set color
  gl_FragColor = vec4(color, alpha);
}