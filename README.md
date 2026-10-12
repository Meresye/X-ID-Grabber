# X ID Grabber

Extensão para Chrome que mostra o **ID permanente** de qualquer conta do X (Twitter) e copia o **link direto do perfil com ID** — tudo com dois botõezinhos que aparecem dentro do próprio X.

Criado por **[Meresye](https://x.com/Meresye)**.

## O que ela faz

- **Botões nos posts:** ao lado do nome do autor de cada post aparecem dois botões:
  - **ID** — copia o ID numérico permanente da conta (ex.: `1234567890`). O `@` pode mudar; o ID nunca muda.
  - **Link** — copia o link com ID: `https://x.com/intent/user?user_id=ID`.
- **Botões nos perfis:** os mesmos botões aparecem no cabeçalho do perfil que você abrir.
- **Lista de seguidores e afins:** detecta as contas nas células de usuário (quem seguir/quem deixar de seguir) e memoriza o ID de cada uma.
- **Botão certo, conta certa:** verifica pela `@` na tela antes de copiar, para não pegar o ID de outra pessoa (como quem foi citado ou repostado).
- **Memória local:** guarda os IDs já vistos no seu navegador. Se um botão não achar o ID na hora, ele usa o que já sabe daquela conta.
- **Aviso de cópia:** um aviso rápido aparece na tela confirmando o que foi copiado.

A janela da extensão só informa que já está funcionando — não é preciso configurar nada.

## Instalação (modo desenvolvedor)

1. Baixe e descompacte o arquivo `x-id-grabber.zip`. Você terá uma pasta chamada `xid`.
2. Abra `chrome://extensions` no Chrome (ou Edge, Brave, etc.).
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta `xid`.
5. Abra o X e pronto: os botões **ID** e **Link** já aparecem nos posts e nos perfis.

Nenhuma permissão além do próprio X é pedida, e nada é enviado para fora do seu navegador.

## Compatibilidade

- Manifest V3, sem dependências.
- Funciona em `x.com` e no endereço antigo `twitter.com`.
- Chrome, Edge, Brave, Opera e outros navegadores com Chromium.

## Como funciona (resumo técnico)

- O script lê os **React fibers** internos da própria página do X para encontrar o objeto do usuário (`rest_id`/`id_str`) — sem chamar nenhuma API da web.
- Sobe pela árvore de componentes até achar o usuário dono do post ou do perfil e confere o `screen_name` com o `@` visível na tela.
- Um `MutationObserver` agrega as mudanças da página por frame, então os botões seguem o feed rolando sem travar.
- Cache dos IDs em `localStorage`, na chave `xidg_cache`.

## Estrutura

```
xid/
├── manifest.json   # Manifest V3, onde a extensão atua
├── content.js      # Botões, captura do ID e cache
├── content.css     # Visual dos botões e do aviso
├── popup.html      # Janela da extensão
├── popup.css       # Visual da janela
└── icon.png        # Ícone
```

## Links

- GitHub: [github.com/Meresye](https://github.com/Meresye)
- X: [@Meresye](https://x.com/Meresye)

---

Feito por Meresye. Se algum botão não aparecer em alguma parte do X, é só reportar.
