export const formatTimeAgo = (timestamp?: number | null, variant: 'short' | 'long' = 'long') => {
  if (!timestamp) return 'never';
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  if (variant === 'short') {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    });
  }

  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: variant,
    day: 'numeric',
  });
};

export const formatNumber = (number: number) => {
  if (number < 1000) return number.toString();
  if (number < 1000000) return `${(number / 1000).toFixed(1)}k`;
  return `${(number / 1000000).toFixed(1)}M`;
};

export const formatPercentage = (percentage: number) => {
  return `${percentage.toFixed(0)}%`;
};

export const formatSceneTitle = (title: string, index?: number) => {
  return title || (index !== undefined ? `Scene ${index + 1}` : 'Untitled scene');
};
