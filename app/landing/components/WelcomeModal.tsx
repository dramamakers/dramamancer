'use client';
import { HELP_LINK } from '@/app/constants';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const WELCOME_MODAL_SEEN_KEY = 'dramamancer-welcome-modal-seen';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem(WELCOME_MODAL_SEEN_KEY);
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[20] backdrop-blur-sm"
    >
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="md"
        actions={
          <div className="flex justify-between w-full gap-2">
            <Button variant="link" onClick={() => window.open(HELP_LINK, '_blank')}>
              Learn more
            </Button>
            <Button onClick={handleClose}>Okay!</Button>
          </div>
        }
      >
        <div className="flex gap-10 items-center px-10">
          <Image
            src={'/featured/cat.png'}
            alt="Welcome mascot"
            width={100}
            height={100}
            className="flex-shrink-0 w-60"
          />
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl! font-bold! leading-none">
              Welcome to
              <br />
              Dramamancer!{' '}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              An AI game-maker for interactive stories.
            </p>
            <p>
              Dive into adventures narrated by AI, crafted by humans. Explore branching storylines,
              hunt for hidden endings, and meet new characters with each playthrough.
            </p>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
