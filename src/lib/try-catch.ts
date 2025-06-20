export async function tryCatch<T>(fn: () => T | Promise<T>): Promise<
  | {
      data: T;
      error: null;
      success: true;
    }
  | {
      data: null;
      error: Error;
      success: false;
    }
> {
  try {
    const data = await fn();
    return { data, error: null, success: true as const };
  } catch (error) {
    return { data: null, error: error as Error, success: false as const };
  }
}
