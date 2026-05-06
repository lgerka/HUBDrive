from PIL import Image

img_new = Image.open('/Users/german/Desktop/HUBDrive/public/hub-drive-logo-new.png').convert("RGBA")
data = list(img_new.getdata())

# Find the most common orange color
orange_pixels = [p for p in data if p[0] > 150 and p[1] < 150 and p[2] < 50]
from collections import Counter
print("Orange colors:", Counter(orange_pixels).most_common(5))
