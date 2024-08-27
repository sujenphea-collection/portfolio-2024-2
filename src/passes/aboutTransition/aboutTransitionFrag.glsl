uniform sampler2D u_texture;
uniform sampler2D u_toScene;

uniform float u_progress;
uniform float u_time;

varying vec2 v_uv;

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
float circle(vec2 uv, float radius, float blur, float scale) {
  vec2 dist = (uv - vec2(0.5)) / scale;

  return 1. - smoothstep(radius - (radius * blur), 
                         radius + (radius * blur), 
                         dot(dist, dist) * 4.0);
}

/* ---------------------------------- noise --------------------------------- */
// ref: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 perm(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float noise(vec3 p) {
  vec3 a = floor(p);
  vec3 d = p - a;
  d = d * d * (3.0 - 2.0 * d);

  vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
  vec4 k1 = perm(b.xyxy);
  vec4 k2 = perm(k1.xyxy + b.zzww);

  vec4 c = k2 + a.zzzz;
  vec4 k3 = perm(c);
  vec4 k4 = perm(c + 1.0);

  vec4 o1 = fract(k3 * (1.0 / 41.0));
  vec4 o2 = fract(k4 * (1.0 / 41.0));

  vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
  vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

  return o4.y * d.y + o4.x * (1.0 - d.y);
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec2 uv = v_uv;

  float noise = noise(vec3(v_uv * 5.0, u_time * 0.2));
  vec2 center = vec2(0.5);

  // scene colors
  vec4 fromScene = texture2D(u_toScene, v_uv);
  vec4 toScene = texture2D(u_texture, v_uv);

  // progress
  vec2 circleUV = vec2(v_uv - center) / 1.5 + center;
  float innerNoise = circle(circleUV, u_progress + noise, 0.2, u_progress);

  gl_FragColor = mix(fromScene, toScene, innerNoise);
}