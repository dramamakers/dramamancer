export default function ProjectCardPlaceholder() {
  return (
    <div className="flex flex-col gap-2">
      {/* Image placeholder */}
      <div className="relative w-full aspect-[3/2] overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse">
        {/* Stats placeholder in top right */}
        <div className="absolute top-2 right-2 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 z-[1]">
          <div className="flex items-center gap-2">
            <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Text placeholders */}
      <div className="flex flex-col gap-1">
        {/* Title */}
        <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        {/* Description */}
        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        {/* Author */}
        <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  );
}
