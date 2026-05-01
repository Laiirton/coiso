# WhatsApp Sticker Bot com WPPConnect

Bot do WhatsApp em TypeScript que transforma imagens e videos em figurinhas usando `@wppconnect-team/wppconnect`.

## O que ele faz

- Conecta no WhatsApp via QR Code
- Converte imagem enviada com `!sticker` em figurinha
- Converte video enviado com `!sticker` em figurinha animada
- Converte resposta a uma imagem/video com `!sticker`
- Pode operar em modo automatico com `AUTO_STICKER_ON_MEDIA=true`

## Estrutura

```text
src/
  config/              # validacao de ambiente e logger
  core/                # bootstrap do bot e roteamento principal
  features/sticker/    # parser, resolucao e conversao de figurinhas
  infrastructure/      # adaptadores do WPPConnect
tests/                 # testes unitarios do comportamento principal
```

## Requisitos

- Node.js 20 ou superior
- WhatsApp Web ativo para escanear o QR Code
- `ffmpeg` disponivel via `ffmpeg-static` ou `FFMPEG_PATH`

## Instalacao

```bash
npm install
```

## Configuracao

Copie `.env.example` para `.env` e ajuste o que precisar.

Variaveis principais:

- `SESSION_NAME`: nome da sessao no WPPConnect
- `BOT_PREFIX`: prefixo do comando, padrao `!`
- `AUTO_STICKER_ON_MEDIA`: converte qualquer midia recebida automaticamente
- `HEADLESS`: executa o navegador em modo invisivel
- `TOKEN_STORE_DIR`: pasta para persistir tokens da sessao
- `TOKEN_STORE`: estrategia de persistencia do WPPConnect
- `MAX_VIDEO_SECONDS`: limite de duracao para gerar figurinha animada
- `MAX_VIDEO_FPS`: frames por segundo usados na conversao do video
- `MAX_STICKER_SIZE`: tamanho do quadro final da figurinha
- `FFMPEG_PATH`: caminho customizado para o binario do ffmpeg

## Como executar

```bash
npm run dev
```

Na primeira execucao, o bot vai mostrar o QR Code no terminal. Escaneie com:

- WhatsApp
- Dispositivos conectados
- Conectar dispositivo

## Como usar

### Modo por comando

Envie uma imagem ou video com a legenda:

```text
!sticker
```

### Modo por resposta

Responda a uma imagem ou video com:

```text
!sticker
```

### Modo automatico

Se `AUTO_STICKER_ON_MEDIA=true`, qualquer imagem/video valido recebido sera convertido sem precisar do comando.

### Ajuda

```text
!help
```

## Scripts

- `npm run dev`: executa o bot em modo de desenvolvimento
- `npm run build`: compila TypeScript para `dist/`
- `npm start`: executa a versao compilada
- `npm run lint`: roda o ESLint
- `npm test`: roda os testes unitarios

## Observacoes de manutencao

- O cliente do WhatsApp fica isolado em `src/infrastructure/whatsapp/`
- A logica de comandos fica em `src/features/sticker/sticker-command.ts`
- A conversao de video para GIF fica isolada em `src/features/sticker/video-to-gif.ts`
- O servico de sticker nao conhece detalhes do parser, so recebe uma requisicao pronta
- Se quiser adicionar novos comandos, crie outro arquivo em `src/features/` e ligue no `src/core/bot.ts`

## Referencias oficiais

- [WPPConnect README](https://github.com/wppconnect-team/wppconnect)
- [WPPConnect docs - Creating a Client](https://wppconnect.io/docs/tutorial/basics/creating-client)
- [WPPConnect docs - Basic Functions](https://wppconnect.io/docs/tutorial/basics/basic-functions/)
- [WPPConnect docs - Receiving Messages](https://wppconnect.io/docs/tutorial/basics/receiving-messages/)
