import { useAuth } from '@/components/Auth/AuthContext';
import { useMenu } from '@/components/Menu';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import { useLoginModal } from './Auth/LoginModalProvider';
import Button from './Button';

export default function User() {
  const { user, loading } = useAuth();
  const { showMenu } = useMenu();
  const { openLoginModal } = useLoginModal();

  if (loading) {
    return null;
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (user) {
      showMenu(e, [
        {
          label: `Hi, ${user.displayName}!`,
          value: 'hi',
          disabled: true,
        },
        {
          label: 'Profile',
          value: 'my-profile',
          onSelect: () => (window.location.href = `/users/${user.userId}`),
        },
      ]);
    } else {
      openLoginModal();
    }
  };

  if (!user) {
    return <Button onClick={openLoginModal}>Login</Button>;
  }

  return (
    <div
      className={twMerge(
        'bg-slate-300 dark:bg-slate-700 rounded-full h-10 w-10 cursor-pointer overflow-hidden',
      )}
      onClick={handleMenuClick}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <Image
            src="/placeholder.png"
            alt="User"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
