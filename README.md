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
- **Formato**: m3u8 (HLS)
- **Qualidade**: 1080p / 720p

## Notas

- O plugin acessa a API pública do MegaEmbed (`mgeb.top`)
- Nenhum conteúdo é hospedado aqui; apenas redirecionamos para fontes públicas
- Use de acordo com as leis locais e termos de serviço