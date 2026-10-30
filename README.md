<div align="center">

# OBORO

**Publique, leia e compartilhe quadrinhos brasileiros direto do celular.**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-FC9900)
![Plataforma](https://img.shields.io/badge/plataforma-mobile%20web-FC9900)
![Backend](https://img.shields.io/badge/backend-Supabase-3ECF8E)
![Hospedagem](https://img.shields.io/badge/hospedagem-GitHub%20Pages-181717)

[Acessar o app](https://gaku093.github.io/OBORO-APP/)

</div>

---

## Sobre

O **Oboro** é um app mobile de **auto-publicação de quadrinhos brasileiros (QHs BR)**. Qualquer pessoa pode criar uma conta, publicar suas obras, adicionar capítulos e páginas e acompanhar tudo por um painel próprio. Leitores encontram novas histórias, salvam suas favoritas e interagem com os autores.

O Oboro também é uma editora: ele tem obras originais exclusivas, como a HQ **MAGIC**.

## Funcionalidades

- **Criar conta e entrar direto**, sem confirmação de e-mail
- **Início, busca e perfil** na barra de navegação
- **Leitor de HQ** com detalhes da obra e capítulos
- **Dashboard do autor**, em aba própria ao lado dos salvos:
  - gerenciar obras
  - adicionar páginas
  - renomear
  - excluir
- **Perfil limpo**: nome, bio e botão "editar perfil" (visível apenas para o dono da página)
- **Obras salvas** para ler depois
- **OBORO+**: assinatura para ler quadrinhos e interagir mais
- **OboroCoin**: a moeda do Oboro

> Algumas funcionalidades (OBORO+ e OboroCoin) ainda estão em desenvolvimento.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Front-end | HTML, CSS e JavaScript |
| Backend e autenticação | [Supabase](https://supabase.com) |
| Hospedagem | GitHub Pages |

## Estrutura do projeto

```
oboro-app/
├── index.html      # página principal
├── css/            # estilos
├── js/             # scripts do app
├── assets/         # imagens, ícones e logos
└── supabase/       # configuração e SQL do backend
```

## Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/gaku093/oboro-app.git
   cd oboro-app
   ```
2. Configure suas credenciais do Supabase no arquivo de configuração em `js/` (use a URL e a chave **pública/anon** do seu projeto, nunca a chave de serviço).
3. Rode um servidor local:
   ```bash
   python -m http.server 8000
   ```
4. Abra `http://localhost:8000` no navegador.

## Identidade visual

- Cor principal: laranja `#FC9900`
- Design pensado primeiro para celular

## Roadmap

- [x] Cadastro e login
- [x] Perfil e dashboard do autor
- [x] Leitor de HQ com capítulos
- [ ] OBORO+ (assinatura)
- [ ] OboroCoin (moeda)
- [ ] Mais obras exclusivas

## Contribuindo

Sugestões e correções são bem-vindas! Abra uma *issue* descrevendo o problema ou a ideia, ou envie um *pull request*.

## Licença

Todos os direitos reservados. As obras publicadas pertencem aos seus respectivos autores.

---

<div align="center">
Feito com carinho para os quadrinhos brasileiros.
</div>
