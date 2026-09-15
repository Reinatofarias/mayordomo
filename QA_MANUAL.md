# MAYORDOMO QA manual antes do lançamento controlado

Use este roteiro depois do deploy para validar o MVP com uma conta nova e, quando possível, com uma conta que já tenha dados.

## 1. Instalação do banco

- Em projeto Supabase novo, execute `supabase/SETUP.sql` uma única vez.
- Confirme que a execução termina com `commit` e sem erros.
- Tente executar novamente e confirme que o script recusa schema existente sem apagar dados.

## 2. Cadastro, acesso e onboarding

- Criar uma conta nova.
- Confirmar e-mail.
- Entrar no app.
- Completar onboarding estilo jornada.
- Validar que o mapa final mostra:
  - resumo financeiro estimado
  - princípio bíblico contextual
  - chamada para começar a usar
- Sair e entrar novamente; o app deve ir para `/hoy`, não repetir onboarding.

## 3. Hoy

- Abrir `/hoy` com poucos dados e verificar empty states.
- Registrar movimentos e voltar para `/hoy`.
- Conferir se totais, status e ação diária fazem sentido.
- Validar que o princípio bíblico aparece sem promessa financeira ou culpa.

## 4. Movimientos

- Criar gasto manual usando atalho rápido.
- Criar ingresso manual.
- Editar descrição, data, categoria e valor.
- Excluir um movimento.
- Testar filtros por mês, busca, categoria e tipo.
- Confirmar que mensagens de sucesso aparecem após criar, editar e excluir.

## 5. Importar

- Subir CSV válido com 3 a 5 linhas.
- Mapear colunas e revisar preview.
- Confirmar importação.
- Repetir o mesmo arquivo e confirmar comportamento idempotente.
- Subir CSV inválido e confirmar que nenhum movimento parcial é importado.

## 6. Plan

- Criar orçamento mensal.
- Criar meta.
- Criar dívida.
- Criar limite por categoria.
- Alternar abas e confirmar que cada uma mostra o princípio bíblico correto.
- Conferir que valores aparecem na moeda/localidade do perfil.

## 7. Informe

- Abrir `/informe` com e sem movimentos.
- Conferir categorias principais, comparação e princípio de mayordomía.
- Validar que o texto deixa claro que é educação/organização, não aconselhamento financeiro.

## 8. MAYORDOMO IA

Com IA habilitada:

- Aceitar consentimento e perguntar: "Como vão meus gastos este mês?"
- Perguntar sobre categoria mais pesada.
- Pedir três ações prudentes.
- Verificar que respostas usam dados registrados e não inventam números.

Com IA desabilitada ou falhando:

- Confirmar que a resposta fallback orienta com dados determinísticos.
- Confirmar que inclui princípio bíblico contextual quando possível.

## 9. Perfil / Centro de Mayordomía

- Atualizar nome, telefone, idioma/formato e fuso horário.
- Confirmar mensagem de sucesso.
- Validar resumo de renda, gastos, reserva e acesso.
- Abrir suporte, enviar solicitação e confirmar histórico.
- Revisar acesso Hotmart.

## 10. Hotmart

- Enviar postback sandbox aprovado.
- Confirmar entitlement ativo.
- Testar e-mail de compra diferente e `claim_pending_payments` no login.
- Testar cancelamento/refund/chargeback em sandbox.
- Confirmar que evento antigo não reativa acesso revogado.

## 11. Suporte humano e operacao

- Abrir `/ayuda` com uma conta comum.
- Enviar uma pergunta simples e confirmar resposta inicial do MAYORDOMO.
- Enviar uma mensagem com tema de pagamento, erro ou pedido de humano e confirmar notificacao interna de revisao humana.
- Entrar com o admin configurado em `SUPPORT_ADMIN_EMAILS`.
- Abrir `/admin/soporte`.
- Responder a conversa e confirmar que o usuario ve a mensagem em `/ayuda`.
- Marcar o caso como resolvido e confirmar notificacao interna.
- Se `SUPPORT_EMAIL_WEBHOOK_URL` estiver configurado, confirmar que o webhook/e-mail chegou quando houve escalonamento humano.

## 12. Mobile e acessibilidade

- Testar no celular real ou viewport mobile.
- Validar navegação inferior.
- Validar foco em campos e botões.
- Conferir contraste dos cards, mensagens de erro e botões.
- Testar sem mouse.

## 13. Critérios para considerar pronto para beta

- Onboarding completo sem erro em conta nova.
- Movimentos criam, editam, filtram e excluem.
- Importação não cria duplicidade no mesmo arquivo.
- Plan salva orçamento, meta e dívida.
- Perfil atualiza dados permitidos.
- IA responde ou cai em fallback útil.
- Hotmart ativa e revoga acesso corretamente em sandbox.
- Build de produção passa.
- Nenhuma tela privada expõe dados de outro usuário.
