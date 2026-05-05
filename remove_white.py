from PIL import Image

def make_transparent(image_path):
    img = Image.open(image_path).convert('RGBA')
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # Check if pixel is white or very close to white
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # Make transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(image_path, 'PNG')

make_transparent('public/hub-drive-logo.png')
