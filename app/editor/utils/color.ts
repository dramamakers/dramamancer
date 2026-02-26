import ColorThief from 'colorthief';

export const findBackgroundColor = (imageUrl: string): Promise<[number, number, number]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const colorThief = new ColorThief();
      const color = colorThief.getColor(img);
      resolve(color as [number, number, number]);
    };
  });
};
