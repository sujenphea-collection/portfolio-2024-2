uniform sampler2D u_texture;

varying vec2 v_uv;

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
float blendOverlay(float base, float blend) {
  return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return vec3(blendOverlay(base.r, blend.r), blendOverlay(base.g, blend.g), blendOverlay(base.b, blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
  return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 blendHardLight(vec3 base, vec3 blend) {
  return blendOverlay(blend, base);
}

vec3 blendHardLight(vec3 base, vec3 blend, float opacity) {
  return (blendHardLight(base, blend) * opacity + base * (1.0 - opacity));
}

float aastep(float x) {
  float w = fwidth(x), c = smoothstep(.7, -.7, (abs(fract(x - .25) - .5) - .25) / w);
  return c;
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  // add texture
  vec3 texture = texture2D(u_texture, v_uv).rgb;
  vec3 color = texture;

  // add checkboard
  float xRatio = 150.;
  float yRatio = (xRatio * 1.6 / 1.);
  float thickness = .2;
  float directionX = v_uv.x;
  float directionY = v_uv.y;
  float checkBoard = aastep(mod(directionX * xRatio, 1.) * thickness);
  checkBoard += aastep(mod(directionY * yRatio, 1.) * thickness);
  checkBoard = clamp(checkBoard, 0.0, 1.0);
  color = blendHardLight(color, vec3(1. - checkBoard), .2);
  
  // set color
  gl_FragColor = vec4(color, 1.);
}