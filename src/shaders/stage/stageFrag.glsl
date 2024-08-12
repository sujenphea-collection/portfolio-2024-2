uniform sampler2D u_noiseTexture;
uniform vec2 u_noiseTexelSize;
uniform vec2 u_noiseCoordOffset;

varying vec3 v_worldPosition;

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
// ref: https://bgolus.medium.com/the-best-darn-grid-shader-yet-727f9278b9d8
float pristineGrid(in vec2 uv, vec2 lineWidth) {
  vec2 ddx = dFdx(uv);
  vec2 ddy = dFdy(uv);

  vec2 uvDeriv = vec2(length(vec2(ddx.x, ddy.x)), length(vec2(ddx.y, ddy.y)));

  bool invertLineX = lineWidth.x > 0.5;
  bool invertLineY = lineWidth.y > 0.5;

  float targetWidthX = invertLineX ? 1.0 - lineWidth.x : lineWidth.x;
  float targetWidthY = invertLineY ? 1.0 - lineWidth.y : lineWidth.y;
  vec2 targetWidth = vec2(targetWidthX, targetWidthY);
  vec2 drawWidth = clamp(targetWidth, uvDeriv, vec2(0.5));

  vec2 lineAA = uvDeriv * 1.5;

  vec2 gridUV = abs(fract(uv) * 2.0 - 1.0);
  gridUV.x = invertLineX ? gridUV.x : 1.0 - gridUV.x;
  gridUV.y = invertLineY ? gridUV.y : 1.0 - gridUV.y;

  vec2 grid2 = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);
  grid2 *= clamp(targetWidth / drawWidth, 0.0, 1.0);
  grid2 = mix(grid2, targetWidth, clamp(uvDeriv * 2.0 - 1.0, 0.0, 1.0));
  grid2.x = invertLineX ? 1.0 - grid2.x : grid2.x;
  grid2.y = invertLineY ? 1.0 - grid2.y : grid2.y;

  return mix(grid2.x, 1.0, grid2.y);
}

vec3 getNoise(vec2 coord) {
  return texture2D(u_noiseTexture, coord * u_noiseTexelSize + u_noiseCoordOffset).rgb;
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  // get grid color
  vec3 color = vec3(0.0);

  float grid = pristineGrid(v_worldPosition.xz, vec2(0.02));
  vec3 gridColor = vec3(0.2) * grid;
  color = gridColor;

  // add noise
  vec3 noise = getNoise(gl_FragCoord.xy * vec2(0.3));
  vec3 noiseColor = vec3(0.1) * noise.r;
  color += noiseColor;

  // set color
  gl_FragColor = vec4(color, 1.);
}