/* ==========================================================================
   Pit Stop Lanches - Painel de Mídia Indoor (slideshow)

   COMO EDITAR:
   1. Preencha o array SLIDES abaixo com seus produtos reais (arquivos já
      devem estar na pasta /midia).
   2. Ajuste CONFIG_LOGO com o arquivo e o canto onde a logo deve aparecer.
   3. Não precisa mexer no resto do arquivo para o uso básico.

   Compatibilidade: escrito em JavaScript "clássico" (ES6 simples), sem
   recursos muito recentes, para funcionar bem em WebView/Chrome Android
   mais antigos usados em TV boxes.
   ========================================================================== */

// --------------------------------------------------------------------------
// CONFIGURAÇÃO DA LOGO DA MARCA (cantinho fixo, visível em todos os slides)
// --------------------------------------------------------------------------
// arquivo: caminho da imagem da logo dentro de /midia
// posicao: um dos valores abaixo
//   "superior-esquerdo" | "superior-direito" | "inferior-esquerdo" | "inferior-direito"
var CONFIG_LOGO = {
  arquivo: "midia/logo-pitstop.jpeg",
  posicao: "superior-direito"
};

// --------------------------------------------------------------------------
// ARRAY DE SLIDES
// --------------------------------------------------------------------------
// Campos de cada slide:
//   tipo    : "imagem" ou "video"
//   arquivo : caminho do arquivo dentro de /midia
//   efeito  : "pulso" (zoom suave pulsando, usado na logo de abertura) ou
//             "kenburns" (zoom lento contínuo, padrão para fotos de produto)
//   duracao : tempo mínimo de exibição do slide, em segundos.
//             Para vídeos, se o vídeo for mais longo que "duracao",
//             vale o tempo real do vídeo (ele não é cortado).
var SLIDES = [
  { tipo: "imagem", arquivo: "midia/logo-pitstop.jpeg", efeito: "pulso", duracao: 4 },
  { tipo: "imagem", arquivo: "midia/primeira.png", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/terca.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/quarta.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "video", arquivo: "midia/quarta.mp4", duracao: 8 },
  { tipo: "imagem", arquivo: "midia/quinta.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/sexta.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "video", arquivo: "midia/sexta.mp4", duracao: 8 },
  { tipo: "imagem", arquivo: "midia/nocidadexcoracao.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/novidade-pernil.png", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/chopp.png", efeito: "kenburns", duracao: 6 },
  { tipo: "video", arquivo: "midia/batata-fritavideo.mp4", duracao: 8 },
  { tipo: "imagem", arquivo: "midia/batatareal.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/batatreal.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/lanchereal.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/lanchereal2.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/lanchereal3.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/poracaoreal.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/porcaoreal.jpeg", efeito: "kenburns", duracao: 6 }
];

// ==========================================================================
// A PARTIR DAQUI É O MOTOR DO SLIDESHOW - normalmente não precisa editar
// ==========================================================================

(function () {
  "use strict";

  var TRANSICAO_MS = 600; // precisa bater com "transition: opacity" do CSS

  var palco = document.getElementById("palco");
  var elIndicadores = document.getElementById("indicadores");
  var elLogo = document.getElementById("logo-marca");
  var elAvisoFullscreen = document.getElementById("aviso-fullscreen");

  // Duas camadas reaproveitadas para o crossfade (em vez de criar uma
  // camada nova por slide) - mantém o DOM leve, importante para TV box.
  var camadaA = document.createElement("div");
  var camadaB = document.createElement("div");
  camadaA.className = "slide";
  camadaB.className = "slide";
  palco.appendChild(camadaA);
  palco.appendChild(camadaB);

  var camadaAtiva = camadaA;
  var camadaOculta = camadaB;

  var indiceAtual = -1;
  var timerAvanco = null;
  var falhasSeguidas = 0;

  // --------------------------------------------------------------------
  // Indicadores (bolinhas)
  // --------------------------------------------------------------------
  function montarIndicadores() {
    elIndicadores.innerHTML = "";
    for (var i = 0; i < SLIDES.length; i++) {
      var bolinha = document.createElement("div");
      bolinha.className = "indicador";
      elIndicadores.appendChild(bolinha);
    }
  }

  function atualizarIndicadores(indice) {
    var bolinhas = elIndicadores.children;
    for (var i = 0; i < bolinhas.length; i++) {
      if (i === indice) {
        bolinhas[i].className = "indicador ativo";
      } else {
        bolinhas[i].className = "indicador";
      }
    }
  }

  // --------------------------------------------------------------------
  // Logo da marca (cantinho fixo)
  // --------------------------------------------------------------------
  function montarLogo() {
    if (!CONFIG_LOGO.arquivo) return;

    elLogo.className = "canto-" + CONFIG_LOGO.posicao;
    elLogo.onload = function () {
      elLogo.style.display = "block";
    };
    elLogo.onerror = function () {
      // Logo ainda não existe ou falhou - simplesmente não mostra,
      // sem quebrar o resto do painel.
      elLogo.style.display = "none";
    };
    elLogo.src = CONFIG_LOGO.arquivo;
  }

  // --------------------------------------------------------------------
  // Criação dos elementos de mídia dentro de uma camada.
  // Para imagens, cria também uma camada de fundo (mesma foto, ampliada e
  // desfocada) que preenche as laterais quando a arte não tem a mesma
  // proporção da tela, em vez de deixar barra preta. Vídeos usam só a
  // mídia principal, sobre o preto do próprio .slide.
  // --------------------------------------------------------------------
  function criarElementosMidia(slide, aoFicarPronto, aoFalhar) {
    var fundo = null;
    var media;

    if (slide.tipo === "video") {
      media = document.createElement("video");
      media.muted = true;
      media.autoplay = true;
      media.playsInline = true; // evita fullscreen automático em alguns Android
      media.setAttribute("playsinline", ""); // compatibilidade extra
      media.controls = false;
      media.preload = "auto";

      media.addEventListener("loadedmetadata", function () {
        aoFicarPronto();
      });

      // Mesmo vídeo tocando desfocado atrás, preenchendo as laterais quando
      // o vídeo é mais "vertical" que a tela (ex: gravado no celular).
      fundo = document.createElement("video");
      fundo.className = "slide-fundo";
      fundo.muted = true;
      fundo.autoplay = true;
      fundo.loop = true;
      fundo.playsInline = true;
      fundo.setAttribute("playsinline", "");
      fundo.controls = false;
      fundo.preload = "auto";
      fundo.src = slide.arquivo;
      var promessaFundo = fundo.play();
      if (promessaFundo && typeof promessaFundo.catch === "function") {
        promessaFundo.catch(function () {
          // Autoplay bloqueado - sem problema, só não terá o preenchimento
          // desfocado atrás; o vídeo principal continua funcionando normal.
        });
      }
    } else {
      media = document.createElement("img");
      media.addEventListener("load", function () {
        aoFicarPronto();
      });

      // Slide da logo (abertura): fundo branco liso, sem desfoque da
      // própria logo atrás dela.
      if (slide.efeito !== "pulso") {
        fundo = document.createElement("img");
        fundo.className = "slide-fundo";
        fundo.alt = "";
        fundo.src = slide.arquivo;
      }
    }

    media.className = "slide-media";
    media.addEventListener("error", function () {
      aoFalhar();
    });
    media.src = slide.arquivo;

    return { fundo: fundo, media: media };
  }

  // --------------------------------------------------------------------
  // Controle principal: mostra o slide de índice "indice"
  // --------------------------------------------------------------------
  function mostrarSlide(indice) {
    if (SLIDES.length === 0) return;

    var slide = SLIDES[indice];

    camadaOculta.innerHTML = "";
    camadaOculta.classList.toggle("fundo-branco", slide.efeito === "pulso");

    var jaAvancou = false;
    function irParaProximo() {
      if (jaAvancou) return;
      jaAvancou = true;
      falhasSeguidas++;

      // Segurança: se todos os slides estiverem quebrados, evita loop
      // infinito travando a aba - espera um pouco mais entre tentativas.
      var atraso = falhasSeguidas >= SLIDES.length ? 3000 : 30;

      if (timerAvanco) clearTimeout(timerAvanco);
      timerAvanco = setTimeout(function () {
        indiceAtual = (indice + 1) % SLIDES.length;
        mostrarSlide(indiceAtual);
      }, atraso);
    }

    var elementos = criarElementosMidia(
      slide,
      function aoFicarPronto() {
        if (jaAvancou) return; // mídia demorou e já desistimos dela
        falhasSeguidas = 0;
        exibirCamadaComMidia(slide, elementos.media, irParaProximo);
      },
      function aoFalhar() {
        irParaProximo();
      }
    );

    if (elementos.fundo) camadaOculta.appendChild(elementos.fundo);
    camadaOculta.appendChild(elementos.media);
  }

  // --------------------------------------------------------------------
  // Faz o crossfade e agenda o avanço para o próximo slide
  // --------------------------------------------------------------------
  function exibirCamadaComMidia(slide, elementoMidia, irParaProximo) {
    if (slide.tipo === "imagem") {
      var duracaoAnimacao = (slide.duracao || 6) + 1; // um pouco mais que o slide

      if (slide.efeito === "pulso") {
        // Logo de abertura: não corta a imagem (contain) e pulsa suavemente,
        // em vez do zoom contínuo usado nas fotos de produto.
        elementoMidia.classList.add("pulso-slide");
        elementoMidia.style.animationDuration = "2.2s";
      } else {
        elementoMidia.classList.add("kenburns");
        elementoMidia.style.animationDuration = duracaoAnimacao + "s";
      }
    }

    // Crossfade: mostra a camada oculta, esconde a anterior
    camadaOculta.classList.add("ativo");
    camadaOculta.classList.remove("saindo");
    camadaAtiva.classList.remove("ativo");
    camadaAtiva.classList.add("saindo");

    atualizarIndicadores(indiceAtual);

    // Troca qual camada é a "ativa" para a próxima rodada
    var temp = camadaAtiva;
    camadaAtiva = camadaOculta;
    camadaOculta = temp;

    // Limpa a camada que acabou de sair, depois da transição de opacidade,
    // para liberar memória de vídeos/imagens anteriores.
    setTimeout(function () {
      camadaOculta.innerHTML = "";
    }, TRANSICAO_MS + 50);

    agendarAvanco(slide, elementoMidia, irParaProximo);
  }

  function agendarAvanco(slide, elementoMidia, irParaProximo) {
    if (timerAvanco) clearTimeout(timerAvanco);

    var duracaoSlideMs = (slide.duracao || 6) * 1000;

    if (slide.tipo === "video") {
      var duracaoVideoMs = (elementoMidia.duration || 0) * 1000;

      if (duracaoVideoMs > duracaoSlideMs) {
        // Vídeo mais longo que o tempo configurado: não corta o vídeo,
        // toca inteiro uma vez e avança quando ele terminar.
        elementoMidia.loop = false;
        elementoMidia.addEventListener("ended", function aoTerminar() {
          elementoMidia.removeEventListener("ended", aoTerminar);
          irParaProximo();
        });
      } else {
        // Vídeo mais curto: repete em loop até completar o tempo do slide.
        elementoMidia.loop = true;
        timerAvanco = setTimeout(irParaProximo, duracaoSlideMs);
      }

      var promessaPlay = elementoMidia.play();
      if (promessaPlay && typeof promessaPlay.catch === "function") {
        promessaPlay.catch(function () {
          // Autoplay bloqueado por algum motivo - ainda assim avança
          // pelo tempo configurado, para não travar o painel.
        });
      }
    } else {
      timerAvanco = setTimeout(irParaProximo, duracaoSlideMs);
    }
  }

  // --------------------------------------------------------------------
  // Tela cheia
  // --------------------------------------------------------------------
  function pedirFullscreen() {
    var docEl = document.documentElement;
    var pedido =
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.msRequestFullscreen;

    if (pedido) {
      try {
        pedido.call(docEl);
      } catch (erro) {
        // Navegador bloqueou por falta de interação do usuário - o aviso
        // na tela cobre esse caso, pedindo para o usuário tocar/F11.
      }
    }
  }

  function iniciarFullscreen() {
    var params = window.location.search || "";
    var pedirAutomatico = params.indexOf("fullscreen=1") !== -1;

    if (pedirAutomatico) {
      pedirFullscreen();
    }

    elAvisoFullscreen.addEventListener("click", function () {
      pedirFullscreen();
      elAvisoFullscreen.classList.add("escondido");
    });

    // Esconde o aviso sozinho depois de um tempo, para não ficar
    // atrapalhando um painel sem interação humana.
    setTimeout(function () {
      elAvisoFullscreen.classList.add("escondido");
    }, 8000);
  }

  // --------------------------------------------------------------------
  // Início
  // --------------------------------------------------------------------
  function iniciar() {
    if (!SLIDES || SLIDES.length === 0) {
      return;
    }

    montarIndicadores();
    montarLogo();
    iniciarFullscreen();

    indiceAtual = 0;
    mostrarSlide(indiceAtual);
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
