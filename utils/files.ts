export const downloadFile = (data: JSON, filename: string) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', filename);
  linkElement.click();
};

/**
 * Resizes an image to a maximum height while maintaining aspect ratio
 * @param base64String - The base64 data URL of the image
 * @param originalMediaType - The original media type of the image (e.g., 'image/png')
 * @param maxHeight - Maximum height in pixels (default: 240)
 * @returns Promise resolving to { data: base64 without prefix, mediaType: string, preview: full base64 URL }
 */
export const resizeImage = (
  base64String: string,
  originalMediaType: string,
  maxHeight: number = 240,
): Promise<{ data: string; mediaType: string; preview: string }> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = () => {
      // Calculate new dimensions (max height, proportional width)
      let newWidth = img.width;
      let newHeight = img.height;

      if (newHeight > maxHeight) {
        const ratio = maxHeight / newHeight;
        newHeight = maxHeight;
        newWidth = Math.round(img.width * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert canvas to base64 (use JPEG for better compression if not PNG/GIF)
      const outputFormat =
        originalMediaType === 'image/png' || originalMediaType === 'image/gif'
          ? originalMediaType
          : 'image/jpeg';
      const resizedBase64String = canvas.toDataURL(outputFormat, 0.9);
      const resizedBase64Data = resizedBase64String.split(',')[1];

      console.log(`Image resized: ${img.width}x${img.height} → ${newWidth}x${newHeight}`);

      resolve({
        data: resizedBase64Data,
        mediaType: outputFormat,
        preview: resizedBase64String,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = base64String;
  });
};
