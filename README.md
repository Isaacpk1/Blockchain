# HealthChain — Protótipo de Gestão de Dados Clínicos com Blockchain

Plataforma de gestão de dados clínicos que separa **dados sensíveis** (Data Vault, off-chain) de **metadados e consentimentos** (blockchain, on-chain), com controle de acesso baseado em consentimento do paciente.

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie o código (ou use um existente).

2. Se o nome do repositório **não** for `blockchain`, edite `vite.config.js` e troque `'blockchain'` pela string após o `||` na linha do `repoName`:
   ```js
   const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'seu-repo-name'
   ```

3. Instale as dependências e faça o deploy:
   ```bash
   npm install
   npm run deploy
   ```

4. No GitHub: **Settings → Pages** → em "Source" escolha o branch **gh-pages** e a pasta **/ (root)**. Salve.

5. O site ficará em `https://<seu-usuario>.github.io/<nome-do-repo>/`.

O script `deploy` gera o build, copia `index.html` para `404.html` (para as rotas do SPA funcionarem ao abrir links diretos) e publica a pasta `dist` no branch `gh-pages`.

## Fluxo do protótipo

1. **Login**: use qualquer e-mail e escolha "Profissional de saúde" ou "Paciente".
2. **Profissional**: registre um dado clínico informando o ID do paciente (ex.: e-mail do paciente). O dado é criptografado e salvo no Data Vault; hash e metadados vão para a blockchain; uma solicitação de consentimento é criada para o paciente.
3. **Paciente**: entre com o mesmo e-mail usado como "ID do paciente". Veja as solicitações pendentes e **autorize** ou **negue**. A decisão é registrada on-chain.
4. **Auditoria**: visualize a trilha de eventos na blockchain (quem acessou/alterou e quando). A separação visual entre Data Vault (off-chain) e Blockchain (on-chain) está destacada na interface.

## Tecnologias

- React 18 + Vite
- React Router 6
- LocalStorage para simular Data Vault e blockchain (protótipo)

## Estrutura

- **Data Vault (off-chain)**: dados clínicos criptografados; acesso apenas com consentimento.
- **Blockchain (on-chain)**: hashes, metadados, eventos de consentimento e auditoria, imutáveis.

Design focado em segurança, transparência e controle pelo paciente.
