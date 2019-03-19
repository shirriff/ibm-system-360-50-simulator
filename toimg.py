import pdf2image
pages = pdf2image.convert_from_path('2050_Vol20_Sep72.pdf', first_page=79)

n = 79
for page in pages:
  page.save('page%d.png' % n, 'png')
  n += 1
