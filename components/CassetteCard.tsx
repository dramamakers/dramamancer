import { Project } from '@/app/types';
import { getThumbnailImageUrl } from '@/utils/game';
import Image from 'next/image';

const cassetteWidth = 220;

export function Cassette({ imageUrl }: { imageUrl: string }) {
  const contentWidth = cassetteWidth * 0.86; // cover width
  const contentHeight = contentWidth * 0.28; // cover height (cassette window ratio)
  const contentTop = cassetteWidth * 0.16; // top position
  const contentLeft = cassetteWidth * 0.05; // left position

  return (
    <div
      className="relative drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
      style={{
        width: `${cassetteWidth}px`,
        height: `${cassetteWidth * 0.65}px`, // cassette aspect ratio is approximately 0.65
      }}
    >
      {/* Cover image - placed below transparent cassette */}
      {imageUrl && (
        <div
          className="absolute overflow-hidden"
          style={{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
            top: `${contentTop}px`,
            left: `${contentLeft}px`,
            transform: `
                skewX(40deg)
                skewY(-18deg)
                scale(1.00)
              `,
            transformOrigin: 'center center',
            overflow: 'hidden',
          }}
        >
          <Image
            src={imageUrl}
            alt="Cassette content"
            className="w-full h-full object-cover"
            width={contentWidth}
            height={contentHeight}
            style={{
              objectPosition: 'center center',
              filter: 'brightness(0.95) contrast(1.05)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      )}
      <Image
        src="/cassette.png"
        alt="Cassette"
        width={cassetteWidth}
        height={cassetteWidth * 0.65}
        className="w-full h-full object-contain filter drop-shadow-xl z-[1]"
      />
    </div>
  );
}

export function CassetteCard({ project, onClick }: { project: Project; onClick?: () => void }) {
  const { title, settings } = project;
  const thumbnailImageUrl = getThumbnailImageUrl(project);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="text-center rounded-lg flex flex-col items-center p-4 gap-4 cursor-pointer group justify-center h-full"
        onClick={onClick}
        style={{
          backgroundImage: `url(${thumbnailImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Cassette imageUrl={thumbnailImageUrl} />
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="italic">{settings.shortDescription}</p>
      </div>
    </div>
  );
}
