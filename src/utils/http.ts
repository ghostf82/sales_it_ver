export const ok = (data: any) => ({ success: true, data });
export const fail = (message: string) => ({ success: false, error: message });