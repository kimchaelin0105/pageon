(() => {
  function useGpuKey(video) {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return false;
    const shader = (type, source) => {
      const value = gl.createShader(type);
      gl.shaderSource(value, source);
      gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(value));
      return value;
    };
    try {
      const program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, `
        attribute vec2 position;
        varying vec2 uv;
        void main() { uv = (position + 1.0) * 0.5; gl_Position = vec4(position, 0.0, 1.0); }
      `));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
        precision highp float;
        varying vec2 uv;
        uniform sampler2D image;
        void main() {
          vec3 color = texture2D(image, uv).rgb;
          vec3 key = (texture2D(image, vec2(0.01, 0.99)).rgb
            + texture2D(image, vec2(0.99, 0.99)).rgb
            + texture2D(image, vec2(0.01, 0.01)).rgb) / 3.0;
          bool whiteBackdrop = min(min(key.r, key.g), key.b) > 0.85;
          bool blackBackdrop = max(max(key.r, key.g), key.b) < 0.1;
          float inner = whiteBackdrop ? 4.0 : (blackBackdrop ? 3.0 : 26.0);
          float outer = whiteBackdrop ? 10.0 : (blackBackdrop ? 16.0 : 70.0);
          float alpha = smoothstep(inner / 255.0, outer / 255.0, distance(color, key));
          vec3 clean = clamp((color - key * (1.0 - alpha)) / max(alpha, 0.02), 0.0, 1.0);
          gl_FragColor = vec4(clean, alpha);
        }
      `));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      canvas.className = "footer-cat";
      canvas.setAttribute("aria-hidden", "true");
      const start = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        video.after(canvas);
        let previousTime = -1;
        const render = () => {
          try {
            if (video.readyState >= 2 && video.currentTime !== previousTime) {
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
              previousTime = video.currentTime;
              video.style.visibility = "hidden";
            }
          } catch (error) {
            canvas.remove();
            video.style.visibility = "visible";
            return;
          }
          if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(render);
          else requestAnimationFrame(render);
        };
        render();
      };
      if (video.readyState >= 1) start();
      else video.addEventListener("loadedmetadata", start, { once: true });
      return true;
    } catch (error) { return false; }
  }
  document.querySelectorAll("video.footer-cat").forEach((video) => {
    if (useGpuKey(video)) return;
    const canvas = document.createElement("canvas");
    canvas.className = "footer-cat";
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const start = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.after(canvas);
      const w = canvas.width, h = canvas.height;
      const frame = () => {
        if (video.readyState >= 2) {
          try {
            ctx.drawImage(video, 0, 0, w, h);
            const image = ctx.getImageData(0, 0, w, h), data = image.data;
            // Sample the actual muted green backdrop, rather than assuming pure green.
            const samples = [[8, 8], [w - 9, 8], [8, h - 9]];
            const key = [0, 0, 0];
            samples.forEach(([x, y]) => {
              const i = (y * w + x) * 4;
              for (let c = 0; c < 3; c++) key[c] += data[i + c] / samples.length;
            });
            for (let i = 0; i < data.length; i += 4) {
              const distance = Math.hypot(data[i] - key[0], data[i + 1] - key[1], data[i + 2] - key[2]);
              const whiteBackdrop = Math.min(...key) > 216;
              const blackBackdrop = Math.max(...key) < 26;
              const inner = whiteBackdrop ? 4 : (blackBackdrop ? 3 : 26);
              const outer = whiteBackdrop ? 10 : (blackBackdrop ? 16 : 70);
              if (distance >= outer) continue;
              const t = Math.max(0, Math.min(1, (distance - inner) / (outer - inner)));
              const alpha = t * t * (3 - 2 * t);
              data[i + 3] = Math.round(255 * alpha);
              // Unmix the green matte from partially transparent edge pixels.
              if (alpha > 0.02 && alpha < 1) {
                for (let c = 0; c < 3; c++) {
                  data[i + c] = Math.max(0, Math.min(255, (data[i + c] - key[c] * (1 - alpha)) / alpha));
                }
              }
            }
            ctx.putImageData(image, 0, 0);
            video.style.visibility = "hidden";
          } catch (error) {
            canvas.remove();
            video.style.visibility = "visible";
            console.warn("Footer background removal requires same-origin video access.", error);
            return;
          }
        }
        if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(frame);
        else window.setTimeout(frame, 40);
      };
      frame();
    };
    if (video.readyState >= 1) start();
    else video.addEventListener("loadedmetadata", start, { once: true });
  });
})();
