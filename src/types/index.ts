// Types centralisés pour l'application Casserole

// Client Info - Configuration statique
export interface ClientInfo {
  name: string;
  tagline: string;
  logo: string;
  primaryColor: string;
}

export const clientInfo: ClientInfo = {
  name: 'קסרולה',
  tagline: 'ניהול קייטרינג חכם',
  logo: '🍳',
  primaryColor: '#10B981',
};

// Types utilitaires
export type Department = 'bakery' | 'kitchen';
export type StorageType = 'frozen' | 'refrigerated' | 'ambient';
export type ProductionStatus = 'pending' | 'in-progress' | 'completed';
