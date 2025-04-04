export function getAccessToken(): string | null;

export function getType(
  value: { query?: boolean; params?: boolean },
  body: any
): { query?: any; params?: any };
