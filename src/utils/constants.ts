export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export const REACTION_SENTIMENT: Record<string, 'good' | 'neutral' | 'bad'> = {
  '👍': 'good', '🔥': 'good', '💪': 'good', '❤️': 'good', '🎉': 'good',
  '😍': 'good', '🤩': 'good', '🙌': 'good', '✨': 'good', '😎': 'good',
  '😐': 'neutral', '🤔': 'neutral', '😶': 'neutral', '😑': 'neutral', '🙂': 'neutral',
  '😏': 'neutral', '👀': 'neutral', '🤷': 'neutral', '😮': 'neutral', '💭': 'neutral',
  '👎': 'bad', '😤': 'bad', '😠': 'bad', '😒': 'bad', '😞': 'bad',
  '😔': 'bad', '💢': 'bad', '🤦': 'bad', '😩': 'bad', '😫': 'bad',
};
