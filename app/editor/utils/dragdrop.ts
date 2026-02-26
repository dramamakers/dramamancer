/**
 * Checks if the data transfer contains an image (either file or URL)
 */
export function isDraggingImage(dataTransfer: DataTransfer): boolean {
  // Check for image files
  const hasImageFile = Array.from(dataTransfer.items).some(
    (item) => item.kind === 'file' && item.type.startsWith('image/'),
  );

  // Check for URLs that might be images
  const hasTextUrl =
    dataTransfer.types.includes('text/plain') || dataTransfer.types.includes('Text');

  return hasImageFile || hasTextUrl;
}

/**
 * Checks if the data transfer contains a character
 */
export function isDraggingCharacter(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes('characterid');
}
