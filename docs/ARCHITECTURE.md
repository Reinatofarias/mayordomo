# Arquitetura

O navegador renderiza componentes React; leituras autenticadas e mutações passam por Server Components/Actions ou Route Handlers. Cada operação obtém o usuário no servidor. Supabase Auth mantém a sessão por cookies; RLS no PostgreSQL aplica a mesma fronteira por usuário inclusive quando a API é chamada diretamente.

| Camada | Responsabilidade |
| --- | --- |
| src/app | Rotas, ações, validação de entrada e apresentação |
| src/components | Formulários, navegação e componentes reutilizáveis |
| src/data | Sessão, consultas por usuário e acesso administrativo somente no servidor |
| src/domain | Dinheiro exato, cálculos, CSV e contratos independentes de UI |
| src/ai | Agente, ferramentas de leitura e propostas |
| src/integrations | Adaptadores bancários e de mensagens |
| supabase/migrations | Schema, grants, RLS, RPCs, auditoria e rate limits |

Valores monetários são bigint em unidades mínimas com código de moeda obrigatório. PostgREST lê bigint convertido em texto; JSON não transporta dinheiro como ponto flutuante. Somatórios não misturam moedas. Estimativas iniciais são identificadas separadamente dos movimentos registrados; saldo mensal não representa saldo bancário.

Onboarding calcula o snapshot dentro da transação SQL. Importação exige prévia e confirmação, usa trava por job e grava todos os movimentos ou nenhum. Eventos Hotmart têm chave idempotente, associação por e-mail confirmado, serialização por usuário e regras contra eventos atrasados; RLS consulta o direito de acesso quando cobrança é obrigatória.

IA recebe contexto do usuário autenticado, calcula por ferramentas e não tem ferramentas que efetivem mudanças financeiras. O usuário executa propostas nos formulários. Isso limita ações indevidas, mas ainda exige avaliações de qualidade das respostas e políticas de tratamento de dados antes do uso comercial.

Chaves públicas identificam o projeto e passam por RLS. Chave administrativa e tokens dos provedores ficam somente no servidor. Webhooks validam a origem antes de chamar RPCs administrativas; logs evitam conteúdo financeiro e segredos. Integrações incompletas ficam desativadas.
