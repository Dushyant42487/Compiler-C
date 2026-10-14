import { CompileRequest, CompileResponse, CompilerInfoResponse, HealthResponse } from '../types/compiler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class CompilerApiService {
  private static async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000} seconds. The backend or compiler may be busy.`);
      }
      throw new Error(`Network error connecting to compiler backend: ${err.message || 'Connection refused'}`);
    } finally {
      clearTimeout(timer);
    }
  }

  public static async getHealth(): Promise<HealthResponse> {
    const res = await this.fetchWithTimeout(`${API_BASE_URL}/api/health`, { method: 'GET' }, 5000);
    if (!res.ok) {
      throw new Error(`Backend health check failed (HTTP ${res.status})`);
    }
    return res.json();
  }

  public static async getCompilerInfo(): Promise<CompilerInfoResponse> {
    const res = await this.fetchWithTimeout(`${API_BASE_URL}/api/compiler/info`, { method: 'GET' }, 5000);
    if (!res.ok) {
      throw new Error(`Failed to retrieve compiler metadata (HTTP ${res.status})`);
    }
    return res.json();
  }

  public static async compile(payload: CompileRequest): Promise<CompileResponse> {
    const res = await this.fetchWithTimeout(`${API_BASE_URL}/api/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.error || `Compilation request failed with status HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as CompileResponse;
  }
}
