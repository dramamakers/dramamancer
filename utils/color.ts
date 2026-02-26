import { findBackgroundColor } from '@/app/editor/utils/color';
import { useEffect, useState } from 'react';

export function useColor(imageUrl?: string) {
  const [textColor, setTextColor] = useState<string | undefined>(undefined);
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!imageUrl) {
      setTextColor(undefined);
      setBackgroundColor(undefined);
      return;
    }

    const calculateColors = async (imageUrl: string) => {
      try {
        const color = await findBackgroundColor(imageUrl);
        const bgColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

        // Calculate relative luminance using the formula
        const luminance = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
        const newTextColor = luminance > 0.5 ? '#000000' : '#ffffff';

        setTextColor(newTextColor);
        setBackgroundColor(bgColor);
      } catch (error) {
        console.error('Error calculating background color:', error);
        setTextColor('#000000');
        setBackgroundColor('#ffffff');
      }
    };

    calculateColors(imageUrl);
  }, [imageUrl, setTextColor, setBackgroundColor]);

  return { textColor, backgroundColor };
}

export function useHintColors(imageUrl?: string) {
  const [hintBackgroundColor, setHintBackgroundColor] = useState<string | undefined>(undefined);
  const [hintTextColor, setHintTextColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!imageUrl) {
      setHintBackgroundColor(undefined);
      setHintTextColor(undefined);
      return;
    }

    const calculateHintColors = async (imageUrl: string) => {
      try {
        const baseColorFactor = window.matchMedia('(prefers-color-scheme: dark)').matches ? 0 : 255;
        const color = await findBackgroundColor(imageUrl);

        // Calculate hint colors
        // For hint background: make the color much lighter (mix with white)
        const lightnessFactor = 0.6; // Mix 60% white with 40% of the original color
        const hintBgR = Math.round(
          color[0] * (1 - lightnessFactor) + baseColorFactor * lightnessFactor,
        );
        const hintBgG = Math.round(
          color[1] * (1 - lightnessFactor) + baseColorFactor * lightnessFactor,
        );
        const hintBgB = Math.round(
          color[2] * (1 - lightnessFactor) + baseColorFactor * lightnessFactor,
        );

        // Adjust saturation for hint background
        const hintBgGray = (hintBgR + hintBgG + hintBgB) / 3;
        const hintBgSaturation = 3; // Increase saturation
        const hintBgRSat = Math.round(hintBgGray + (hintBgR - hintBgGray) * hintBgSaturation);
        const hintBgGSat = Math.round(hintBgGray + (hintBgG - hintBgGray) * hintBgSaturation);
        const hintBgBSat = Math.round(hintBgGray + (hintBgB - hintBgGray) * hintBgSaturation);
        const newHintBackgroundColor = `rgb(${hintBgRSat}, ${hintBgGSat}, ${hintBgBSat})`;

        // For hint text: create a dark version of the color (mix with black)
        const darknessFactor = 0.5; // Mix 10% black with 90% of the original color
        const hintTextR = Math.round(
          color[0] * (1 - darknessFactor) + (255 - baseColorFactor) * darknessFactor,
        );
        const hintTextG = Math.round(
          color[1] * (1 - darknessFactor) + (255 - baseColorFactor) * darknessFactor,
        );
        const hintTextB = Math.round(
          color[2] * (1 - darknessFactor) + (255 - baseColorFactor) * darknessFactor,
        );

        // Adjust saturation for hint text
        const hintTextGray = (hintTextR + hintTextG + hintTextB) / 3;
        const hintTextSaturation = 3; // Increase saturation
        const hintTextRSat = Math.round(
          hintTextGray + (hintTextR - hintTextGray) * hintTextSaturation,
        );
        const hintTextGSat = Math.round(
          hintTextGray + (hintTextG - hintTextGray) * hintTextSaturation,
        );
        const hintTextBSat = Math.round(
          hintTextGray + (hintTextB - hintTextGray) * hintTextSaturation,
        );
        const newHintTextColor = `rgb(${hintTextRSat}, ${hintTextGSat}, ${hintTextBSat})`;

        setHintBackgroundColor(newHintBackgroundColor);
        setHintTextColor(newHintTextColor);
      } catch (error) {
        console.error('Error calculating hint colors:', error);
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setHintBackgroundColor('#333333');
          setHintTextColor('#f0f0f0');
        } else {
          setHintBackgroundColor('#f0f0f0');
          setHintTextColor('#333333');
        }
      }
    };

    calculateHintColors(imageUrl);
  }, [imageUrl]);

  return { hintBackgroundColor, hintTextColor };
}
