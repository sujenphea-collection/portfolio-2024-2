uniform sampler2D u_texture;
uniform float u_time;

varying vec2 v_uv;

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  // get texture
  float x = v_uv.x;
  float y = v_uv.y;
  float colorShift = 0.005;

  float red = texture(u_texture, vec2(x - colorShift, y)).r;
  float green = texture(u_texture, vec2(x, y)).g;
  float blue = texture(u_texture, vec2(x + colorShift, y)).b;

  vec3 color = vec3(red, green, blue);

  // get scanline
  float scanline = sin(v_uv.y * 1000.0) * 0.01;
  color += scanline;
  
  // set color
  gl_FragColor = vec4(color, 1.);
}