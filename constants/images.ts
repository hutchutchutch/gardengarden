export const DEFAULT_PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

export const PLACEHOLDER_COLORS = {
  background: '#E5E7EB',
  text: '#9CA3AF'
};

export const getPlaceholderImage = (width = 400, height = 300) => {
  return `https://via.placeholder.com/${width}x${height}/E5E7EB/9CA3AF?text=No+Image`;
}; 