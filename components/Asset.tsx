import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

export default function Asset({
  imageUrl,
  className,
  alt = 'Asset',
  style,
  autoPlay = true,
}: {
  imageUrl?: string;
  className?: string;
  alt?: string;
  autoPlay?: boolean;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const fileType = imageUrl?.includes('.mp4') ? 'video' : 'image';

  // Auto-play video when it loads
  useEffect(() => {
    const video = videoRef.current;
    if (video && fileType === 'video' && autoPlay) {
      const tryPlay = async () => {
        try {
          // Wait for any previous play promise to resolve
          if (playPromiseRef.current) {
            await playPromiseRef.current;
          }

          playPromiseRef.current = video.play();
          await playPromiseRef.current;
          playPromiseRef.current = null;
        } catch (error: unknown) {
          // Ignore play interruption errors as they're expected behavior
          if (error instanceof Error && error.name !== 'AbortError') {
            console.warn('Video play failed:', error);
          }
          playPromiseRef.current = null;
        }
      };

      tryPlay();
    }
  }, [autoPlay, fileType, imageUrl]);

  if (!imageUrl) {
    return null;
  }

  if (fileType === 'video') {
    return (
      <video
        ref={videoRef}
        src={imageUrl}
        className={twMerge('w-full h-full object-cover cursor-pointer', className)}
        muted
        loop
        playsInline
      />
    );
  }

  return (
    <div
      className={twMerge(
        'h-full w-full relative bg-white dark:bg-slate-900 overflow-hidden',
        className,
      )}
    >
      <Image
        width={100}
        height={100}
        alt={alt}
        className="object-cover h-full w-full"
        src={imageUrl}
        style={style}
      />
    </div>
  );
}
