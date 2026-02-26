import { AnimatePresence, motion } from 'framer-motion';
import { useTooltip } from './TooltipContext';

export function Tooltip() {
  const { tooltip } = useTooltip();
  if (!tooltip) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={tooltip.text}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
        className="fixed z-99 border-[0.5px] border-slate-300 dark:border-slate-700 dark:border-opacity-50 rounded-lg pointer-events-none bg-white dark:bg-slate-800 text-black dark:text-white text-sm px-2 py-1 max-w-xs break-words whitespace-pre-line"
        style={{
          left: tooltip.position.x + 10,
          top: tooltip.position.y + 10,
        }}
      >
        {tooltip.text}
      </motion.div>
    </AnimatePresence>
  );
}
