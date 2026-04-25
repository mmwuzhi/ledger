/** Prepends the Next.js basePath so fetch() calls work correctly. */
export const apiBase = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
