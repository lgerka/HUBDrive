from PIL import Image

img = Image.open('/Users/german/Desktop/HUBDrive/public/hub-drive-logo-new.png').convert("RGBA")
pixels = img.load()

for y in range(img.height):
    for x in range(img.width):
        r, g, b, a = pixels[x, y]
        
        # Checkerboard / White is typically very bright and neutral
        brightness = (r + g + b) / 3
        
        if brightness > 220:
            # Fully transparent for pure background
            pixels[x, y] = (255, 255, 255, 0)
        elif brightness > 150:
            # Determine if this pixel is closer to orange or just gray edge
            # Orange is high red, low blue
            if r > 200 and b < 100:
                # It's an anti-aliased edge of the orange tread
                # Let's keep the color but reduce alpha to blend it smoothly
                alpha = int(255 - (brightness - 150) * 2.5) # Scale alpha down
                pixels[x, y] = (r, g, b, max(0, min(255, alpha)))
            else:
                # Edge of the black text or generic gray
                alpha = int(255 - (brightness - 150) * 2.5)
                pixels[x, y] = (0, 0, 0, max(0, min(255, alpha)))
        elif brightness > 50 and r > 150 and b < 100:
            # Solid orange, keep it
            pixels[x, y] = (r, g, b, 255)
        elif brightness <= 150 and not (r > 150 and b < 100):
            # Solid black text or its dark edges
            pixels[x, y] = (0, 0, 0, 255)

img.save('/Users/german/Desktop/HUBDrive/public/hub-drive-logo.png')
