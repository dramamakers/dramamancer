import { AnimatePresence, motion } from 'framer-motion';
import Image, { ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export default function LazyImage(props: ImageProps & { showSkeleton?: boolean }) {
  const { src, className, alt, showSkeleton = true, ...rest } = props;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex h-full"
      >
        <Image
          alt={alt}
          src={imageError || !src ? '/placeholder.png' : src}
          {...rest}
          className={twMerge(
            'object-cover w-full h-full hover:scale-101 hover:brightness-110 transition-all duration-300',
            imageLoaded && isInView ? 'opacity-100' : 'opacity-0',
            className,
          )}
          loading="lazy"
          style={{ visibility: imageLoaded && isInView ? 'visible' : 'hidden' }}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />

        {/* Loading skeleton */}
        {(!imageLoaded || !isInView) && !imageError && showSkeleton && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
