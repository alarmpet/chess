# Flow 이미지(1024px)의 오른쪽 아래 ✦ 워터마크를 지운다: (921,921) 반지름 40 을 cv2.inpaint TELEA 반지름 9 로 메운다(flow-browser-ops §9).
#   python tools/clean_concept.py <입력.jpg> <출력.jpg>
import sys, cv2, numpy as np
src, dst = sys.argv[1], sys.argv[2]
img = cv2.imread(src)
h, w = img.shape[:2]
s = w / 1024
mask = np.zeros((h, w), np.uint8)
cv2.circle(mask, (round(921 * s), round(921 * s)), round(40 * s), 255, -1)
cv2.imwrite(dst, cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA), [cv2.IMWRITE_JPEG_QUALITY, 92])
print('cleaned', dst)
