# Roadmap para MVP estável

## 1. Base pública e identidade

- Aplicar a marca MAYORDOMO no cabeçalho público, login, sidebar e preview da home.
- Manter paleta verde profundo, dourado e marfim.
- Garantir que o fluxo público tenha CTA de compra quando `HOTMART_CHECKOUT_URL` estiver configurado.
- Validar responsividade em mobile e desktop.

Status: implementado no app.

## 2. Acesso pago via Hotmart

- Criar produto na Hotmart e obter:
  - ID do produto.
  - Link de checkout.
  - Token do webhook.
- Configurar na Vercel:
  - `HOTMART_ENABLED=true`
  - `HOTMART_WEBHOOK_TOKEN`
  - `HOTMART_PRODUCT_IDS`
  - `HOTMART_CHECKOUT_URL`
  - `HOTMART_ACCESS_MODE=FIXED_DAYS`
  - `HOTMART_ACCESS_DAYS`
  - `SUPABASE_SECRET_KEY`
- Cadastrar webhook:

```text
https://mayordomoai.vercel.app/api/webhooks/hotmart
```

- Testar compra aprovada, compra antes do cadastro, cancelamento, reembolso e chargeback.
- Depois dos testes, ativar cobrança obrigatória no Supabase:

```sql
update private.app_configuration set billing_enforced = true where singleton = true;
```

Status: base implementada; depende do cadastro real do produto Hotmart.

## 3. IA na plataforma

- Configurar Gemini na Vercel:
  - `AI_ENABLED=true`
  - `AI_PROVIDER=google`
  - `AI_MODEL`
  - `GOOGLE_GENERATIVE_AI_API_KEY`
  - `AI_DATA_POLICY_APPROVED=true` depois da aprovação interna de uso de dados.
- Testar com dados fictícios:
  - pergunta sobre gastos do mês;
  - pergunta sobre orçamento;
  - pergunta sobre metas;
  - resposta quando não há dados suficientes.
- Revisar tom: espanhol LATAM, claro, prudente, sem promessas financeiras.

Status: base implementada; depende da chave e teste com modelo real.

## 4. Supabase e segurança

- Confirmar SMTP real.
- Verificar URL de autenticação:
  - Site URL: `https://mayordomoai.vercel.app`
  - Redirect URL: `https://mayordomoai.vercel.app/auth/confirm`
- Testar dois usuários para confirmar isolamento por RLS.
- Ativar backups e monitoramento no Supabase.

Status: schema instalado e login validado; faltam testes finais operacionais.

## 5. Pronto para piloto

- Rodar checklist:
  - cadastro;
  - confirmação de e-mail;
  - liberação Hotmart;
  - onboarding;
  - criar movimento;
  - editar movimento;
  - criar orçamento/meta/dívida;
  - importar CSV/XLSX;
  - conversa com IA;
  - suporte;
  - cancelamento/reembolso Hotmart.
- Publicar para grupo pequeno de usuários.
- Coletar erros e dúvidas antes de venda ampla.

Status: próximo marco depois das configurações externas.
