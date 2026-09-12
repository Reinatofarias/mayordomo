# Integrações

## Gemini

Configure no servidor `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_MODEL`, `AI_PROVIDER=google` e `AI_ENABLED=true`. `AI_DATA_POLICY_APPROVED=true` somente após aprovar as condições de tratamento de dados do plano. A conta ChatGPT não configura esta API. Avalie o modo gratuito com dados fictícios até aprovar a política.

O chat exige consentimento e usa ferramentas que consultam somente o usuário autenticado. Cálculos vêm do domínio; propostas exigem execução/confirmacão nos formulários. Ainda faltam avaliações com modelo real e verificação automática de afirmações numéricas do texto gerado.

## Hotmart

Configure `SUPABASE_SECRET_KEY` somente no servidor, `HOTMART_WEBHOOK_TOKEN`, `HOTMART_PRODUCT_IDS` separados por vírgula e `HOTMART_ACCESS_MODE`. Use FIXED_DAYS com `HOTMART_ACCESS_DAYS` explícito, ou PROVIDER_PERIOD quando o payload fornece o fim do período. Ative `HOTMART_ENABLED=true` e registre `/api/webhooks/hotmart` no provedor.

O banco inicia sem cobrança obrigatória para permitir configuração. Depois de validar compra, cancelamento, reembolso, chargeback e compra anterior ao cadastro, habilite no SQL Editor:

```sql
update private.app_configuration set billing_enforced = true where singleton = true;
```

Mantenha HOTMART_ENABLED ativo para reclamar pagamentos anteriores ao cadastro. A associação exige e-mail confirmado. Cancelamento preserva período pago; reembolso/chargeback revogam a compra e eventos atrasados não a restauram. Reativação exige nova compra válida. Eventos em revisão precisam de operação administrativa ainda não implementada.

Contratos: [compra Hotmart 2.0](https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/) e [cancelamento](https://developers.hotmart.com/docs/en/2.0.0/webhook/cancel-subscription-webhook/).

## WhatsApp e bancos

WHATSAPP_ENABLED, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN e SUPABASE_SECRET_KEY habilitam somente recepção: GET de verificação, POST com HMAC do corpo original e inbox idempotente. Faltam vinculação do telefone, processamento e envio com confirmação. Não habilite publicamente ainda. Token de acesso e phone ID estão reservados para essa etapa.

Nenhum banco está conectado. CSV/XLSX funcionam sem IA; PDF, OCR e recibos estão desativados. Não há conexão bancária simulada apresentada como real.
