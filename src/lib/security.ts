/**
 * SECURITY UTILITIES
 * Fonctions de sécurité pour le frontend
 * 
 * RAPPEL: Le frontend ne doit JAMAIS être la seule ligne de défense.
 * Ces fonctions sont des couches supplémentaires, pas des remplacements pour RLS.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// ROLE CHECKING (Frontend UI only)
// ============================================

/**
 * Vérifie le rôle de l'utilisateur côté client
 * ATTENTION: Utiliser uniquement pour l'affichage UI, pas pour la sécurité!
 * La vraie vérification se fait via RLS côté serveur.
 */
export async function checkUserRole(): Promise<'admin' | 'employee' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return 'employee';
    return data.role as 'admin' | 'employee';
  } catch {
    return null;
  }
}

// ============================================
// SESSION SECURITY
// ============================================

/**
 * Vérifie si la session est valide et active
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // Vérifie l'expiration
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Force le refresh de la session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.refreshSession();
    return !error;
  } catch {
    return false;
  }
}

/**
 * Déconnexion sécurisée
 */
export async function secureSignOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    // Nettoyage supplémentaire
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  } catch {
    // Force la déconnexion même en cas d'erreur
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/auth';
  }
}

// ============================================
// CONTENT SECURITY
// ============================================

/**
 * Vérifie si une URL est sûre (pas de javascript:, data:, etc.)
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmedUrl = url.trim().toLowerCase();
  
  // Protocoles dangereux
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ];

  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }

  // Vérifie que c'est une URL valide
  try {
    new URL(url, window.location.origin);
    return true;
  } catch {
    return false;
  }
}

/**
 * Crée un lien sûr pour les attributs href
 */
export function safeHref(url: string): string {
  return isSafeUrl(url) ? url : '#';
}

// ============================================
// ANTI-TAMPERING
// ============================================

/**
 * Génère un nonce pour les requêtes sensibles
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie l'intégrité d'un objet (hash simple)
 */
export function hashObject(obj: Record<string, unknown>): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// TIMING ATTACK PROTECTION
// ============================================

/**
 * Comparaison sécurisée de chaînes (temps constant)
 * Prévient les timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // On fait quand même la comparaison pour garder un temps constant
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i % b.length);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================
// RATE LIMIT CLIENT-SIDE (UI feedback only)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Vérifie si une action est rate limitée côté client
 * ATTENTION: Ceci est uniquement pour le feedback UI!
 * Le vrai rate limiting est côté serveur.
 */
export function isRateLimited(
  action: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = action;
  const entry = rateLimitCache.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxAttempts;
}

/**
 * Réinitialise le rate limit pour une action
 */
export function resetRateLimit(action: string): void {
  rateLimitCache.delete(action);
}

// ============================================
// SECURE STORAGE
// ============================================

/**
 * NE PAS stocker de données sensibles côté client!
 * Ces fonctions sont pour des données non-sensibles uniquement.
 */

const STORAGE_PREFIX = 'casserole_';

export function getSecureItem(key: string): string | null {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

export function setSecureItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    // Silently fail
  }
}

export function removeSecureItem(key: string): void {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Silently fail
  }
}
