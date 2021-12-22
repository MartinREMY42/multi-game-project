from PIL import Image, ImageOps
import sys

if len(sys.argv) != 2:
    print('I need an image file path as argument')

im_pth = sys.argv[1]
print('Squaring %s' % im_pth)

im = Image.open(im_pth)
old_size = im.size
# We preserve the image quality, so keep the max of its width/height
desired_size = max(im.size[0], im.size[1])

ratio = float(desired_size)/max(old_size)
new_size = tuple([int(x*ratio) for x in old_size])

# resize the image so that it is square
im = im.resize(new_size, Image.ANTIALIAS)

# we pad with the color present in (0, 0), which is supposed to be the background color
color = im.getpixel((3, 3))
new_im = Image.new("RGB", (desired_size, desired_size), color)
new_im.paste(im, ((desired_size-new_size[0])//2,
                    (desired_size-new_size[1])//2))

new_im.save(sys.argv[1])
