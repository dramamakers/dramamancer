// Local file upload functionality
export function handleLocalUpload(files: FileList, setImageUrl: (url: string) => void) {
  const file = files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    console.error('Invalid file type. Please upload an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    if (event.target?.result) {
      setImageUrl(event.target.result as string);
    }
  };
  reader.onerror = (error) => {
    console.error('Error reading file:', error);
  };
  reader.readAsDataURL(file);
}

// URL or file drop functionality
export function handleUpload(e: React.DragEvent, setImageUrl: (url: string) => void) {
  try {
    // Try to get URL from various data types
    const url =
      e.dataTransfer.getData('Text') ||
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('text/uri-list');

    if (url) {
      // Check if it's a valid URL
      try {
        new URL(url);
        // Check if it's a direct image URL or a Google Images URL
        if (
          url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
          url.includes('google.com/images') ||
          url.includes('img.google.com')
        ) {
          // Use the proxy for external URLs
          setImageUrl(url);
          return;
        }
      } catch (e) {
        console.error('Error checking URL:', url, e);
      }
    }

    // Check if it's a file being dropped
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleLocalUpload(files, setImageUrl);
    }
  } catch (error) {
    console.error('Error handling upload:', error);
  }
}
