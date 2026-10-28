/*
 * Configuração PÚBLICA do cliente OBORO.
 *
 * Este arquivo é enviado ao navegador (GitHub Pages serve tudo como público).
 * Por isso aqui só pode ficar o que foi feito para ser público:
 *   - SUPABASE_URL: endereço do projeto;
 *   - SUPABASE_KEY: chave "publishable" (sb_publishable_...) ou a legada "anon".
 * A segurança vem do RLS e das políticas de Storage (ver supabase/migrations),
 * NÃO de esconder esta chave.
 *
 * NUNCA coloque aqui: service_role, sb_secret_..., senhas ou tokens de admin.
 * Operações administrativas devem ir para uma Supabase Edge Function, com o
 * segredo guardado nos "Secrets" da função (não no repositório).
 */
window.OBORO_CONFIG = {
  SUPABASE_URL: "https://dvreimjduimzwouxkrdl.supabase.co",
  SUPABASE_KEY: "sb_publishable_OyUFfiDZcDaPfS0F8Uy-2w_3QGafWDr",
  // Endereço do site publicado: usado nos links de confirmação e de recuperação
  // de senha. Precisa estar na lista "Redirect URLs" do Supabase Auth.
  // Deixe vazio para usar o endereço atual da página.
  SITE_URL: "https://gaku093.github.io/OBORO-APP/"
};
