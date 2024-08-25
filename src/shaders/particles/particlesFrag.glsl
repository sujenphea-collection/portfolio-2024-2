varying vec2 v_uv;
varying vec3 v_pos;
varying float v_opacity;

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
float circle(vec2 uv, float radius, float blur) {
  vec2 dist = uv - vec2(0.5);

  return 1. - smoothstep(radius - (radius * blur), 
                         radius + (radius * blur), 
                         dot(dist, dist) * 4.0);
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec3 color = vec3(circle(v_uv, 0.9, 0.4));

  float alpha = v_pos.y * v_opacity;

  gl_FragColor = vec4(color, alpha);
}