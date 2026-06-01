# Di Gaspi Estoque

Sistema mobile-first para rotinas de estoque da loja.

## Funcionalidades

- Login local: `estoque.l41` / `lojadigaspi`
- Recebimento de notas por checklist de quantidade
- Scanner de codigo de barras da nota quando o navegador suporta `BarcodeDetector`
- Entrada manual rapida como fallback do scanner
- Multiplas notas abertas, filtros e limpeza de concluidas
- Puxada com funcionario, marca digitada e resumo por marca
- Copia de relatorio do dia
- Recebimento salvo por 14 dias no `localStorage`
- Puxada salva por 72 horas no `localStorage`

## Rodar local

```bash
npm install
npm run dev
```

## Validar producao

```bash
npm run now
```

## Vercel

Nao precisa cadastrar variaveis de ambiente. O sistema nao usa backend, banco de dados, OpenAI ou API externa.


## OIOIOIO TESTESTESTES