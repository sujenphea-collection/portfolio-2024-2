varying float v_opacity;
varying float v_density;
varying vec2 v_uv;
varying float v_offset;

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  float dist = length(v_uv - .5) * 2.;
  
  float alpha = 0.0;
  alpha += smoothstep(1., v_density * 0.5, dist) * 0.03 + 
           smoothstep(0.3 + v_density * 0.7, v_density * 0.5, dist) * 0.2 + 
           smoothstep(0.125 + v_density * 0.875, v_density * 0.5, dist) * 0.6;
  alpha *= v_opacity;
  alpha *= v_offset * 30.0;

  gl_FragColor = vec4(alpha, alpha, alpha, 0.);
}