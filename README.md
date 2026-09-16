# MegaEmbed Custom

Plugin personalizado para o Nuvio com apenas o provedor MegaEmbed.

## Estrutura

```
mega-embed-custom/
├── manifest.json
├── providers/
│   └── megaembed.js
└── README.md
```

## Como usar

### 1. Hospedar os arquivos

Você precisa hospedar esses arquivos em um servidor HTTP acessível publicamente.

Opções gratuitas:
- **GitHub Pages**: crie um repositório, suba esses arquivos e ative o Pages na branch `main`
- **Vercel / Netlify**: conecte um repositório Git e faça deploy
- **Servidor próprio**: qualquer hosting com HTTPS

### 2. Obter a URL do manifest

Após hospedar, a URL do manifest será algo como:
```
https://SEU_USUARIO.github.io/SEU_REPOSITORIO/manifest.json
```

### 3. Adicionar no Nuvio

1. Abra o Nuvio
2. Vá em **Settings** > **Plugins**
3. Toque em **Add Repository**
4. Cole a URL do manifest
5. Salve e dê **Refresh**
6. Ative o provider **MegaEmbed**

### 4. Testar localmente (opcional)

Se quiser testar antes de hospedar:

1. Suba um servidor local na pasta do projeto:
    ```bash
    npx serve .
    # ou
    python -m http.server 3000
    ```

2. No Nuvio, use a URL:
    ```
    http://192.168.1.X:3000/manifest.json
    ```

## Sobre o provedor

- **Nome**: MegaEmbed
- **Idioma**: Português
- **Tipos**: Filmes e Séries
- **Formato**: iframe embed (não stream direto)
- **Qualidade**: 1080p / 720p

## Limitações importantes

O MegaEmbed retorna ** URLs de embed iframe**, não streams diretos (m3u8/mp4). 
O fluxo real é: MegaEmbed → viewplayer.online → abyssplayer/megaembed.link (com stream criptografado).
Sem execução de JavaScript (que o Nuvio não suporta), **não é possível extrair a URL direta do vídeo**.
O plugin retorna a URL do embed com `behaviorHints.notWebReady = true` para abrir no navegador.

## Rotas da API utilizadas

- Filme: `GET /embed/movie?tmdb={TMDB_ID}`
- Série: `GET /embed/series?tmdb={TMDB_ID}&sea={SEASON}&epi={EPISODE}`
- Stream: `GET /ajax/get_stream_link?id={SERVER_ID}&movie={MOVIE_ID}&is_init=false&captcha=&ref=`

## Notas

- O plugin acessa a API pública do MegaEmbed (`megaembedapi.site`)
- Nenhum conteúdo é hospedado aqui; apenas redirecionamos para fontes públicas
- Use de acordo com as leis locais e termos de serviço