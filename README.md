# MAYORDOMO

Aplicação financeira em espanhol LATAM com Next.js, React, TypeScript, Supabase Auth/PostgreSQL, Tailwind/shadcn e AI SDK/Gemini. Dinheiro usa bigint no domínio e no banco, strings em JSON e formatação por moeda.

## Executar no Windows

```powershell
Set-Location D:\Mayodormo\app
$env:Path='D:\Mayodormo\.tools\node-v24.21.0-win-x64;'+$env:Path
npm.cmd ci
npm.cmd run dev
```

Abra http://localhost:3000. Node 24+. A URL e a chave pública do Supabase informado estão em `.env.local`; não publique esse arquivo. Para outra instalação, copie `.env.example`.

## Instalar o banco

1. No projeto Supabase desejado, abra **SQL Editor → New query**.
2. Cole e execute `supabase/SETUP.sql` uma vez. Aplica sete migrations em uma transação, sem apagar dados, e recusa um schema já existente.
3. Em Authentication → URL Configuration, configure Site URL `http://localhost:3000` e permita `http://localhost:3000/auth/confirm`. Na publicação use o domínio HTTPS, por exemplo `https://mayordomoai.vercel.app`, e ajuste `APP_URL` quando a Vercel permitir.
4. Ative confirmação de e-mail e configure SMTP. Crie uma conta pelo aplicativo, confirme o e-mail e conclua o onboarding.

A chave pública não permite instalar tabelas/políticas. Execute o SQL pelo painel autenticado. Não envie senhas nem chaves secretas na conversa. Em futuras atualizações, aplique apenas migrations pendentes em ordem, não repita SETUP.sql.

Regenerar o pacote: `node scripts/bundle-database.mjs`.

## Verificar

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Os testes de PostgreSQL usam PGlite e RLS, com uma simulação mínima do schema Auth. Não substituem Supabase Auth, e-mails ou integrações reais. Consulte [validação](docs/VALIDATION.md).

## Funcionalidades e continuidade

Auth, onboarding atômico, movimentos editáveis, orçamento mensal/por categoria, metas/dívidas editáveis, relatório mensal, importação CSV/XLSX confirmada, assistente com ferramentas sem escrita automática, processamento idempotente de pagamentos e suporte.

Gemini, Hotmart e WhatsApp estão desativados até configuração e teste. Hotmart já tem webhook, tela de acesso pendente e vínculo automático por e-mail confirmado; configure `HOTMART_CHECKOUT_URL` para exibir o botão de compra público. WhatsApp só tem recepção de eventos; banco real e OCR/PDF não estão implementados. O manifesto permite instalação, sem operação financeira offline. Os textos legais públicos estão em versão inicial de MVP e ainda precisam de revisão jurídica antes de venda ampla.

Leia [integrações](docs/INTEGRATIONS.md), [roadmap do MVP](docs/ROADMAP_MVP.md) e [pendências para continuidade](docs/PROJECT_STATE.md). A versão ainda não está liberada para comercialização ampla.
