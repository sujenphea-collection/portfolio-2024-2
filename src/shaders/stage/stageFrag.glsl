uniform float u_scale;
uniform float u_time;

uniform float u_showRatio;

// color
uniform vec3 color_top;
uniform vec3 color_bottom;

// noise
uniform sampler2D u_noiseTexture;
uniform vec2 u_noiseTexelSize;
uniform vec2 u_noiseCoordOffset;

varying vec2 v_uv;
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

vec3 rgb(int r, int g, int b) {
  return vec3(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0);
}

vec3 gradient(vec3 colorBottom, vec3 colorTop, float y) {
  vec3 vertical_gradient = mix(colorBottom, colorTop, y);
  return vertical_gradient;
}

/* -------------------------------------------------------------------------- */
/*                                    noise                                   */
/* -------------------------------------------------------------------------- */
float gyroid(vec3 p) {
  return dot(sin(p), cos(p.yzx));
}

float noise(vec3 p) {
  float result = 0.;
  float a = 0.5;
  float count = 6.0;

  for (float i = 0.; i < count; ++i, a /= 2.) {
    p.z += u_time * 0.01;
    result += abs(gyroid(p / a)) * a;
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec3 color = vec3(0.0);
  float alpha = 1.0;

  // add noise
  vec3 bump = getNoise(gl_FragCoord.xy * vec2(1.0));
  vec3 bumpColor = vec3(0.1) * bump.r;
  color += bumpColor;

  // color noise
  vec3 pos = vec3(v_uv, 0.0);
  float noise = noise(pos);
  
  vec3 gradient = gradient(color_bottom, color_top, v_uv.y);
  gradient -= rgb(100, 100, 100) * (1.0 - noise);

  color += gradient;

  // get grid color
  float grid = pristineGrid(v_worldPosition.xz * vec2(1.0 / u_scale), vec2(0.02));
  vec3 gridColor = vec3(0.2) * grid;
  color -= gridColor;

  // alpha
  float smoothRatio = (u_showRatio + 0.2) -
                      v_uv.y * 0.2 - 
                      (1.0 - color.r) * 0.4;
  alpha = smoothstep(0.0, 0.1, smoothRatio);

  // bottom
  float bottom = smoothstep(0.95, 1.0, 1.0 - v_worldPosition.y * 1.0);

  // set color
  gl_FragColor = vec4(color - bottom * 0.3, alpha);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}