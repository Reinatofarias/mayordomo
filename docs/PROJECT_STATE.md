# Estado do projeto — 12/09/2026

Projeto: `D:\Mayodormo\app`. Node portátil: `D:\Mayodormo\.tools`. Configuração pública do Supabase gravada em `.env.local` e com fallback público no código para destravar deploy. O schema remoto foi instalado pelo usuário, e cadastro/confirmação/login já funcionaram na Vercel. As migrations são a fonte de verdade; SETUP.sql é um pacote derivado para instalação inicial.

## Implementado localmente

Auth, onboarding atômico, dinheiro bigint por moeda, movimentos manuais editáveis, orçamento mensal/por categoria, metas e dívidas editáveis, relatório mensal, CSV/XLSX com prévia e confirmação atômica, ferramentas de IA sem escrita financeira automática, processamento Hotmart idempotente, suporte, RLS e manifesto PWA. O mock bancário é exclusivamente de desenvolvimento. WhatsApp tem apenas recepção assinada e inbox idempotente.

## Pendências externas

1. Validar onboarding, movimentos, plano, relatório e importação no Supabase remoto com dois usuários.
2. Configurar SMTP real, domínio, backups, monitoramento e atendimento.
3. Configurar Gemini e validar com dados fictícios; aprovar tratamento de dados antes de dados reais.
4. Configurar produto Hotmart e testar webhooks reais antes de cobrar.
5. Revisar textos legais com apoio jurídico antes de venda ampla.

## Desenvolvimento restante

- WhatsApp: vinculação segura, worker, mídia, confirmação e envio; atualmente só recebe eventos.
- Banco real, OCR/PDF e retenção de mídia.
- Navegação por histórico de conversas, avaliações adversariais de IA e validação automática de afirmações numéricas.
- Administração de suporte/pagamentos, retenção/exportação/exclusão de conta.
- Paginação de planos acima do limite REST, gerenciamento de contas financeiras e notificações.
- E2E autenticado no Supabase e acessibilidade nas telas privadas. Não há finanças offline.

Nenhuma mensagem externa ou cobrança foi realizada. Os textos legais públicos foram ajustados para MVP, mas ainda requerem revisão jurídica. Não apresentar a versão como liberada para comercialização ampla com essas pendências abertas.
