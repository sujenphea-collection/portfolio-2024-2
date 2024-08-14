uniform sampler2D u_texture;
uniform float u_time;

varying vec2 v_uv;

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
float rand(vec2 xy) {
  return fract(sin(dot(xy, vec2(12.9898, 78.233))) * 43758.5453);
}

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
  // get offset
  float offsetX = noise(vec2(u_time * 10.0, v_uv.y * 100.0)) * 0.003
                  + noise(vec2(u_time * 5.0, v_uv * 20.0)) * 0.005;

  // get sandy
  float sandy = rand(v_uv) * sin(u_time * 1.0) * 0.005;

  // get texture
  float x = v_uv.x + offsetX + sandy;
  float y = v_uv.y;
  float colorShift = 0.003;

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