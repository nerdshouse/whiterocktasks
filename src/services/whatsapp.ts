/**
 * 11za WhatsApp API client for sending template messages.
 * See: https://app.11za.in/apis/template/sendTemplate
 */

const API_URL =
  import.meta.env.VITE_11ZA_API_URL || 'https://app.11za.in/apis/template/sendTemplate';
const ORIGIN_WEBSITE =
  import.meta.env.VITE_11ZA_ORIGIN_WEBSITE || 'https://whiterock.co.in/';
const AUTH_TOKEN = import.meta.env.VITE_11ZA_AUTH_TOKEN || '';

/** Normalize phone to 11za format: country code + number, no + or spaces (e.g. 919876543210) */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && !digits.startsWith('0')) return '91' + digits;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

export interface SendTemplateParams {
  /** Recipient phone (will be normalized) */
  phone: string;
  /** Template name as created in 11za dashboard */
  templateName: string;
  /** Body variables in order ({{1}}, {{2}}, ...) */
  bodyParams?: string[];
  /** Optional header variable (if template has header) */
  headerParam?: string;
}

/**
 * Send a WhatsApp template message via 11za API.
 * You must create the template in 11za dashboard and pass matching templateName and params.
 */
export async function sendTemplate(params: SendTemplateParams): Promise<void> {
  const { phone, templateName, bodyParams = [], headerParam } = params;
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) throw new Error('Invalid phone number');

  if (!AUTH_TOKEN) {
    console.warn('[11za] VITE_11ZA_AUTH_TOKEN not set; skipping WhatsApp send');
    return;
  }

  const body: Record<string, unknown> = {
    phone: normalizedPhone,
    templateName,
    originWebsite: ORIGIN_WEBSITE,
  };
  if (bodyParams.length) body.bodyParams = bodyParams;
  if (headerParam != null) body.headerParam = headerParam;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
      ...(ORIGIN_WEBSITE ? { 'X-Origin-Website': ORIGIN_WEBSITE } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`11za API error ${res.status}: ${text}`);
  }
}
