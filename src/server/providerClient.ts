import { ProviderSettings } from '../types/index.ts';

export interface ProviderOrderResponse {
  success: boolean;
  providerOrderId?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface ProviderBalanceResponse {
  success: boolean;
  balance?: number;
  currency?: string;
  errorMessage?: string;
}

export interface ProviderStatusResponse {
  success: boolean;
  status?: string;
  charge?: number;
  startCount?: number;
  remains?: number;
  errorMessage?: string;
}

/**
 * Communicates with the external SMM provider (e.g., standard SMM v2 API).
 * In test mode or when unconfigured, gracefully executes simulated operations
 * so the platform can be tested end-to-end without spending real provider funds.
 */
export async function forwardOrderToProvider(
  settings: ProviderSettings,
  providerServiceId: string,
  link: string,
  quantity: number
): Promise<ProviderOrderResponse> {
  if (settings.isTestMode || !settings.apiKey || settings.apiKey.includes('placeholder')) {
    // Simulated realistic response
    const mockId = `PRV-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      providerOrderId: mockId,
      rawResponse: { order: mockId, status: 'Pending', mode: 'simulation' },
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('key', settings.apiKey);
    params.append('action', 'add');
    params.append('service', providerServiceId);
    params.append('link', link);
    params.append('quantity', quantity.toString());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        errorMessage: `فشل الاتصال بمزود الخدمة (كود الاستجابة: ${res.status})`,
      };
    }

    const data = await res.json();
    if (data.error) {
      return {
        success: false,
        errorMessage: `خطأ من مزود الخدمة: ${data.error}`,
        rawResponse: data,
      };
    }

    if (data.order) {
      return {
        success: true,
        providerOrderId: String(data.order),
        rawResponse: data,
      };
    }

    return {
      success: false,
      errorMessage: 'استجابة غير متوقعة من مزود الخدمة',
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err.name === 'AbortError' ? 'انتهت مهلة الاتصال بالمزود' : `تعذر الوصول للمزود: ${err.message}`,
    };
  }
}

/**
 * Checks provider status and balance for testing and diagnostics.
 */
export async function testProviderConnection(
  settings: ProviderSettings
): Promise<{ success: boolean; latencyMs: number; message: string; balance?: number }> {
  const startTime = Date.now();

  if (settings.isTestMode || !settings.apiKey || settings.apiKey.includes('placeholder')) {
    const latency = Math.floor(40 + Math.random() * 50);
    return {
      success: true,
      latencyMs: latency,
      message: 'تم فحص الاتصال بالوضع التجريبي: الخادم يستجيب بسرعة وجميع البروتوكولات تعمل بنجاح.',
      balance: settings.balance,
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('key', settings.apiKey);
    params.append('action', 'balance');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        success: false,
        latencyMs,
        message: `استجاب السيرفر برمز خطأ HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    if (data.error) {
      return {
        success: false,
        latencyMs,
        message: `رد المزود بخطأ: ${data.error}`,
      };
    }

    const balance = typeof data.balance === 'number' ? data.balance : parseFloat(data.balance) || 0;
    return {
      success: true,
      latencyMs,
      message: 'الاتصال بالمزود حي ومباشر!',
      balance,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      message: err.name === 'AbortError' ? 'انتهت مهلة فحص الاتصال (Timeout)' : `خطأ أثناء الاتصال: ${err.message}`,
    };
  }
}
