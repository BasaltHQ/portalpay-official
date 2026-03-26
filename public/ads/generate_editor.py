import base64

img_path = r"c:\Users\meanp\OneDrive\Documents\HTL Projects\VS Code Projects\portalpay-official\public\ads\linkedin_ad_cannabis.png"
out_path = r"c:\Users\meanp\OneDrive\Documents\HTL Projects\VS Code Projects\portalpay-official\public\ads\editor.html"

with open(img_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

html = f"""<!DOCTYPE html>
<html>
<head>
  <title>Ad Editor Tool</title>
  <style>
    body {{ font-family: sans-serif; padding: 20px; text-align: center; background: #222; color: #fff; }}
    canvas {{ border: 1px solid #555; cursor: crosshair; max-width: 100%; box-shadow: 0 4px 8px rgba(0,0,0,0.5); }}
    .controls {{ margin-top: 15px; margin-bottom: 15px; }}
    button {{ padding: 10px 20px; font-size: 16px; cursor: pointer; border: none; border-radius: 4px; margin: 0 5px; }}
    .btn-primary {{ background: #4CAF50; color: white; }}
    .btn-secondary {{ background: #666; color: white; }}
    .instructions {{ max-width: 800px; margin: 0 auto 20px auto; text-align: left; background: #333; padding: 15px; border-radius: 8px; }}
  </style>
</head>
<body>
  <h2>Perfect Image Patch Tool</h2>
  
  <div class="instructions">
    <b>Instructions:</b>
    <ol>
      <li>Click and drag a box <b>perfectly</b> around the text `surge.basalthq.com/cannabis-pos`.</li>
      <li>Click <b>"Patch It!"</b>.</li>
      <li>Once it looks perfect, <b>Right-click the image -> "Save image as..."</b> and overwrite the file!</li>
    </ol>
  </div>

  <div class="controls">
    <button class="btn-primary" onclick="patch()">Patch It!</button>
    <button class="btn-secondary" onclick="reset()">Reset</button>
    <button class="btn-primary" style="background: #008CBA; margin-left: 20px;" onclick="downloadImage()">⬇️ Download PNG File</button>
  </div>
  
  <canvas id="canvas"></canvas>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Base64 to bypass local file CORS constraints!
    img.src = 'data:image/png;base64,{b64}'; 
    
    let box = null;
    let isDrawing = false;
    let startX, startY;

    img.onload = () => {{
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    }};

    function reset() {{
       ctx.drawImage(img, 0, 0);
       box = null;
    }}

    canvas.onmousedown = (e) => {{
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      startX = (e.clientX - rect.left) * scaleX;
      startY = (e.clientY - rect.top) * scaleY;
      isDrawing = true;
    }};

    canvas.onmousemove = (e) => {{
      if (!isDrawing) return;
      reset();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;
      
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    }};

    canvas.onmouseup = (e) => {{
      isDrawing = false;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;
      
      box = {{
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        w: Math.abs(currentX - startX),
        h: Math.abs(currentY - startY)
      }};
    }};

    function patch() {{
      if (!box) {{
          alert('Please drag a box around the old text first!');
          return;
      }}
      
      // Save it because reset() clears it!
      const targetBox = {{ ...box }};
      reset(); 
      
      const sliceHeight = 4;
      let sliceY = targetBox.y - sliceHeight - 2;
      
      if (sliceY > 0) {{
          const slice = ctx.getImageData(targetBox.x - 10, sliceY, targetBox.w + 20, sliceHeight);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = targetBox.w + 20;
          tempCanvas.height = sliceHeight;
          tempCanvas.getContext('2d').putImageData(slice, 0, 0);
          ctx.drawImage(tempCanvas, 0, 0, targetBox.w + 20, sliceHeight, targetBox.x - 10, targetBox.y - 4, targetBox.w + 20, targetBox.h + 8);
      }} else {{
          ctx.fillStyle = '#111717';
          ctx.fillRect(targetBox.x - 5, targetBox.y - 2, targetBox.w + 10, targetBox.h + 4);
      }}

      ctx.fillStyle = '#b0b5b9'; 
      ctx.font = '500 ' + (targetBox.h * 0.85) + 'px "Segoe UI", Roboto, sans-serif'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '0.5px';
      
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText('https://surge.basalthq.com/cannabis', targetBox.x + targetBox.w / 2, targetBox.y + targetBox.h / 2 + 1);
      
      ctx.shadowColor = 'transparent';
    }}

    function downloadImage() {{
      const link = document.createElement('a');
      link.download = 'linkedin_ad_cannabis_fixed.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }}
  </script>
</body>
</html>
"""

with open(out_path, "w", encoding="utf-8") as out_f:
    out_f.write(html)
