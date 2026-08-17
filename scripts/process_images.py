import os
import sys
from PIL import Image

def remove_background_and_crop(img_path, log_file):
    log_file.write(f"Processing: {img_path}\n")
    if not os.path.exists(img_path):
        log_file.write(f"File not found: {img_path}\n")
        return False
        
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    log_file.write(f"Image dimensions: {width}x{height}\n")
    
    # Get corner pixel as reference background color
    ref_color = img.getpixel((5, 5))
    ref_r, ref_g, ref_b = ref_color[0], ref_color[1], ref_color[2]
    log_file.write(f"Reference background color (5,5): RGB({ref_r}, {ref_g}, {ref_b})\n")
    
    new_data = []
    datas = img.getdata()
    transparent_count = 0
    
    for item in datas:
        r, g, b, a = item
        # Calculate Euclidean distance in RGB space
        dist = ((r - ref_r) ** 2 + (g - ref_g) ** 2 + (b - ref_b) ** 2) ** 0.5
        
        # If color is close to reference background, make it transparent
        # Let's use a slightly wider threshold of 80 because gradients can be smooth
        if dist < 80:
            new_data.append((0, 0, 0, 0))
            transparent_count += 1
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    log_file.write(f"Made {transparent_count} pixels transparent out of {len(datas)}\n")
    
    # Crop to bounding box of non-transparent content
    bbox = img.getbbox()
    if bbox:
        log_file.write(f"Bounding box for cropping: {bbox}\n")
        img = img.crop(bbox)
        # Add padding
        padding = 10
        w, h = img.size
        new_img = Image.new("RGBA", (w + padding * 2, h + padding * 2), (0, 0, 0, 0))
        new_img.paste(img, (padding, padding))
        img = new_img
    else:
        log_file.write("No bounding box found (image might be fully transparent!)\n")
        
    img.save(img_path, "PNG")
    log_file.write(f"Successfully processed and saved {img_path}\n\n")
    return True

if __name__ == "__main__":
    log_path = "C:\\Users\\SUMIT\\.gemini\\antigravity-ide\\scratch\\process.log"
    with open(log_path, "w") as log_file:
        log_file.write("Starting image processing...\n")
        if len(sys.argv) < 2:
            log_file.write("No image paths provided.\n")
            sys.exit(1)
        
        for path in sys.argv[1:]:
            remove_background_and_crop(path, log_file)
