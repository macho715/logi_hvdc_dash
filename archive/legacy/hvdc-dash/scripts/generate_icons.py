from PIL import Image
import os
import shutil

# Paths
MASTER_ICON = r"C:\Users\minky\.gemini\antigravity\brain\42825f62-c38d-4ff4-8aad-453585bbb96a\hvdc_app_icon_1767968665490.png"
OUTPUT_DIR = r"C:\Users\minky\Downloads\HVDC DASH\hvdc-dashboard\public\icons"

# Ensure output directory exists
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Copy master to screenshots for safe keeping (or as a large preview)
shutil.copy(MASTER_ICON, os.path.join(OUTPUT_DIR, "master-1024.png"))

# Sizes required by manifest.json
SIZES = [
    72, 96, 128, 144, 152, 192, 384, 512
]

try:
    with Image.open(MASTER_ICON) as img:
        # Convert to RGBA ensuring alpha channel support
        img = img.convert("RGBA")
        
        for size in SIZES:
            # Resize using high quality resampling
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            output_filename = f"icon-{size}x{size}.png"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            
            resized_img.save(output_path, "PNG")
            print(f"Generated {output_filename}")
            
    print("All icons generated successfully!")
    
except Exception as e:
    print(f"Error generating icons: {e}")
