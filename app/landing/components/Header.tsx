import { FullWidthHeader } from '@/components/Header';
import User from '@/components/User';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

export default function DiscoverHeader({ right }: { right?: ReactNode }) {
  const router = useRouter();

  return (
    <FullWidthHeader
      left={
        <div className="flex gap-2 items-center">
          <Image
            src="/llama.png"
            alt="Dramamancer"
            width={40}
            height={40}
            className="cursor-pointer"
            onClick={() => router.push('/')}
          />
          <h1>Dramamancer</h1>
        </div>
      }
      right={
        <div className="w-fit flex gap-4 items-center">
          {right}
          <div>
            <User />
          </div>
        </div>
      }
    />
  );
}
