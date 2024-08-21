uniform sampler2D u_texture;
uniform sampler2D u_texture2;
uniform sampler2D u_mixTexture;

uniform float u_time;
uniform float u_showRatio;
uniform float u_mixRatio;

uniform vec2 u_mouse;

varying vec2 v_uv;
varying vec3 v_worldPosition;

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
// 2D Random
float random(in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  // Smooth Interpolation
  // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f * f * (3.0 - 2.0 * f);

  // Mix 4 coorners percentages
  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec3 color = vec3(0.0);
  float alpha = 0.0;

  // get offset
  float offsetX = noise(vec2(u_time * 10.0, v_uv.y * 100.0)) * 0.003
                  + noise(vec2(u_time * 5.0, v_uv * 20.0)) * 0.005;

  float offsetY = (step(noise(vec2(u_time * 3.0, 5.0)), 0.2))
                  * (sin(u_time) - 0.5) * 2.0
                  * 0.01;

  // get sandy
  float sandy = random(v_uv) * sin(u_time * 1.0) * 0.005;

  // get texture
  float x = v_uv.x + offsetX + sandy;
  float y = v_uv.y + offsetY;
  float colorShift = 0.003;

  float red = texture(u_texture, vec2(x - colorShift, y)).r;
  float green = texture(u_texture, vec2(x, y)).g;
  float blue = texture(u_texture, vec2(x + colorShift, y)).b;

  color += vec3(red, green, blue);

  // add scanline
  float scanline = sin(v_uv.y * 1000.0) * 0.01;
  color += scanline;

  // add static
  color -= noise(v_uv * 1000.0 * noise(vec2(u_time * 100.0))) * 0.05;

  // alpha
  alpha = u_showRatio;

  // bottom
  float bottom = 1.0 - smoothstep(0.0, 0.3, v_worldPosition.y);

  // set color
  gl_FragColor = vec4(color - bottom * 0.4, alpha);

  ///
  float bleed = 0.1;
  vec4 transitionTex = texture2D(u_mixTexture, v_uv);

  // mouse
  vec2 mouse = u_mouse;
  vec2 uv = vec2(fract(v_uv.x * 20.0), fract(v_uv.y * 20.0));
  vec2 dir = vec2(mouse.x / abs(mouse.x), mouse.y / abs(mouse.y));
  float xMul = clamp(dir.x + 1.0, 0.0, 1.0); // 0 if right, 1 otherwise
  float yMul = clamp(dir.y + 1.0, 0.0, 1.0); // 0 if right, 1 otherwise

  // (u_mouse.x - v_uv.x) * u_mouse.x => left
  // (v_uv.x) * -u_mouse.x            => right
  float xRatio = (mouse.x * xMul + uv.x * -dir.x) * (mouse.x * dir.x);
  float yRatio = (mouse.y * yMul + uv.y * -dir.y) * (mouse.y * dir.y);
  float mouseRatio = xRatio + yRatio;

  // mix
  float ratio = u_mixRatio * (1.0 + bleed * 2.0) - bleed;
  ratio += mouseRatio * (1.0 - u_mixRatio) * 0.5;
  float mixf = clamp((transitionTex.r - ratio) * (1.0 / bleed), 0.0, 1.0);

  vec4 texel1 = texture2D(u_texture, v_uv);
  vec4 texel2 = texture2D(u_texture2, v_uv);  

  gl_FragColor = mix(texel1, texel2, 1.0 - mixf);
  ///
}