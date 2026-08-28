# Pasta /midia

Coloque aqui todos os arquivos de mídia usados no slideshow do "Pit Stop Lanches".

## O que colocar aqui

- **Fotos dos produtos**: arquivos `.jpg` ou `.png`.
- **Vídeos dos produtos**: arquivos `.mp4` (recomendado H.264, para compatibilidade
  com o navegador da TV box Android).
- **Logo da marca**: um arquivo de imagem (ex: `logo.png`, de preferência com fundo
  transparente) para aparecer fixa em um dos cantos da tela.

## Nomeando os arquivos

Não há regra fixa de nome — você escolhe o nome do arquivo e depois referencia esse
mesmo nome no array `SLIDES`, dentro de `script.js`. Sugestão: use nomes descritivos
e sem espaços/acentos, por exemplo:

```
midia/xburguer.jpg
midia/batata-frita.mp4
midia/logo.png
```

## Depois de colocar os arquivos

1. Abra o arquivo `script.js` na raiz do projeto.
2. Edite o array `SLIDES` no topo do arquivo, substituindo os itens de exemplo
   pelos seus produtos reais (arquivo, nome, descrição, preço, duração etc).
3. Configure o caminho da logo e o canto onde ela aparece na seção `CONFIG_LOGO`
   (também no topo do `script.js`).
4. Abra o `index.html` no navegador para testar.

## Recomendações de mídia

- Imagens: resolução próxima de 1920x1080 (ou maior), formato paisagem, já otimizadas/
  comprimidas (o código não redimensiona nem comprime nada).
- Vídeos: curtos (poucos segundos a ~15s), leves (bitrate baixo), sem áudio necessário
  (o vídeo toca sempre mudo).
- Logo: PNG com fundo transparente fica melhor sobre fotos e vídeos variados.
