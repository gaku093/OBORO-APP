# OBORO — guia de configuração e publicação

## Arquivos
- `index.html`, `style.css`, `app.js`, `config.js`, `avatar.jpg` → vão para a raiz do repositório do GitHub Pages.
- `supabase/migrations/20261026120000_oboro_hardening.sql` → roda **uma vez** no Supabase (SQL Editor). Não precisa subir para o GitHub.

## Ordem correta
1. **Rode a migração SQL** (Supabase → SQL Editor → colar → Run). É aditiva: não apaga obras, contas nem arquivos. Se der erro, nada é aplicado (ela roda em uma transação).
2. **Suba os arquivos** para o GitHub Pages.
3. No Supabase → Authentication → URL Configuration:
   - *Site URL*: `https://gaku093.github.io/OBORO-APP/`
   - *Redirect URLs*: adicione a mesma URL (necessário para confirmação de e-mail e recuperação de senha).
4. Authentication → Providers → Email: senha mínima 8 e **ative "Leaked password protection"** (o verificador de segurança do Supabase já apontou isso).
5. Authentication → Rate Limits: mantenha os limites padrão (ou mais baixos).

> Importante: se você publicar o front-end novo **antes** da migração, a publicação falha (as funções `publish_work`/`publish_chapter` ainda não existem). Obras antigas continuam abertas normalmente.

## Sobre a chave do Supabase
`config.js` é público (GitHub Pages serve tudo ao navegador). Lá só está a chave **publishable**, que foi feita para ser pública. Quem protege os dados é o RLS e as políticas de Storage da migração. Nunca coloque `service_role` ou `sb_secret_...` em nenhum arquivo do site. Se um dia precisar de operação administrativa, use uma Edge Function com o segredo nos *Secrets* dela. Não há build: se quiser trocar de projeto Supabase, edite `config.js` (e o domínio na tag CSP do `index.html`).

## O que mudou na segurança
- **Banco**: privilégios mínimos (anon só lê; ninguém tem TRUNCATE; `reads` sem update/delete); gatilhos que impedem trocar `author_id`, capa ou páginas depois de publicado; capítulos só em obra própria, com caminhos de imagem obrigatoriamente dentro de `<seu-id>/<obra>/<capítulo>/`; `reads` com data do servidor e sem contar o autor; limites de 100 obras por autor e 300 capítulos por obra; gênero e classificação validados.
- **Publicação**: `publish_work` e `publish_chapter` gravam obra + capítulo em uma única transação.
- **Storage**: leitura pública; envio só na pasta do próprio usuário com formato de caminho exato; sem UPDATE (ninguém sobrescreve arquivo); DELETE só na própria pasta; limite de 2 MB por imagem e só JPG/PNG/WebP.
- **Front-end**: confere os bytes reais do arquivo (não a extensão), reencoda tudo para JPEG (remove metadados e conteúdo estranho), limita tamanho/dimensões, e cria a imagem em 480×720 (capa) e até 1080 px de largura (páginas).

## Limites que vale conhecer
- **Banco e Storage não têm atomicidade conjunta.** O app envia as imagens, depois grava no banco em uma transação; se falhar, apaga as imagens enviadas. Se nem a limpeza for possível (sem internet), ela fica registrada no navegador e é refeita no próximo acesso. Se o aparelho for limpo antes disso, podem sobrar arquivos órfãos; dá para varrer depois com um script administrativo.
- Páginas muito altas (tira de webtoon inteira) devem ser fatiadas antes do envio; a largura máxima é 1080 px.
- A validação do front-end melhora a experiência, mas a proteção real é a do banco/Storage: mesmo quem ignorar o site e chamar a API direto é barrado.
- Os dados de leitores (`reads`) continuam visíveis só para o próprio leitor e para o autor da obra.

## Testes sugeridos depois de publicar
1. Criar conta (com confirmação de e-mail) → entrar → sair → recuperar senha.
2. Publicar uma obra com 2–3 páginas; conferir que aparece na home.
3. Com uma segunda conta: tentar abrir a obra, salvar, ler. Ela não deve ver "Novo capítulo" nem "Excluir".
4. Excluir a obra de teste e conferir no Storage que a pasta sumiu.
