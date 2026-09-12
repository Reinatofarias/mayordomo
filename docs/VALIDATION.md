# Validação

Em 11/09/2026, 24 testes passaram, incluindo instalação pelo SETUP.sql, recusa de reinstalação sem perda de dados e edição isolada de metas. TypeScript, ESLint e build de produção passaram após a edição do plano (25 páginas geradas).

Testes de banco usam PGlite/PostgreSQL, roles e RLS, com simulação mínima de auth.users/auth.uid. Não substituem Supabase Auth nem serviços externos.

Cobertura: dinheiro exato, cálculos, CSV, isolamento entre usuários, onboarding atômico sem confiar no snapshot enviado, importação idempotente e rollback, pagamentos repetidos/atrasados/reembolsados, e-mail confirmado, assinatura de mensagens, rate limit e deduplicação de inbox.

Navegador: página inicial desktop e acesso em 375×812 abriram com conteúdo, sem erros JavaScript registrados. Contraste do link principal corrigido e conferido em homepage-mobile.png. Acesso anônimo a /hoy redirecionou para /acceso.

## Roteiro depois de instalar o banco

1. Criar/confirmar dois usuários fictícios e concluir onboarding.
2. Registrar entrada/saída no A, recarregar e conferir cálculos. B não pode consultar/editar IDs do A.
3. Editar/excluir movimento, definir orçamento/categoria, atualizar meta e zerar dívida quitada.
4. Importar CSV/XLSX e confirmar duas vezes: somente uma importação.
5. Sair e verificar redirecionamento de rota privada; testar recuperação por e-mail.
6. Testar Gemini com dados fictícios, conferindo fontes/cálculos e isolamento.
7. Testar webhooks reais Hotmart antes de habilitar cobrança obrigatória.

Ainda não executados: e-mails reais, fluxo financeiro autenticado remoto, Gemini real, Hotmart real, WhatsApp outbound e banco real.
