export type ReceiptNote = {
  id: string;
  codigo: string;
  marca: string;
  total: number;
  atual: number;
  createdAt: number;
  updatedAt: number;
  confirmedAt: number | null;
};

export type PullRecord = {
  id: string;
  funcionario: string;
  marca: string;
  createdAt: number;
};

export type StoredAuth = {
  user: string;
  expiresAt: number;
};
