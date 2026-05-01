import { Brand } from "@/lib/constants";

export type ReceiptNote = {
  id: string;
  codigo: string;
  marca: Brand;
  total: number;
  atual: number;
  createdAt: number;
  updatedAt: number;
};

export type PullRecord = {
  id: string;
  funcionario: string;
  marca: Brand;
  quantidade: number;
  createdAt: number;
};

export type StoredAuth = {
  user: string;
  expiresAt: number;
};
