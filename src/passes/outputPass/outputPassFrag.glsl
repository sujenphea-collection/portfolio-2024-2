precision highp float;

uniform sampler2D u_texture;

#include <tonemapping_pars_fragment>
#include <colorspace_pars_fragment>

varying vec2 v_uv;

void main() {
  gl_FragColor = texture2D(u_texture, v_uv);

  // tone mapping
  #ifdef LINEAR_TONE_MAPPING
    gl_FragColor.rgb = LinearToneMapping(gl_FragColor.rgb);
  #elif defined( REINHARD_TONE_MAPPING )
    gl_FragColor.rgb = ReinhardToneMapping(gl_FragColor.rgb);
  #elif defined( CINEON_TONE_MAPPING )
    gl_FragColor.rgb = OptimizedCineonToneMapping(gl_FragColor.rgb);
  #elif defined( ACES_FILMIC_TONE_MAPPING )
    gl_FragColor.rgb = ACESFilmicToneMapping(gl_FragColor.rgb);
  #endif
	
  // color space
  #ifdef SRGB_TRANSFER
    gl_FragColor = sRGBTransferOETF(gl_FragColor);
  #endif
}