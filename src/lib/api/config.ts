import { Platform } from 'react-native';

const DEFAULT_HOST = 'https://fitbase-backend.onrender.com';

const host = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_HOST).replace(/\/+$/, '');

export const API_BASE_URL = `${host}/api/v1`;
export const REQUEST_TIMEOUT_MS = 90_000;
