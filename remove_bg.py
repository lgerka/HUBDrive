from rembg import remove
from PIL import Image

input_path = '/Users/german/Desktop/HUBDrive/public/hub-drive-logo-new.png'
output_path = '/Users/german/Desktop/HUBDrive/public/hub-drive-logo.png' # Overwrite old logo

input_img = Image.open(input_path)
output_img = remove(input_img)
output_img.save(output_path)
