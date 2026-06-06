export function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
