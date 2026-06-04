const adjectives = ['happy', 'bright', 'cozy', 'warm', 'sunny', 'gentle', 'sweet', 'calm', 'kind', 'fresh'];

export function generateSlug(familyName) {
  const sanitized = familyName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '');

  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 5);

  return `${sanitized || adjectives[Math.floor(Math.random() * adjectives.length)]}-${year}-${rand}`;
}

export function sanitizeSlug(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .slice(0, 60);
}
