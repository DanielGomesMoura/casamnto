import { useState, useEffect } from 'react';
import { Heart, MapPin, Calendar, Clock, CheckCircle2, XCircle, Menu, X, Info, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.config'; // Ajuste o caminho se necessário

// ADICIONE AS INTERFACES DO BANCO:
interface Convidado {
  nome: string;
  confirmado: boolean;
}

interface ConviteData {
  id: string;
  familia: string;
  categoria: string;
  qtdPessoas: number;
  qtdConfirmados: number;
  convidados: Convidado[];
}

// ==========================================
// CONFIGURAÇÕES DO CASAMENTO (Altere aqui)
// ==========================================
const WEDDING_DATE = new Date("2026-10-24T16:00:00");
const BRIDE_NAME = "Ana";
const GROOM_NAME = "Daniel";

const SLIDER_IMAGES = [
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?q=80&w=2070&auto=format&fit=crop"
];

// Slides da Tela "Nossa História"
const STORY_SLIDES = [
  {
    image: "./imagem1.jpeg",
    text: "Tudo começou com um sorriso inesperado em um instituto de lingua inglesa...",
    date: "O Início"
  },
  {
    image: "./imagem2.jpeg",
    text: "Uma mensagem no chat da empresa pedindo ajuda técnica...",
    date: "O Início"
  },
  {
    image: "./imagem3.jpeg",
    text: "Uma simples interação que se tornou algo muito maior...",
    date: "O Início"
  },
  {
    image: "./imagem4.jpeg",
    text: "Encontros marcados para irmos pegar ônibus juntos...",
    date: "A Jornada"
  },
  {
    image: "./imagem5.jpeg",
    text: "Até que a convidei para o nosso primeiro encontro oficial...",
    date: "O Início do Namoro"
  },
  {
    image: "./imagem7.jpeg",
    text: "... E naquele dia eu tive a certeza que queria passar o resto da minha vida com ela.",
    date: "O Início do Namoro"
  },
  {
    image: "./imagem6.jpeg",
    text: "E agora, estamos prestes a escrever o nosso 'Para Sempre' em frente de todos que amamos.",
    date: "O Futuro"
  }
];

// ==========================================
// COMPONENTES PRINCIPAIS
// ==========================================

export default function App() {
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // NOVOS ESTADOS PARA O FIREBASE
  const [conviteData, setConviteData] = useState<ConviteData | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito para mudar a cor do menu ao rolar a página
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // EFEITO DO FIREBASE (Busca o ID da URL e pega no Banco)
  useEffect(() => {
    const fetchConvite = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");

      if (!id) {
        setLoading(false);
        return; // Sem ID na URL, conviteData fica null
      }

      try {
        const docRef = doc(db, "convite", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setConviteData({ id, ...docSnap.data() } as ConviteData);
        }
      } catch (error) {
        console.error("Erro ao buscar convite:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConvite();
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // NAVEGAÇÃO INTELIGENTE (Só mostra Padrinhos se for padrinho)
  const navLinks = [
    { id: 'home', label: 'O Casamento' },
    { id: 'historia', label: 'Nossa História' },
    // A mágica acontece aqui:
    ...(conviteData?.categoria === 'padrinho' || conviteData?.categoria === 'madrinha'
      ? [{ id: 'padrinhos', label: 'Para Padrinhos' }]
      : []),
    { id: 'convidados', label: 'Para Convidados' },
    { id: 'presentes', label: 'Lista de Presentes' },
  ];

  // Lógica para saber se o Header deve ser transparente ou branco
  const isImmersivePage = currentPage === 'home' || currentPage === 'historia';
  const isHeaderWhite = scrolled || !isImmersivePage;

  // TELA DE CARREGAMENTO INICIAL
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dcd6d0]">
        <div className="animate-pulse flex flex-col items-center">
          <Heart className="text-rose-400 mb-4 animate-bounce" size={40} />
          <p className="font-serif text-stone-600 tracking-widest uppercase">Buscando seu convite...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* INJEÇÃO DE ESTILOS GLOBAIS (Fontes + Animações do Site e Envelope) */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
          
          .font-serif { font-family: 'Playfair Display', serif; }
          .font-sans { font-family: 'Montserrat', sans-serif; }
          
          /* Animações do site principal */
          @keyframes slow-zoom {
            0% { transform: scale(1); }
            100% { transform: scale(1.1); }
          }
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-slow-zoom {
            animation: slow-zoom 20s linear infinite alternate;
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }

          /* --- Animações do Envelope --- */
          .perspective-container {
            perspective: 1200px;
          }
          .envelope-top {
            clip-path: polygon(0 0, 50% 55%, 100% 0);
            transform-origin: top;
            transition: transform 0.8s ease-in-out;
            z-index: 40;
          }
          .envelope-top.open {
            transform: rotateX(180deg);
            z-index: 10;
          }
          .envelope-left {
            clip-path: polygon(0 0, 50% 55%, 0 100%);
            z-index: 30;
          }
          .envelope-right {
            clip-path: polygon(100% 0, 50% 55%, 100% 100%);
            z-index: 30;
          }
          .envelope-bottom {
            clip-path: polygon(0 100%, 50% 55%, 100% 100%);
            z-index: 30;
          }
          .letter-content {
            transition: transform 1s ease-in-out, opacity 1s ease-in-out;
            transition-delay: 0.6s;
            z-index: 20;
          }
          .letter-content.slide-up {
            transform: translateY(-70%);
          }
          .overlay-fade {
            transition: opacity 1s ease-in-out;
            transition-delay: 1.5s;
          }
          .overlay-fade.open {
            opacity: 0;
            pointer-events: none;
          }

          /* --- Animação do Livro (Nossa História) --- */
          .book-container {
            perspective: 1500px;
          }
          .book-page {
            transform-style: preserve-3d;
            transform-origin: left center;
            transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
          }
          .book-page.flipped {
            transform: rotateY(-180deg);
          }
          .backface-hidden {
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
        `}
      </style>

      {/* Renderiza o envelope se não estiver aberto */}
      {!isEnvelopeOpen && (
        <EnvelopeScreen onOpenComplete={() => setIsEnvelopeOpen(true)} nomeFamilia={conviteData?.familia}
        />
      )}

      {/* Renderiza o site após a abertura do envelope */}
      {isEnvelopeOpen && (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
          {/* HEADER / NAVEGAÇÃO */}
          <nav className={`fixed w-full z-50 transition-all duration-300 ${isHeaderWhite ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                {/* Logo / Nomes */}
                <div
                  className={`font-serif text-2xl cursor-pointer flex flex-col md:flex-row items-center md:gap-2 leading-none md:leading-normal transition-colors ${isHeaderWhite ? 'text-stone-800' : 'text-white drop-shadow-md'}`}
                  onClick={() => navigateTo('home')}
                >
                  <span>{BRIDE_NAME}</span>
                  <span className="text-xl md:text-2xl mt-1 md:mt-0">&</span>
                  <span>{GROOM_NAME}</span>
                </div>

                {/* Menu Desktop */}
                <div className="hidden md:flex space-x-6 lg:space-x-8">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => navigateTo(link.id)}
                      className={`uppercase tracking-widest text-[10px] lg:text-xs font-medium transition-colors ${isHeaderWhite
                        ? (currentPage === link.id ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-500 hover:text-stone-900')
                        : (currentPage === link.id ? 'text-white border-b-2 border-white drop-shadow-md' : 'text-white/80 hover:text-white drop-shadow-md')
                        }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* Menu Mobile Toggle */}
                <div className="md:hidden">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`${isHeaderWhite || isMenuOpen ? 'text-stone-800' : 'text-white drop-shadow-md'}`}
                  >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Mobile Dropdown */}
            {isMenuOpen && (
              <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 flex flex-col items-center space-y-4 border-t border-stone-100">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => navigateTo(link.id)}
                    className={`uppercase tracking-widest text-sm w-full py-2 text-center ${currentPage === link.id ? 'text-stone-900 font-bold bg-stone-50' : 'text-stone-600'
                      }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </nav>

          {/* ROTEAMENTO SIMPLES */}
          <main className="min-h-screen">
            {currentPage === 'home' && <HomeScreen conviteData={conviteData} navigateTo={navigateTo} />}
            {currentPage === 'historia' && <HistoriaScreen />}
            {currentPage === 'padrinhos' && <PadrinhosScreen />}
            {currentPage === 'convidados' && <ConvidadosScreen />}
            {currentPage === 'presentes' && <PresentesScreen conviteData={conviteData} />}
          </main>

          {/* FOOTER */}
          <footer className="bg-stone-900 text-stone-300 py-12 text-center">
            <div className="max-w-4xl mx-auto px-4">
              <Heart className="mx-auto mb-4 text-rose-400" size={24} />
              <h2 className="font-serif text-2xl mb-2">{BRIDE_NAME} & {GROOM_NAME}</h2>
              <p className="text-sm tracking-widest uppercase mb-6">Com amor, esperamos por você.</p>
              <p className="text-xs text-stone-500">© {new Date().getFullYear()} - Desenvolvido por Daniel Moura o Noivo</p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

// ==========================================
// TELA 4: ENVELOPE DO CLIENTE
// ==========================================
function EnvelopeScreen({ onOpenComplete, nomeFamilia }: { onOpenComplete: () => void, nomeFamilia?: string }) {
  const [envelopeState, setEnvelopeState] = useState('closed');

  const handleOpenEnvelope = () => {
    if (envelopeState !== 'closed') return;
    setEnvelopeState('opening');

    // Espera a animação terminar (2.5 segundos) para sumir com o envelope e mostrar o site
    setTimeout(() => {
      onOpenComplete();
    }, 2500);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-100/95 backdrop-blur-md overlay-fade ${envelopeState === 'opening' ? 'open' : ''}`}>

      <div className="relative w-[90vw] max-w-112.5 aspect-4/3 perspective-container drop-shadow-2xl">

        {/* Fundo interno do envelope (mais escuro) */}
        <div className="absolute inset-0 bg-[#dcd6d0] rounded-lg"></div>

        {/* O Convite (Cartão Branco) que desliza para cima */}
        <div className={`absolute left-4 right-4 top-4 bottom-4 bg-white rounded-md shadow-md flex flex-col items-center justify-center p-6 text-center letter-content ${envelopeState === 'opening' ? 'slide-up' : ''}`}>
          <Heart className="text-rose-300 mb-3 w-8 h-8" strokeWidth={1} />
          <h2 className="text-2xl md:text-3xl font-serif text-stone-700 mb-2">{nomeFamilia || `${BRIDE_NAME} & ${GROOM_NAME}`}</h2>
          <div className="w-12 h-px bg-rose-200 my-3"></div>
          <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-stone-400">24 de Outubro de 2026</p>
        </div>

        {/* Abas do Envelope (Laterais e Fundo) */}
        <div className="absolute inset-0 bg-[#e6e0da] rounded-lg envelope-left shadow-[2px_0_5px_rgba(0,0,0,0.02)]"></div>
        <div className="absolute inset-0 bg-[#e6e0da] rounded-lg envelope-right shadow-[-2px_0_5px_rgba(0,0,0,0.02)]"></div>
        <div className="absolute inset-0 bg-[#f0ece7] rounded-lg envelope-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"></div>

        {/* Aba Superior (Que abre) */}
        <div className={`absolute inset-0 bg-[#ebe6e1] rounded-lg envelope-top shadow-[0_2px_10px_rgba(0,0,0,0.05)] ${envelopeState === 'opening' ? 'open' : ''}`}></div>

        {/* Selo de Cera / Botão de Abrir COM A LOGO NOVA */}
        <button
          onClick={handleOpenEnvelope}
          disabled={envelopeState !== 'closed'}
          className={`absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 z-50 border border-stone-200 cursor-pointer ${envelopeState === 'opening' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        >
          {/* ========================================================================= */}
          {/* O `scale-[1.8]` faz a imagem vazar para fora do botão branco              */}
          {/* ========================================================================= */}
          <img
            src="./logo_envelope.png"
            alt="Logo D&A"
            className="w-full h-full object-contain drop-shadow-md scale-[1.8]"
          />
        </button>

      </div>

      {/* Texto de incentivo */}
      <div className={`mt-16 text-stone-500 font-serif italic text-xl transition-opacity duration-500 ${envelopeState === 'opening' ? 'opacity-0' : 'opacity-100'}`}>
        Temos uma supresa para você ...
      </div>
    </div>
  );
}

// ==========================================
// NOVA TELA: NOSSA HISTÓRIA (Livro / Swipe)
// ==========================================
function HistoriaScreen() {
  const [activePage, setActivePage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextPage = () => {
    if (activePage < STORY_SLIDES.length - 1) setActivePage(p => p + 1);
  };

  const prevPage = () => {
    if (activePage > 0) setActivePage(p => p - 1);
  };

  // Funções para detectar o Swipe (Arrastar) no telemóvel
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextPage();
    if (isRightSwipe) prevPage();
  };

  return (
    <div className="relative h-screen bg-stone-900 overflow-hidden font-sans flex flex-col items-center justify-center">

      {/* Background Desfocado e Imersivo */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <img
          src={STORY_SLIDES[activePage].image}
          alt="Background"
          className="w-full h-full object-cover opacity-40 blur-xl scale-110"
        />
      </div>

      <div className="relative z-20 w-full flex flex-col items-center pt-16">
        <h1 className="text-white font-serif text-4xl md:text-5xl mb-8 drop-shadow-lg text-center">Nossa História</h1>

        {/* O Álbum / Livro */}
        <div
          className="book-container relative w-[85vw] max-w-[400px] aspect-[3/4]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Capa de trás (Base do livro) */}
          <div className="absolute inset-0 bg-[#e0dcd3] rounded-r-2xl rounded-l-md shadow-2xl translate-x-1 translate-y-1 md:translate-x-2 md:translate-y-2 border border-stone-300"></div>

          {/* Mapeando todas as páginas do livro */}
          {STORY_SLIDES.map((slide, index) => {
            const isFlipped = index < activePage; // Se a página for menor que a atual, ela foi virada para a esquerda

            return (
              <div
                key={index}
                className={`book-page absolute inset-0 bg-[#fdfbf7] rounded-r-2xl rounded-l-md shadow-[-5px_0_15px_rgba(0,0,0,0.15)] border-l-4 border-stone-300/50 flex flex-col ${isFlipped ? 'flipped' : ''}`}
                style={{ zIndex: STORY_SLIDES.length - index }}
              >
                {/* FRENTE DA PÁGINA */}
                <div className="absolute inset-0 p-4 md:p-6 flex flex-col backface-hidden">
                  {/* Foto (Polaroid style) */}
                  <div className="w-full h-[55%] overflow-hidden rounded-xl shadow-inner mb-6 relative bg-stone-200">
                    {/* pointer-events-none previne que a imagem interfira no gesto de arrastar no telemóvel */}
                    <img src={slide.image} alt="Momento" className="w-full h-full object-cover pointer-events-none" />
                  </div>

                  {/* Texto */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <p className="font-serif italic text-rose-400 mb-3 text-sm">{slide.date}</p>
                    <h2 className="font-serif text-xl md:text-2xl text-stone-800 leading-snug px-2">
                      {slide.text}
                    </h2>
                  </div>

                  {/* Numeração da Página */}
                  <div className="absolute bottom-4 right-6 text-stone-400 font-serif italic text-xs">
                    {index + 1} / {STORY_SLIDES.length}
                  </div>
                </div>

                {/* VERSO DA PÁGINA (Visível quando virada para a esquerda) */}
                <div className="absolute inset-0 bg-[#f4f1ea] rounded-l-2xl rounded-r-md backface-hidden rotate-y-180 border-r-4 border-stone-300/50 flex items-center justify-center">
                  <Heart size={48} className="text-stone-300 opacity-30" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Controles (Botões visíveis em desktop, mas também funcionam no telemóvel) */}
        <div className="flex items-center gap-6 mt-10 z-20">
          <button
            onClick={prevPage}
            disabled={activePage === 0}
            className={`p-3 rounded-full bg-white/20 backdrop-blur-md text-white transition-all ${activePage === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:bg-white/30 hover:scale-110 shadow-lg'}`}
          >
            <ChevronLeft size={24} />
          </button>

          <span className="text-white/80 text-xs tracking-widest uppercase animate-pulse">
            Deslize a página
          </span>

          <button
            onClick={nextPage}
            disabled={activePage === STORY_SLIDES.length - 1}
            className={`p-3 rounded-full bg-white/20 backdrop-blur-md text-white transition-all ${activePage === STORY_SLIDES.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:bg-white/30 hover:scale-110 shadow-lg'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// TELA 1: INÍCIO (Convite, Timer, RSVP, Mapas)
// ==========================================
function HomeScreen({ conviteData, navigateTo }: { conviteData: ConviteData | null, navigateTo: (page: string) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Efeito do Slider de Imagens
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000); // Troca a imagem a cada 5 segundos
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in font-sans">
      {/* HERO SECTION (Slider + Título + Timer) */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Images */}
        {SLIDER_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <div className="absolute inset-0 bg-black/40 z-10" /> {/* Overlay escuro */}
            <img src={img} alt={`Casamento ${index}`} className="object-cover w-full h-full animate-slow-zoom" />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-20 text-center text-white px-4 mt-16">
          <p className="tracking-[0.3em] uppercase text-sm md:text-base mb-4 drop-shadow-md">Vamos nos casar!</p>

          <h1 className="font-serif text-6xl lg:text-8xl xl:text-9xl mb-6 drop-shadow-lg flex flex-col min-[1550px]:flex-row justify-center items-center gap-2 min-[1550px]:gap-6">
            <span className="min-[1550px]:ml-32">{BRIDE_NAME}</span>
            <span className="text-rose-300 italic">&</span>
            <span>{GROOM_NAME}</span>
          </h1>

          <p className="text-xl lg:text-2xl font-serif italic mb-12 drop-shadow-md">24 de Outubro de 2026</p>

          <Countdown targetDate={WEDDING_DATE} />
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* SEÇÃO NOSSA HISTÓRIA (Call to Action) */}
      <section className="py-24 px-4 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <Heart className="mx-auto text-rose-300 mb-6" size={32} strokeWidth={1.5} />
          <h2 className="font-serif text-4xl mb-6 text-stone-800">Como tudo começou</h2>
          <p className="text-stone-600 mb-10 leading-relaxed px-4">
            De um encontro inesperado até o altar, cada momento da nossa jornada nos trouxe até o momento mais feliz de nossas vidas.
            Convidamos você a reviver os capítulos mais especiais da nossa história de amor.
          </p>
          <button
            onClick={() => navigateTo('historia')}
            className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-stone-700 border border-stone-300 rounded-full font-medium tracking-widest uppercase text-sm hover:bg-stone-50 hover:text-stone-900 transition-all shadow-sm hover:shadow-md gap-3"
          >
            <Heart size={18} className="text-rose-400" />
            Ler Nossa História
          </button>
        </div>
      </section>

      {/* SEÇÃO RSVP (Confirmação) */}
      <section className="py-20 px-4 bg-stone-100">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="font-serif text-4xl mb-4 text-stone-800">Confirme sua Presença</h2>
          <p className="text-stone-600">Por favor, confirme sua presença até o dia 15 de Outubro de 2026. Sua resposta é muito importante para nossa organização.</p>
        </div>
        <RSVPForm conviteData={conviteData} />

        {/* BOTÃO LISTA DE PRESENTES */}
        <div className="max-w-3xl mx-auto mt-16 text-center border-t border-stone-200 pt-12">
          <h3 className="font-serif text-3xl mb-4 text-stone-800">Nosso Lar</h3>
          <p className="text-stone-600 mb-8 px-4">
            Sua presença é o nosso maior presente. Mas se desejar nos presentear de outra forma, preparamos uma lista especial com muito carinho.
          </p>
          <button
            onClick={() => navigateTo('presentes')}
            className="inline-flex items-center justify-center px-8 py-4 bg-rose-400 text-white rounded-full font-medium tracking-wide uppercase hover:bg-rose-500 transition-colors shadow-lg hover:shadow-xl gap-3"
          >
            <Gift size={20} />
            Ver Lista de Presentes
          </button>
        </div>
      </section>

      {/* SEÇÃO MAPAS (Localização) */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-4xl mb-16 text-center text-stone-800">Localização</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Cerimônia */}
            <div className="bg-stone-50 rounded-xl overflow-hidden shadow-lg border border-stone-100 flex flex-col">
              <div className="p-8 text-center grow">
                <Heart className="mx-auto text-rose-400 mb-4" size={32} />
                <h3 className="font-serif text-2xl mb-2">Cerimônia Religiosa</h3>
                <p className="text-stone-500 mb-4 font-medium">Paróquia Menino Jesus de Praga</p>
                <div className="flex items-start justify-center text-stone-600 mb-2">
                  <MapPin className="mr-2 shrink-0 mt-1" size={18} />
                  <p className="text-sm">Beco Eduardo Ribeiro S/N - 69050-061<br />Chapada, Manaus - AM</p>
                </div>
                <div className="flex items-center justify-center text-stone-600">
                  <Clock className="mr-2" size={18} />
                  <p className="text-sm">Início pontualmente às 18:00</p>
                </div>
              </div>
              <div className="h-64 w-full bg-gray-200">
                {/* Embed do Google Maps */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d996.004382327813!2d-60.0263368!3d-3.0899917!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x926c11001f2cc491%3A0xa33e7b9921346aef!2sPar%C3%B3quia%20Menino%20Jesus%20de%20Praga!5e0!3m2!1spt-BR!2sbr!4v1777757480550!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa da Igreja"
                ></iframe>
              </div>
            </div>

            {/* Recepção */}
            <div className="bg-stone-50 rounded-xl overflow-hidden shadow-lg border border-stone-100 flex flex-col">
              <div className="p-8 text-center grow">
                <Calendar className="mx-auto text-rose-400 mb-4" size={32} />
                <h3 className="font-serif text-2xl mb-2">Recepção & Festa</h3>
                <p className="text-stone-500 mb-4 font-medium">Primavera Festas</p>
                <div className="flex items-start justify-center text-stone-600 mb-2">
                  <MapPin className="mr-2 shrink-0 mt-1" size={18} />
                  <p className="text-sm">R. Luis de la Quintana, 1 - 69054-736<br />Parque 10 de Novembro, Manaus - AM</p>
                </div>
                <div className="flex items-center justify-center text-stone-600">
                  <Clock className="mr-2" size={18} />
                  <p className="text-sm">Logo após a cerimônia</p>
                </div>
              </div>
              <div className="h-64 w-full bg-gray-200">
                {/* Embed do Google Maps */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1404.0783563282546!2d-59.999954401923944!3d-3.077946712269351!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x926c1bfced1cf419%3A0xca6efd3ef835ccd7!2sPRIMAVERA%20FESTAS!5e0!3m2!1spt-BR!2sbr!4v1777757761898!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa da Festa"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// TELA 2: MANUAL DOS PADRINHOS
// ==========================================
function PadrinhosScreen() {
  return (
    <div className="pt-24 pb-20 px-4 min-h-screen bg-stone-50 animate-fade-in font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 mt-8">
          <h1 className="font-serif text-5xl mb-4 text-stone-800">Manual dos Padrinhos</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Vocês foram escolhidos a dedo para estarem ao nosso lado no dia mais importante de nossas vidas. Aqui estão algumas informações para brilharem junto conosco!
          </p>
        </div>

        {/* Madrinhas */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 md:p-12 mb-12">
          <h2 className="font-serif text-3xl mb-8 text-center text-rose-500 border-b border-stone-100 pb-4">Para as Madrinhas</h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-medium mb-4 font-serif text-stone-800">O Vestido</h3>
              <p className="text-stone-600 leading-relaxed mb-8">
                Para mantermos a harmonia nas fotos, escolhemos a paleta de tons <strong>Fúcsia, Purple e Pink</strong>. O modelo do vestido é de livre escolha sua, queremos que se sinta linda e confortável! Por favor, optem por vestidos longos.
              </p>

              <h3 className="text-xl font-medium mb-5 font-serif text-stone-800">Nossa Paleta</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#CE1141] shadow-inner border border-stone-200"></div>
                  <p className="text-stone-700"><strong className="text-[#CE1141]">Fúcsia</strong> <span className="text-stone-300 mx-2">—</span> Pantone 214 C</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#DA1884] shadow-inner border border-stone-200"></div>
                  <p className="text-stone-700"><strong className="text-[#DA1884]">Pink</strong> <span className="text-stone-300 mx-2">—</span> Pantone 219 C</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center bg-stone-50 p-6 rounded-2xl border border-stone-100">
              {/* NOTA: Substitua o link do src= abaixo pelo link da sua imagem das madrinhas */}
              <img
                src="./madrinhas.png"
                alt="Inspiração Vestidos Pink"
                className="w-full max-w-75 rounded-lg shadow-md mb-6 object-cover aspect-3/4"
              />
              <span className="font-serif text-2xl tracking-[0.2em] text-stone-700">PINK</span>
            </div>
          </div>
        </div>

        {/* Padrinhos */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 md:p-12 mb-12">
          <h2 className="font-serif text-3xl mb-8 text-center text-slate-500 border-b border-stone-100 pb-4">Para os Padrinhos</h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 flex flex-col items-center bg-stone-50 p-6 rounded-2xl border border-stone-100">
              {/* NOTA: Substitua o link do src= abaixo pelo link da sua imagem dos padrinhos */}
              <img
                src="./padrinhos.png"
                alt="Inspiração Terno Cinza Claro"
                className="w-full max-w-75 rounded-lg shadow-md mb-6 object-cover aspect-3/4"
              />
              <span className="font-serif text-xl tracking-widest text-stone-700 uppercase">Cinza Claro</span>
            </div>

            <div className="order-1 md:order-2">
              <h3 className="text-2xl font-medium mb-4 font-serif text-stone-800">O Traje</h3>
              <p className="text-stone-600 leading-relaxed mb-6">
                Queremos todos muito elegantes! O traje definido é o <strong>Terno Cinza Claro completo</strong> (calça, paletó e gravata).
              </p>
              <ul className="space-y-4 text-stone-600 mb-8">
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-3" size={20} /> Camisa Branca lisa</li>
                <li className="flex items-center"><CheckCircle2 className="text-green-500 mr-3" size={20} /> Sapato branco ou em tons claros</li>
                <li className="flex items-start"><Info className="text-blue-500 mr-3 mt-1 shrink-0" size={20} /> <span className="leading-relaxed">A gravata cinza será nosso presente para você! Entregaremos junto com o convite físico.</span></li>
              </ul>

              <div className="flex items-center gap-4 p-4 bg-stone-100 rounded-xl">
                <div className="w-12 h-12 bg-[#B0B5B9] shadow-inner rounded-md border border-stone-300"></div>
                <div>
                  <p className="font-medium text-stone-800">Cinza Claro</p>
                  <p className="text-sm text-stone-500">Tom de referência principal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TELA 3: INFORMAÇÕES PARA CONVIDADOS
// ==========================================
function ConvidadosScreen() {
  return (
    <div className="pt-24 pb-20 px-4 min-h-screen bg-stone-50 animate-fade-in font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 mt-8">
          <h1 className="font-serif text-5xl mb-4 text-stone-800">Dicas e Informações</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Preparamos com carinho alguns detalhes para que vocês aproveitem ao máximo o nosso grande dia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Dress Code Geral */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" /></svg>
            </div>
            <h2 className="font-serif text-2xl mb-4 text-stone-800">Dress Code</h2>
            <p className="text-stone-600 mb-4 font-medium uppercase tracking-wider text-sm">Traje Esporte Fino / Social</p>
            <p className="text-stone-600 leading-relaxed mb-4">
              Sugerimos trajes elegantes e confortáveis. A cerimônia será na igreja e a festa em um salão fechado e climatizado.
            </p>
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
              <p className="text-sm flex items-start text-stone-700">
                <XCircle className="text-red-400 mr-2 shrink-0 mt-1" size={18} />
                <span><strong>Pedimos a gentileza de evitar o uso da cor branca e de tons muito claros (como off-white, gelo e bege), reservados exclusivamente aos noivos, bem como da cor rosa, que será destinada às madrinhas.</strong></span>
              </p>
            </div>
          </div>

          {/* Dicas Gerais */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-500">
              <Info size={24} />
            </div>
            <h2 className="font-serif text-2xl mb-4 text-stone-800">Dicas Importantes</h2>
            <ul className="space-y-4 text-stone-600">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-stone-300 rounded-full mt-2 mr-3 shrink-0"></div>
                <p><strong>Pontualidade:</strong> A noiva não irá atrasar! Pedimos que cheguem à igreja com 15 minutos de antecedência.</p>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-stone-300 rounded-full mt-2 mr-3 shrink-0"></div>
                <p><strong>Lista de Presentes:</strong> Se desejarem nos presentear, disponibilizamos cotas de lua de mel e itens para nossa casa em nosso site externo.</p>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-stone-300 rounded-full mt-2 mr-3 shrink-0"></div>
                <p><strong>Crianças:</strong> Crianças são muito bem-vindas! Teremos um espaço kids com recreadores durante a festa.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

// Interface (Tipo) para o tempo restante
interface TimeLeft {
  dias: number;
  horas: number;
  min: number;
  seg: number;
}

// Contador Regressivo
function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = +targetDate - +new Date();
    let timeLeft: TimeLeft = { dias: 0, horas: 0, min: 0, seg: 0 };

    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        min: Math.floor((difference / 1000 / 60) % 60),
        seg: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const timerItems = [
    { label: 'Dias', value: timeLeft.dias },
    { label: 'Horas', value: timeLeft.horas },
    { label: 'Min', value: timeLeft.min },
    { label: 'Seg', value: timeLeft.seg },
  ];

  return (
    <div className="flex gap-3 md:gap-6 justify-center drop-shadow-xl font-sans">
      {timerItems.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white w-16 h-16 md:w-24 md:h-24 rounded-lg flex items-center justify-center text-2xl md:text-4xl font-light mb-2">
            {String(item.value).padStart(2, '0')}
          </div>
          <span className="uppercase text-[10px] md:text-xs tracking-widest text-white/90 font-medium">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}


// Formulário de Confirmação (RSVP) CONECTADO AO FIREBASE
function RSVPForm({ conviteData }: { conviteData: ConviteData | null }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [message, setMessage] = useState('');

  // Estado local para controlar os checkboxes na tela
  const [guests, setGuests] = useState<Convidado[]>(conviteData?.convidados || []);

  const toggleGuest = (indexParaAlterar: number) => {
    setGuests(guests.map((g, index) =>
      index === indexParaAlterar ? { ...g, confirmado: !g.confirmado } : g
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verificação de segurança: se não temos os dados do convite, não fazemos nada
    if (!conviteData) return;

    setStatus('submitting');

    try {
      // 2. Referência correta do documento (usando 'convite' no singular como na sua imagem)
      const docRef = doc(db, "convite", conviteData.id);

      // 3. Lógica de Negócio: Contar quantos 'confirmado' estão como true no estado local
      // Isso garante que o campo 'qtdConfirmados' esteja sempre sincronizado com o array
      const contagemConfirmados = guests.filter(g => g.confirmado === true).length;

      // 4. Update Atômico: Atualiza o array completo e o contador no mesmo comando
      await updateDoc(docRef, {
        convidados: guests,            // O array que foi alterado pelos checkboxes
        qtdConfirmados: contagemConfirmados // O novo número calculado
      });

      setStatus('success');
      console.log(`Sucesso! ${contagemConfirmados} pessoas confirmadas para ${conviteData.familia}`);
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      alert("Erro ao salvar. Verifique sua conexão ou permissões do Firebase.");
      setStatus('idle');
    }
  };

  // Se a pessoa acessou sem o "?id=..." na URL
  if (!conviteData) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center w-full">
          <XCircle className="mx-auto text-red-400 mb-4" size={32} />
          <h3 className="font-serif text-2xl mb-2 text-stone-800">Acesso Restrito</h3>
          <p className="text-stone-600">Por favor, acesse esta página através do <strong>link personalizado</strong> que enviamos para o seu WhatsApp.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-stone-100 text-center animate-fade-in font-sans">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-green-500" size={32} />
        </div>
        <h3 className="font-serif text-2xl mb-2 text-stone-800">Confirmação Salva!</h3>
        <p className="text-stone-600 mb-6">Obrigado por responder. Suas escolhas foram registradas com sucesso.</p>

        <div className="bg-stone-50 p-4 rounded-xl text-left border border-stone-200 mb-6">
          <p className="text-sm font-medium text-stone-700 mb-2 uppercase tracking-wider">Resumo:</p>
          <ul className="space-y-2">
            {guests.map((g, idx) => (
              <li key={idx} className="text-sm flex items-center">
                {g.confirmado ? <CheckCircle2 size={16} className="text-green-500 mr-2" /> : <XCircle size={16} className="text-red-400 mr-2" />}
                <span className={g.confirmado ? 'text-stone-800' : 'text-stone-400 line-through'}>{g.nome}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={() => setStatus('idle')} className="text-sm text-stone-500 underline hover:text-stone-800">
          Alterar resposta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center">
      <form onSubmit={handleSubmit} className="w-full bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-stone-100 font-sans">
        <div className="mb-6 text-center border-b border-stone-100 pb-6">
          <p className="text-sm uppercase tracking-widest text-stone-400 mb-2">Convite para</p>
          <h3 className="font-serif text-2xl text-stone-800">{conviteData.familia}</h3>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-4 text-center">
              {guests.length > 1 ? 'Quem estará presente no evento?' : 'Você estará presente no evento?'}
            </label>

            <div className="space-y-3">
              {guests.map((guest, index) => (
                <div
                  key={index}
                  onClick={() => toggleGuest(index)}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${guest.confirmado ? 'border-green-400 bg-green-50' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${guest.confirmado ? 'border-green-500 bg-green-500' : 'border-stone-300 bg-white'}`}>
                    {guest.confirmado && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <span className={`font-medium transition-colors ${guest.confirmado ? 'text-stone-800' : 'text-stone-400 line-through'}`}>
                    {guest.nome}
                  </span>
                  <span className={`ml-auto text-xs font-medium uppercase tracking-wider ${guest.confirmado ? 'text-green-600' : 'text-stone-400'}`}>
                    {guest.confirmado ? 'Confirmado' : 'Não Irá'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Mensagem aos noivos</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deixe uma mensagem aqui (opcional)"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all resize-none bg-stone-50"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-stone-800 hover:bg-stone-900 text-white font-medium py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center uppercase tracking-widest text-sm"
          >
            {status === 'submitting' ? 'Enviando...' : 'Salvar Confirmação'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// TELA 4: LISTA DE PRESENTES
// ==========================================
interface Presente {
  id: string;
  titulo: string;
  valor: number;
  imagemUrl: string;
  isExclusivo?: boolean;
  status?: string;
  lastPaidAt?: number;
}

function PresentesScreen({ conviteData }: { conviteData: ConviteData | null }) {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPresente, setSelectedPresente] = useState<Presente | null>(null);
  const [openedAt, setOpenedAt] = useState(0);

  // Estados do PIX Dinâmico
  const [loadingPix, setLoadingPix] = useState(false);
  const [pixImage, setPixImage] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [pixError, setPixError] = useState('');

  useEffect(() => {
    // Usar onSnapshot para atualizar a tela em tempo real
    const unsubscribe = onSnapshot(collection(db, 'presentes'), (snapshot) => {
      const dados: Presente[] = [];
      snapshot.forEach((docSnap) => {
        dados.push({ id: docSnap.id, ...docSnap.data() } as Presente);
      });
      setPresentes(dados);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar presentes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePresentear = async (presente: Presente) => {
    setSelectedPresente(presente);
    setModalOpen(true);
    setLoadingPix(true);
    setPixImage(null);
    setPixPayload(null);
    setPixError('');
    setOpenedAt(Date.now());

    try {
      let nomeConvidado = new URLSearchParams(window.location.search).get('id');
      if (!nomeConvidado || nomeConvidado === 'admin' || nomeConvidado === 'admin.html') {
        nomeConvidado = "Convidado do Casamento";
      } else {
        // Converte "familia-lameira" em "Familia Lameira"
        nomeConvidado = nomeConvidado.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }

      const res = await fetch('/api/createPix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: Number(presente.valor),
          titulo: presente.titulo,
          presenteId: presente.id,
          nomeConvidado: nomeConvidado
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }

      setPixImage(data.qrCodeImage);
      setPixPayload(data.pixPayload);
    } catch (err: any) {
      console.error(err);
      setPixError(err.message || 'Não foi possível gerar o PIX no momento. Tente novamente mais tarde.');
    } finally {
      setLoadingPix(false);
    }
  };

  const copiarPix = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      alert("Chave PIX copiada! Agora é só colar no app do seu banco.");
    }
  };

  return (
    <>
      <div className="pt-24 pb-20 px-4 min-h-screen bg-stone-50 animate-fade-in font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 mt-8">
            <h1 className="font-serif text-5xl mb-4 text-stone-800">Lista de Presentes</h1>
            <p className="text-stone-600 max-w-2xl mx-auto">
              O maior presente é ter vocês com a gente neste dia! Mas se quiserem nos abençoar com algo a mais para nossa vida a dois, criamos essa listinha simbólica.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
            </div>
          ) : presentes.length === 0 ? (
            <div className="text-center text-stone-500 p-12 bg-white rounded-2xl shadow-sm border border-stone-200">
              A lista de presentes ainda está sendo preparada. Volte em breve!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {presentes.filter(presente => {
                const titleLower = (presente.titulo || '').toLowerCase();
                if (titleLower.includes('primeiro casal de padrinhos') || titleLower.includes('casal de padrinhos')) {
                  return conviteData?.categoria === 'padrinho' || conviteData?.categoria === 'madrinha';
                }
                return true;
              }).map(presente => {
                const titleLower = (presente.titulo || '').toLowerCase();
                const isExclusivo = presente.isExclusivo ||
                  titleLower.includes('pedir') ||
                  titleLower.includes('padrinho') ||
                  titleLower.includes('buffet');
                const isVendido = isExclusivo && presente.status === 'vendido';

                return (
                  <div key={presente.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
                    {isVendido && (
                      <div className="absolute top-4 right-4 bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg uppercase tracking-wider">
                        Esgotado
                      </div>
                    )}
                    <div className="h-48 overflow-hidden bg-stone-100 relative">
                      <img src={presente.imagemUrl} alt={presente.titulo} className={`w-full h-full object-cover transition-transform duration-500 ${isVendido ? 'grayscale opacity-70' : 'hover:scale-105'}`} />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className={`font-semibold mb-2 ${isVendido ? 'text-stone-400' : 'text-stone-800'}`}>{presente.titulo}</h3>
                      <p className={`${isVendido ? 'text-stone-400' : 'text-rose-500'} font-medium mt-auto mb-4 text-lg`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(presente.valor)}
                      </p>
                      <button
                        onClick={() => handlePresentear(presente)}
                        disabled={isVendido}
                        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${isVendido ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-stone-800 text-white hover:bg-stone-900'}`}
                      >
                        {isVendido ? 'Já Comprado' : 'Presentear'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal PIX */}
      {modalOpen && selectedPresente && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative animate-fade-in shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <XCircle size={24} />
            </button>

            {(() => {
              const currentP = presentes.find(p => p.id === selectedPresente.id);
              const isPaidNow = currentP && currentP.lastPaidAt && currentP.lastPaidAt > openedAt;
              return isPaidNow ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-green-500 w-12 h-12" />
                  </div>
                  <h2 className="font-serif text-3xl mb-4 text-stone-800">Pagamento Confirmado!</h2>
                  <p className="text-stone-600 mb-8 text-lg">
                    Muito obrigado por nos presentear com <strong>"{selectedPresente.titulo}"</strong>. Ficamos imensamente felizes com o seu carinho!
                  </p>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full bg-stone-800 hover:bg-stone-900 text-white font-medium py-4 rounded-xl transition-all shadow-md"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="text-rose-400" size={32} />
                  </div>
                  <h2 className="font-serif text-2xl mb-2 text-stone-800">Muito Obrigado!</h2>
                  <p className="text-stone-600 mb-6 text-sm">
                    Para presentear com <strong>"{selectedPresente.titulo}"</strong>, faça um PIX no valor abaixo usando a função "Copia e Cola" do seu banco.
                  </p>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 mb-6 text-center space-y-4 shadow-inner">
                    {loadingPix ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-400 mb-4"></div>
                        <p className="text-stone-500 text-sm">Gerando seu PIX...</p>
                      </div>
                    ) : pixError ? (
                      <div className="text-red-500 text-sm py-4">{pixError}</div>
                    ) : pixImage ? (
                      <div className="flex flex-col items-center">
                        <img src={`data:image/png;base64,${pixImage}`} alt="QR Code PIX" className="w-48 h-48 rounded-lg shadow-sm mb-4" />
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Valor do Presente</p>
                          <p className="font-medium text-rose-500 text-2xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPresente.valor)}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {pixPayload && (
                    <button
                      onClick={copiarPix}
                      className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors mb-3 shadow-md"
                    >
                      Copiar Chave PIX
                    </button>
                  )}
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  );
}