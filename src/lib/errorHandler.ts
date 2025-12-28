/**
 * GESTION SÉCURISÉE DES ERREURS
 * 
 * Principes:
 * - Ne JAMAIS exposer les détails techniques à l'utilisateur
 * - Logger les erreurs complètes uniquement en développement
 * - Toujours retourner des messages génériques en production
 */

// Détermine si on est en mode développement
const isDevelopment = import.meta.env.DEV;

// Types d'erreurs pour classification
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  NETWORK = 'network',
  DATABASE = 'database',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

// Interface pour erreur structurée
interface StructuredError {
  type: ErrorType;
  userMessage: string;
  technicalMessage?: string;
  code?: string;
  statusCode?: number;
}

// Messages utilisateur génériques (ne révèlent rien de technique)
const USER_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION]: 'Identifiants incorrects ou session expirée',
  [ErrorType.AUTHORIZATION]: 'Vous n\'avez pas les permissions nécessaires',
  [ErrorType.VALIDATION]: 'Les données saisies sont invalides',
  [ErrorType.NOT_FOUND]: 'La ressource demandée n\'existe pas',
  [ErrorType.NETWORK]: 'Erreur de connexion. Veuillez réessayer',
  [ErrorType.DATABASE]: 'Une erreur est survenue. Veuillez réessayer',
  [ErrorType.RATE_LIMIT]: 'Trop de tentatives. Veuillez patienter',
  [ErrorType.UNKNOWN]: 'Une erreur est survenue. Veuillez réessayer',
};

/**
 * Classifie une erreur Supabase ou générique
 */
function classifyError(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  // Erreur Supabase/PostgreSQL
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const message = String(err.message || err.error || '').toLowerCase();
    const code = String(err.code || '');

    // Authentification
    if (
      message.includes('invalid login') ||
      message.includes('invalid password') ||
      message.includes('email not confirmed') ||
      message.includes('jwt') ||
      message.includes('token') ||
      code === 'PGRST301'
    ) {
      return ErrorType.AUTHENTICATION;
    }

    // Autorisation (RLS)
    if (
      message.includes('permission') ||
      message.includes('row-level security') ||
      message.includes('rls') ||
      message.includes('policy') ||
      code === '42501'
    ) {
      return ErrorType.AUTHORIZATION;
    }

    // Validation
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('constraint') ||
      code.startsWith('22') || // Data exceptions
      code.startsWith('23')    // Integrity constraints
    ) {
      return ErrorType.VALIDATION;
    }

    // Not found
    if (
      message.includes('not found') ||
      message.includes('no rows') ||
      code === 'PGRST116'
    ) {
      return ErrorType.NOT_FOUND;
    }

    // Rate limit
    if (
      message.includes('rate limit') ||
      message.includes('too many')
    ) {
      return ErrorType.RATE_LIMIT;
    }

    // Réseau
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout')
    ) {
      return ErrorType.NETWORK;
    }

    // Base de données
    if (
      code.startsWith('P') || // PostgreSQL
      code.startsWith('42') || // Syntax
      code.startsWith('53') || // Insufficient resources
      message.includes('database')
    ) {
      return ErrorType.DATABASE;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Traite une erreur et retourne une version sécurisée
 * 
 * @param error - L'erreur originale
 * @param context - Contexte optionnel pour le logging
 * @returns Message utilisateur sécurisé
 */
export function handleError(error: unknown, context?: string): string {
  const errorType = classifyError(error);
  const userMessage = USER_MESSAGES[errorType];

  // Log complet uniquement en développement
  if (isDevelopment) {
    console.group(`🚨 Error [${errorType}]${context ? ` - ${context}` : ''}`);
    console.error('Full error:', error);
    console.error('Type:', errorType);
    console.error('User message:', userMessage);
    console.groupEnd();
  }

  return userMessage;
}

/**
 * Crée une erreur structurée pour un meilleur handling
 */
export function createStructuredError(
  error: unknown,
  context?: string
): StructuredError {
  const type = classifyError(error);
  
  return {
    type,
    userMessage: USER_MESSAGES[type],
    technicalMessage: isDevelopment && error instanceof Error ? error.message : undefined,
    code: typeof error === 'object' && error !== null ? String((error as Record<string, unknown>).code || '') : undefined,
  };
}

/**
 * Log sécurisé - ne log les détails qu'en dev
 */
export function secureLog(message: string, data?: unknown): void {
  if (isDevelopment) {
    console.log(`[DEV] ${message}`, data);
  }
  // En production, on pourrait envoyer à un service de monitoring
  // sans les données sensibles
}

/**
 * Vérifie si une erreur est une erreur d'authentification
 */
export function isAuthError(error: unknown): boolean {
  return classifyError(error) === ErrorType.AUTHENTICATION;
}

/**
 * Vérifie si une erreur est une erreur d'autorisation (RLS)
 */
export function isAuthorizationError(error: unknown): boolean {
  return classifyError(error) === ErrorType.AUTHORIZATION;
}

/**
 * Wrapper pour les appels async avec gestion d'erreur intégrée
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const data = await asyncFn();
    return { data, error: null };
  } catch (error) {
    const message = handleError(error, context);
    return { data: null, error: message };
  }
}
