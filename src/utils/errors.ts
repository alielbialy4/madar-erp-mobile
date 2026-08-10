import { AxiosError } from 'axios';
import { firstError } from './data';

export type NormalizedApiError = {
  status?: number;
  message: string;
  validation?: Record<string, string[] | string>;
  code?: string;
};

function networkMessage(error: AxiosError): string {
  const code = error.code ?? '';
  if (code === 'ECONNABORTED') {
    return 'استغرق الاتصال وقتًا أطول من المعتاد. تحقق من الشبكة ثم أعد المحاولة.';
  }
  return 'تعذر الوصول إلى خادم مدار حاليًا. تحقق من اتصال الإنترنت أو تواصل مع مسؤول النظام.';
}

export function isTableOrderConflictError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<{ code?: string }>;
    return axiosError.response?.status === 409 && axiosError.response?.data?.code === 'table_order_conflict';
  }
  return false;
}

export function getTableOrderConflictSale(error: unknown): Record<string, unknown> | null {
  if (!isTableOrderConflictError(error)) return null;
  const axiosError = error as AxiosError<{ data?: Record<string, unknown> }>;
  const sale = axiosError.response?.data?.data;
  return sale && typeof sale === 'object' ? sale : null;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  const fallback = 'تعذر الاتصال بالخادم';
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    const validation = data?.errors;
    const validationMessage = firstError(validation);
    if (status === 403) {
      return { status, message: data?.message || 'ليس لديك صلاحية لتنفيذ هذه العملية.', validation, code: data?.code };
    }
    if (status === 422) {
      return {
        status,
        message: validationMessage || data?.message || 'بيانات النموذج غير صحيحة',
        validation,
        code: data?.code,
      };
    }
    if (status === 401) {
      return { status, message: data?.message || 'انتهت الجلسة. سجّل الدخول مرة أخرى.' };
    }
    if (!axiosError.response) {
      return { message: networkMessage(axiosError) };
    }
    return { status, message: data?.message || axiosError.message || fallback, validation, code: data?.code };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: fallback };
}
