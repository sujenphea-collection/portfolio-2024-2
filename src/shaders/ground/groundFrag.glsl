uniform vec3 u_color;
uniform sampler2D u_texture;
uniform sampler2D u_shadowTexture;
uniform sampler2D u_maskTexture;

varying vec4 v_uv;
varying vec2 v_uv2;

#include <logdepthbuf_pars_fragment>

/* -------------------------------------------------------------------------- */
/*                                    utils                                   */
/* -------------------------------------------------------------------------- */
float blendOverlay(float base, float blend) {
  return (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return vec3(blendOverlay(base.r, blend.r), blendOverlay(base.g, blend.g), blendOverlay(base.b, blend.b));
}

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
	#include <logdepthbuf_fragment>
  
  vec3 color = vec3(0.0);

  // get shadow alpha
  vec3 shadows = texture2D(u_shadowTexture, v_uv2).rgb;
  float alpha = smoothstep(0.1, 1.0, shadows.b);
  color = vec3(alpha);

  // get reflection
  vec4 base = texture2DProj(u_texture, v_uv);
  color += base.rgb;
  
  // color overlay
  color = blendOverlay(color, u_color);

  // dirt
  float dirt = texture2D(u_maskTexture, v_uv2).r;
  color *= dirt;

  // apply color
  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}