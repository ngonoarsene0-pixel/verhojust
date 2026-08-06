import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

/**
 * Video Carousel — displays a rotating set of video clips with fullscreen mode on click,
 * including navigation controls directly inside the fullscreen view.
 */
const videos = [
  {
    src: "/images/WhatsApp Video 2025-12-24 at 11.00.12.mp4",
    title: "Épices et Piments VERHOJUST",
    subtitle: "Découvrez notre sélection authentique et de qualité supérieure",
  },
  {
    src: "/images/WhatsApp Video 2025-12-24 at 11.00.13.mp4",
    title: "Saveurs Authentiques",
    subtitle: "Des produits traditionnels pour sublimer votre cuisine au quotidien",
  },
  {
    src: "/images/WhatsApp Video 2025-12-24 at 11.00.16.mp4",
    title: "Qualité et Fraîcheur",
    subtitle: "Le meilleur du terroir directement préparé pour vous",
  },
  {
    src: "/images/WhatsApp Video 2025-12-24 at 11.00.12.mp4",
    title: "L'Expérience VERHOJUST",
    subtitle: "Partagez la passion des bonnes saveurs",
  },
];

export default function VideoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const goTo = (index: number) => {
    const newIndex = index < 0 ? videos.length - 1 : index >= videos.length ? 0 : index;
    setActiveIndex(newIndex);
  };

  // Clic direct sur la vidéo du carrousel -> Ouvre le plein écran
  const handleVideoClick = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.muted = true;
    }
    setIsFullscreen(true);
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            L'univers VERHOJUST en vidéo
          </h2>
          <p className="text-neutral-500">Plongez dans notre monde d'épices et de saveurs</p>
        </div>

        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 group">
          {/* Video container - Clicable partout pour ouvrir le plein écran */}
          <div 
            className="relative aspect-video cursor-pointer"
            onClick={handleVideoClick}
          >
            <video
              ref={videoRef}
              src={videos[activeIndex].src}
              className="w-full h-full object-contain bg-black pointer-events-none"
              preload="metadata"
              playsInline
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Indicateur visuel "Agrandir" au survol */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 shadow-xl">
                <Maximize2 className="w-7 h-7 md:w-9 md:h-9 text-white" />
              </div>
            </div>

            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 pointer-events-none">
              <h3 className="font-display text-lg sm:text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 drop-shadow-lg line-clamp-1">
                {videos[activeIndex].title}
              </h3>
              <p className="text-white/80 text-xs sm:text-sm md:text-lg max-w-xl drop-shadow-lg line-clamp-2">
                {videos[activeIndex].subtitle}
              </p>
            </div>

            {/* Navigation arrows (empêchent l'ouverture du plein écran au clic) */}
            <button
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/40 md:bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/40 md:bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="absolute bottom-3 right-4 md:bottom-4 md:right-6 flex gap-1.5 md:gap-2 z-10">
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`h-1.5 md:h-2 rounded-full transition-all ${
                  i === activeIndex
                    ? "w-6 md:w-8 bg-white"
                    : "w-1.5 md:w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* MODAL / PLEIN ÉCRAN AVEC NAVIGATION INTÉGRÉE */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          {/* Bouton Retour (Croix) pour fermer */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all z-50 shadow-lg cursor-pointer"
            title="Retour à la page"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Titre en haut en mode plein écran */}
          <div className="absolute top-6 left-6 right-20 text-white z-40 pointer-events-none">
            <h3 className="font-display text-lg md:text-2xl font-bold truncate">
              {videos[activeIndex].title}
            </h3>
            <p className="text-white/70 text-xs md:text-sm truncate">
              {videos[activeIndex].subtitle}
            </p>
          </div>

          {/* Conteneur de la vidéo en plein écran avec flèches de zapping intégrées */}
          <div className="relative w-full max-w-5xl max-h-[80vh] flex items-center justify-center">
            <video
              key={videos[activeIndex].src}
              src={videos[activeIndex].src}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              controls
              autoPlay
              playsInline
            />

            {/* Bouton Précédent en plein écran */}
            <button
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 md:left-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all z-40 shadow-lg"
              title="Vidéo précédente"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            {/* Bouton Suivant en plein écran */}
            <button
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 md:right-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all z-40 shadow-lg"
              title="Vidéo suivante"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>

          {/* Indicateurs de position en bas du plein écran */}
          <div className="absolute bottom-6 flex gap-2 z-40">
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}