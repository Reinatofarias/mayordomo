# Estado do projeto — 11/09/2026

Projeto: `D:\Mayodormo\app`. Node portátil: `D:\Mayodormo\.tools`. Configuração pública do Supabase já gravada em `.env.local`. O schema remoto ainda precisa ser instalado: último acesso REST a categories retornou PGRST205. As migrations são a fonte de verdade; SETUP.sql é um pacote derivado para instalação inicial.

## Implementado localmente

Auth, onboarding atômico, dinheiro bigint por moeda, movimentos manuais editáveis, orçamento mensal/por categoria, metas e dívidas editáveis, relatório mensal, CSV/XLSX com prévia e confirmação atômica, ferramentas de IA sem escrita financeira automática, processamento Hotmart idempotente, suporte, RLS e manifesto PWA. O mock bancário é exclusivamente de desenvolvimento. WhatsApp tem apenas recepção assinada e inbox idempotente.

## Pendências externas

1. Instalar SETUP.sql no Supabase e validar cadastro, confirmação/recuperação por e-mail e persistência com dois usuários.
2. Configurar Gemini e validar com dados fictícios; aprovar tratamento de dados antes de dados reais.
3. Configurar produto Hotmart e testar webhooks reais antes de cobrar.
4. Configurar domínio, SMTP, backups, monitoramento, atendimento e revisar textos legais.

## Desenvolvimento restante

- WhatsApp: vinculação segura, worker, mídia, confirmação e envio; atualmente só recebe eventos.
- Banco real, OCR/PDF e retenção de mídia.
- Navegação por histórico de conversas, avaliações adversariais de IA e validação automática de afirmações numéricas.
- Administração de suporte/pagamentos, retenção/exportação/exclusão de conta.
- Paginação de planos acima do limite REST, gerenciamento de contas financeiras e notificações.
- E2E autenticado no Supabase e acessibilidade nas telas privadas. Não há finanças offline.

Nenhuma publicação, mensagem externa ou cobrança foi realizada. Os textos legais são rascunhos. Não apresentar a versão como liberada para comercialização com essas pendências abertas.
