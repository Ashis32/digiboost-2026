import os
import re
import shutil
from PIL import Image

def clean_filename(filename):
    base, ext = os.path.splitext(filename)
    # Replace spaces, parentheses, and hashes with underscores
    cleaned = re.sub(r'[\s()#]', '_', base)
    # Compress multiple underscores
    cleaned = re.sub(r'_+', '_', cleaned)
    # Strip leading/trailing underscores
    cleaned = cleaned.strip('_')
    return cleaned + '.webp'

def process_images():
    src_dir = './src/assets/brands'
    proc_dir = os.path.join(src_dir, 'processed')

    # Create processed directory if it doesn't exist
    if not os.path.exists(proc_dir):
        os.makedirs(proc_dir)
    else:
        # Clear existing files in processed folder
        for item in os.listdir(proc_dir):
            item_path = os.path.join(proc_dir, item)
            if os.path.isfile(item_path) and not item.startswith('.'):
                os.remove(item_path)

    valid_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.svg'}

    # Read and sort source files for predictability
    items = sorted(os.listdir(src_dir))
    
    processed_count = 0
    for item in items:
        item_path = os.path.join(src_dir, item)
        
        # Skip directories (like processed) and hidden files
        if os.path.isdir(item_path) or item.startswith('.'):
            continue
            
        ext = os.path.splitext(item)[1].lower()
        if ext not in valid_extensions:
            continue

        output_name = clean_filename(item)
        output_path = os.path.join(proc_dir, output_name)

        try:
            with Image.open(item_path) as img:
                # Convert to RGBA to preserve transparency
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                # Resize preserving aspect ratio (max height 150, max width 400)
                img.thumbnail((400, 150), Image.Resampling.LANCZOS)
                
                # Save as WebP
                img.save(output_path, 'WEBP', quality=85)
                print(f"Processed: {item} -> {output_name} (Size: {img.size})")
                processed_count += 1
        except Exception as e:
            print(f"Error processing {item}: {e}")
            
    print(f"\nSuccessfully synced brand logos. Total processed: {processed_count}")

if __name__ == '__main__':
    process_images()
