import { ApiError } from './ApiError';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { createTokenStorage } from './createTokenStorage';
import type { TokenStorage } from './TokenStorage';
import type { AuthSession, SessionListener, TokenResponse } from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string>;
  // Csatolja az access tokent (alapból true)
  auth?: boolean;
}

// Kicsivel a lejárati idő előtt frissítünk, hogy a párhuzamos kérések ne fussanak hibára
const EXPIRY_LEEWAY_MS = 30_000;

// Központi HTTP kliens a backend API eléréséhez.
// Kezeli a Bearer tokent, automatikusan frissíti a lejárt sessiont,
// és értesíti az AuthProvidert a bejelentkezési állapot változásakor.
export class ApiClient {
  private session: AuthSession | null = null;
  private refreshInFlight: Promise<AuthSession | null> | null = null;
  private readonly listeners = new Set<SessionListener>();

  constructor(
    private readonly baseUrl: string = API_BASE_URL,
    private readonly storage: TokenStorage = createTokenStorage(),
  ) {}

  public static getInstance(): ApiClient {
    return apiClient;
  }

  // ---------- Session ----------

  public getSession(): AuthSession | null {
    return this.session;
  }

  public onSessionChange(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Elmentett session betöltése indításkor
  public async restoreSession(): Promise<AuthSession | null> {
    this.session = await this.storage.load();
    return this.session;
  }

  public async startSession(tokens: TokenResponse): Promise<AuthSession> {
    const session: AuthSession = {
      user: tokens.user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    await this.storage.save(session);
    this.setSession(session);
    return session;
  }

  public async endSession(): Promise<void> {
    await this.storage.clear();
    this.setSession(null);
  }

  private setSession(session: AuthSession | null) {
    this.session = session;
    this.listeners.forEach((listener) => listener(session));
  }

  // ---------- HTTP ----------

  public get<T>(path: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('GET', path, options);
  }

  public post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('POST', path, { ...options, body });
  }

  public put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('PUT', path, { ...options, body });
  }

  public patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  public delete<T>(path: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const useAuth = options.auth ?? true;

    if (!useAuth) {
      return this.parse<T>(await this.send(method, path, options));
    }

    let token = await this.getFreshAccessToken();
    let response = await this.send(method, path, options, token);

    // Ha 401 jön (lejárt token vagy eltérés), egyszer megpróbáljuk frissíteni
    if (response.status === 401) {
      token = (await this.refresh())?.accessToken ?? null;
      response = await this.send(method, path, options, token);
    }

    return this.parse<T>(response);
  }

  private async getFreshAccessToken(): Promise<string | null> {
    if (!this.session) return null;
    if (this.session.expiresAt - EXPIRY_LEEWAY_MS > Date.now()) {
      return this.session.accessToken;
    }
    return (await this.refresh())?.accessToken ?? null;
  }

  // A refresh token egyszer használatos, ezért a kérések egy közös frissítést használnak
  private refresh(): Promise<AuthSession | null> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.performRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  private async performRefresh(): Promise<AuthSession | null> {
    const refreshToken = this.session?.refreshToken;
    if (!refreshToken) return null;

    // Hálózati hiba esetén megtartjuk a sessiont, hogy kapcsolat nélkül ne léptessen ki
    const response = await this.send('POST', '/auth/refresh', { body: { refresh_token: refreshToken } });

    if (response.status === 401) {
      await this.endSession();
      return null;
    }
    return this.startSession(await this.parse<TokenResponse>(response));
  }

  private async send(
    method: HttpMethod,
    path: string,
    { body, query }: RequestOptions,
    token?: string | null,
  ): Promise<Response> {
    // Kézi lekérdezési sztring építés: a React Native URL polyfillje nem támogatja teljes körűen a searchParams-t
    const qs = query
      ? '?' + Object.entries(query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
      : '';
    const url = this.baseUrl + path + qs;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.code ?? 'unknown_error',
        data?.message ?? `Request failed with status ${response.status}`,
      );
    }
    return data as T;
  }
}

export const apiClient = new ApiClient();
