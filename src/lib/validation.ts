/**
 * VALIDATION & SANITIZATION LIBRARY
 * Protection contre XSS, injection, et données malveillantes
 * 
 * PRINCIPE: Ne jamais faire confiance aux données utilisateur
 */

import { z } from 'zod';

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Nettoie une chaîne pour prévenir les attaques XSS
 * Échappe les caractères HTML dangereux
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Nettoie une chaîne pour utilisation dans une URL
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Supprime les protocoles dangereux
  const dangerous = /^(javascript|data|vbscript|file):/i;
  if (dangerous.test(input.trim())) {
    return '';
  }
  
  return encodeURIComponent(input);
}

/**
 * Nettoie une chaîne de texte simple (pas de HTML)
 * Supprime les caractères de contrôle et trim
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Supprime les caractères de contrôle (sauf newline, tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalise les espaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Nettoie un nom (prénom, nom de famille, etc.)
 */
export function sanitizeName(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Garde uniquement les lettres, espaces, tirets, apostrophes
    .replace(/[^a-zA-Z\u0590-\u05FF\u0600-\u06FF\s\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100); // Limite à 100 caractères
}

// ============================================
// ZOD SCHEMAS - VALIDATION STRICTE
// ============================================

// Schéma de base pour email avec validation stricte
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Email trop court')
  .max(255, 'Email trop long')
  .email('Format email invalide')
  .refine(
    (email) => !email.includes('..') && !email.startsWith('.') && !email.endsWith('.'),
    'Format email invalide'
  );

// Schéma pour mot de passe fort (12 caractères minimum)
export const passwordSchema = z
  .string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    'Le mot de passe doit contenir au moins une lettre minuscule'
  )
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    'Le mot de passe doit contenir au moins une lettre majuscule'
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    'Le mot de passe doit contenir au moins un chiffre'
  )
  .refine(
    (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    'Le mot de passe doit contenir au moins un caractère spécial'
  );

// Schéma pour nom complet
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')
  .transform(sanitizeName);

// Schéma pour texte général (descriptions, notes, etc.)
export const textSchema = z
  .string()
  .trim()
  .max(5000, 'Le texte ne peut pas dépasser 5000 caractères')
  .transform(sanitizeText);

// Schéma pour texte court (titres, noms de produits, etc.)
export const shortTextSchema = z
  .string()
  .trim()
  .min(1, 'Ce champ est requis')
  .max(200, 'Le texte ne peut pas dépasser 200 caractères')
  .transform(sanitizeText);

// Schéma pour code produit
export const productCodeSchema = z
  .string()
  .trim()
  .max(50, 'Le code ne peut pas dépasser 50 caractères')
  .regex(/^[a-zA-Z0-9\-_]*$/, 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores')
  .optional();

// Schéma pour nombre positif
export const positiveNumberSchema = z
  .number()
  .min(0, 'La valeur doit être positive')
  .max(999999999, 'Valeur trop grande');

// Schéma pour pourcentage
export const percentageSchema = z
  .number()
  .min(0, 'Le pourcentage doit être entre 0 et 100')
  .max(100, 'Le pourcentage doit être entre 0 et 100');

// Schéma pour UUID
export const uuidSchema = z
  .string()
  .uuid('Format UUID invalide');

// ============================================
// SCHEMAS MÉTIER - FORMULAIRES COMPLETS
// ============================================

// Schéma pour la connexion
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
});

// Schéma pour l'inscription
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: fullNameSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Schéma pour réinitialisation de mot de passe
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Schéma pour invitation utilisateur
export const inviteUserSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  password: passwordSchema,
  role: z.enum(['admin', 'employee'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }),
});

// Schéma pour item warehouse
export const warehouseItemSchema = z.object({
  name: shortTextSchema,
  code: productCodeSchema,
  category_id: uuidSchema.nullable().optional(),
  supplier_id: uuidSchema.nullable().optional(),
  unit: z.string().min(1).max(20),
  price: positiveNumberSchema,
  quantity: positiveNumberSchema,
  min_stock: positiveNumberSchema,
  waste_percent: percentageSchema,
});

// Schéma pour catégorie
export const categorySchema = z.object({
  name: shortTextSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide'),
  icon: z.string().max(50).optional(),
});

// Schéma pour fournisseur
export const supplierSchema = z.object({
  name: shortTextSchema,
  contact_info: textSchema.optional(),
});

// Schéma pour client (Hebrew)
export const clientSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().optional(),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Schéma pour événement (Hebrew)
export const eventSchema = z.object({
  name: z.string().min(2, 'שם האירוע חייב להכיל לפחות 2 תווים'),
  date: z.date({ required_error: 'יש לבחור תאריך' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'פורמט שעה לא תקין'),
  client_id: z.string().uuid().optional(),
  guests: z.number().min(0, 'מספר האורחים חייב להיות חיובי'),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

// ============================================
// HELPERS
// ============================================

/**
 * Valide les données et retourne un résultat typé
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors };
}

/**
 * Vérifie si une chaîne contient des patterns d'injection SQL
 * Note: Ceci est une protection supplémentaire, RLS est la vraie protection
 */
export function containsSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|JOIN|WHERE|OR|AND)\b.*=)/i,
    /(--|\#|\/\*)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /('\s*(OR|AND)\s*'?\d)/i,
  ];
  
  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Type pour les résultats de validation
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: string[] };
