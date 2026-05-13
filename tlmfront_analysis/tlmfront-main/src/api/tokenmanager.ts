let memoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getAccessToken = () => {
  return memoryAccessToken;
};

export const clearAccessToken = () => {
  memoryAccessToken = null;
};
