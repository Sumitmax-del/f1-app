import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const cacheGet = <T>(key: string): T | undefined => {
  return cache.get<T>(key);
};

export const cacheSet = <T>(key: string, value: T, ttl?: number): boolean => {
  if (ttl) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
};

export const cacheFlush = (): void => {
  cache.flushAll();
};

export default cache;
