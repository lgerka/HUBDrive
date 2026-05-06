from PIL import Image

img = Image.open('/Users/german/Desktop/HUBDrive/public/hub-drive-logo.png')
bbox = img.getbbox()
print("Bounding box:", bbox)
if bbox:
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    print(f"Content size: {w}x{h}")
    print(f"Aspect ratio: {w/h:.2f}")
    
    # Crop to bounding box to remove extra transparent space
    cropped = img.crop(bbox)
    cropped.save('/Users/german/Desktop/HUBDrive/public/hub-drive-logo.png')
    print("Image cropped and saved!")
