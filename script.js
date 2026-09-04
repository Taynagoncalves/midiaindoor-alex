// painel de midia do Pit Stop - slideshow simples em JS puro

// pra trocar a logo ou os slides é só mexer aqui embaixo, não precisa
// tocar no resto do arquivo

var CONFIG_LOGO = {
  arquivo: "midia/logo-pitstop.png",
  posicao: "superior-direito" // superior-esquerdo | superior-direito | inferior-esquerdo | inferior-direito
};

// lista de slides na ordem que aparecem. duracao é em segundos.
// nos videos, se o video for mais longo que a duracao, ele toca inteiro
// mesmo assim (não corta)
var SLIDES = [
  { tipo: "imagem", arquivo: "midia/logo-pitstop.png", efeito: "pulso", duracao: 4 },
  { tipo: "imagem", arquivo: "midia/primeira.png", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/terca.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/quarta.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "video", arquivo: "midia/quarta.mp4", duracao: 8 },
  { tipo: "imagem", arquivo: "midia/quinta.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/sexta.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "video", arquivo: "midia/sexta.mp4", duracao: 8 },
  { tipo: "imagem", arquivo: "midia/combo-sabado.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "imagem", arquivo: "midia/combo-domingo.jpeg", efeito: "kenburns", duracao: 6 },
  { tipo: "video", arquivo: "midia/video-tio.mp4", duracao: 8 },
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

// daqui pra baixo é o motor do slideshow, não mexi mais nisso

(function () {
  "use strict";

  var TRANSICAO_MS = 900; // tem que ser igual ao tempo da transição lá no css

  var palco = document.getElementById("palco");
  var elIndicadores = document.getElementById("indicadores");
  var elLogo = document.getElementById("logo-marca");
  var elAvisoFullscreen = document.getElementById("aviso-fullscreen");

  // uso só duas divs e fico reaproveitando elas pro crossfade, em vez de
  // ficar criando uma nova a cada slide (roda mais leve na tv box)
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

  // logo fixa no canto
  function montarLogo() {
    if (!CONFIG_LOGO.arquivo) return;

    elLogo.className = "canto-" + CONFIG_LOGO.posicao;
    elLogo.onload = function () {
      elLogo.style.display = "block";
    };
    elLogo.onerror = function () {
      // se a logo não carregar não quero que quebre o resto, só esconde
      elLogo.style.display = "none";
    };
    elLogo.src = CONFIG_LOGO.arquivo;
  }

  // monta a imagem/video do slide + a camada de fundo desfocada que
  // preenche os cantos quando a mídia não é do mesmo formato da tela
  function criarElementosMidia(slide, aoFicarPronto, aoFalhar) {
    var fundo = null;
    var media;

    if (slide.tipo === "video") {
      media = document.createElement("video");
      media.muted = true;
      media.autoplay = true;
      media.playsInline = true; // pra não abrir em tela cheia sozinho no android
      media.setAttribute("playsinline", "");
      media.controls = false;
      media.preload = "auto";

      media.addEventListener("loadedmetadata", function () {
        aoFicarPronto();
      });

      // mesmo video de novo, desfocado, tocando atrás (pra preencher os
      // cantos quando o video é vertical)
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
          // se o autoplay for bloqueado não tem problema, só fica sem o fundo
        });
      }
    } else {
      media = document.createElement("img");
      media.addEventListener("load", function () {
        aoFicarPronto();
      });

      if (slide.efeito === "pulso") {
        // esse é o slide da logo, usa a arte de fundo própria em vez do
        // desfoque automático
        fundo = document.createElement("img");
        fundo.className = "slide-fundo slide-fundo-nitido";
        fundo.alt = "";
        fundo.src = "midia/fundo-logo.png";
      } else {
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

      // se ficar quebrando tudo (arquivo com defeito etc) espera mais pra
      // não ficar num loop maluco trocando de slide toda hora
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
        if (jaAvancou) return; // demorou demais e já pulou esse slide
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

  function exibirCamadaComMidia(slide, elementoMidia, irParaProximo) {
    if (slide.tipo === "imagem") {
      var duracaoAnimacao = (slide.duracao || 6) + 1; // um pouco a mais que o slide

      if (slide.efeito === "pulso") {
        elementoMidia.classList.add("pulso-slide");
        elementoMidia.style.animationDuration = "2.2s";
      } else {
        elementoMidia.classList.add("kenburns");
        elementoMidia.style.animationDuration = duracaoAnimacao + "s";
      }
    }

    // troca de slide: mostra o que tava escondido, esconde o que tava ativo
    camadaOculta.classList.add("ativo");
    camadaOculta.classList.remove("saindo");
    camadaAtiva.classList.remove("ativo");
    camadaAtiva.classList.add("saindo");

    atualizarIndicadores(indiceAtual);

    var temp = camadaAtiva;
    camadaAtiva = camadaOculta;
    camadaOculta = temp;

    // depois que a transição termina, limpa a camada antiga pra não ficar
    // com video/imagem ocupando memória à toa
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
        // video maior que o tempo configurado - deixa tocar até o fim
        elementoMidia.loop = false;
        elementoMidia.addEventListener("ended", function aoTerminar() {
          elementoMidia.removeEventListener("ended", aoTerminar);
          irParaProximo();
        });
      } else {
        // video mais curto - repete até bater o tempo do slide
        elementoMidia.loop = true;
        timerAvanco = setTimeout(irParaProximo, duracaoSlideMs);
      }

      var promessaPlay = elementoMidia.play();
      if (promessaPlay && typeof promessaPlay.catch === "function") {
        promessaPlay.catch(function () {
          // se travar o play por algum motivo, segue o baile mesmo assim
        });
      }
    } else {
      timerAvanco = setTimeout(irParaProximo, duracaoSlideMs);
    }
  }

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
        // navegador bloqueou (precisa de clique antes) - o aviso na tela
        // já cobre esse caso
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

    // some sozinho depois de um tempo pra não ficar atrapalhando quando
    // ninguém vai clicar mesmo (painel ligado sozinho na tv)
    setTimeout(function () {
      elAvisoFullscreen.classList.add("escondido");
    }, 8000);
  }

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
