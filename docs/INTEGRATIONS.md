# Integrações

## Gemini

Configure no servidor `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_MODEL`, `AI_PROVIDER=google` e `AI_ENABLED=true`. Defina `AI_DATA_POLICY_APPROVED=true` somente depois de aprovar as condições de tratamento de dados do plano. A conta ChatGPT não configura esta API.

O chat exige consentimento e usa ferramentas que consultam somente o usuário autenticado. Cálculos vêm do domínio; propostas exigem execução ou confirmação nos formulários. Ainda faltam avaliações com modelo real e verificação automática de afirmações numéricas do texto gerado.

## Hotmart

Variáveis necessárias na Vercel:

- `SUPABASE_SECRET_KEY`: service role key do Supabase, somente servidor.
- `HOTMART_ENABLED=true`: ativa o webhook e a busca de compras pendentes.
- `HOTMART_WEBHOOK_TOKEN`: token configurado no webhook da Hotmart.
- `HOTMART_PRODUCT_IDS`: IDs dos produtos liberados, separados por vírgula.
- `HOTMART_CHECKOUT_URL`: link público do checkout do produto.
- `HOTMART_ACCESS_MODE`: use `FIXED_DAYS` ou `PROVIDER_PERIOD`.
- `HOTMART_ACCESS_DAYS`: obrigatório quando `HOTMART_ACCESS_MODE=FIXED_DAYS`.

Webhook na Hotmart:

```text
https://mayordomoai.vercel.app/api/webhooks/hotmart
```

Fluxo esperado:

1. O cliente compra na Hotmart usando o mesmo e-mail que usará no MAYORDOMO.
2. A Hotmart envia o evento para `/api/webhooks/hotmart`.
3. O app normaliza o evento, grava `payment_events`, `subscriptions` e `entitlements`.
4. Se o evento chegou antes do cadastro, o usuário clica em **Revisar meu acesso** e `claim_pending_payments()` vincula a compra ao e-mail confirmado.
5. Quando o acesso está ativo, o usuário entra no onboarding e nas telas privadas.

O banco inicia sem cobrança obrigatória para permitir teste. Depois de validar compra, cancelamento, reembolso, chargeback e compra anterior ao cadastro, habilite no SQL Editor:

```sql
update private.app_configuration set billing_enforced = true where singleton = true;
```

Mantenha `HOTMART_ENABLED=true` depois disso. A associação exige e-mail confirmado. Cancelamento preserva o período pago; reembolso e chargeback revogam a compra; eventos atrasados não restauram acesso revogado. Eventos em revisão precisam de operação administrativa.

Contratos: [compra Hotmart 2.0](https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/) e [cancelamento](https://developers.hotmart.com/docs/en/2.0.0/webhook/cancel-subscription-webhook/).

## WhatsApp e bancos

`WHATSAPP_ENABLED`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` e `SUPABASE_SECRET_KEY` habilitam somente recepção: GET de verificação, POST com HMAC do corpo original e inbox idempotente. Faltam vinculação do telefone, processamento e envio com confirmação. Não habilite publicamente ainda.

Nenhum banco está conectado. CSV/XLSX funcionam sem IA; PDF, OCR e recibos estão desativados. Não há conexão bancária simulada apresentada como real.
