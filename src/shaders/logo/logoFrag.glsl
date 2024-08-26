varying vec3 v_pos;
varying vec3 v_normal;

#include <lights>

/* -------------------------------------------------------------------------- */
/*                                    main                                    */
/* -------------------------------------------------------------------------- */
void main() {
  vec3 color = vec3(0.5);

  float top = v_pos.y + 0.4;

  // add light
  vec3 light = vec3(0.0);

  vec3 viewDirection = normalize(v_pos - cameraPosition);
  vec3 lightPos = vec3(3.0, 8.0, -6.0);
  vec3 lightColor = vec3(0.8, 0.8, 1.0);
  float lightIntensity = 3.0;
  light += lightPoint(v_pos, v_normal, viewDirection, lightPos, lightColor, lightIntensity, 20.0, 0.0, 0.0);
  
  color += light;

  // set color
  gl_FragColor = vec4(color, 1.0);
}