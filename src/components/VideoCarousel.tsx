import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Maximize2, X } from "lucide-react";

/**
 * Video Carousel — displays a rotating set of video clips with fullscreen mode.
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const goTo = (index: number) => {
    const newIndex = index < 0 ? videos.length - 1 : index >= videos.length ? 0 : index;
    setActiveIndex(newIndex);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    goTo(activeIndex + 1);
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
          {/* Video container */}
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              src={videos[activeIndex].src}
              className="w-full h-full object-contain bg-black cursor-pointer"
              onEnded={handleVideoEnd}
              onClick={togglePlay}
              playsInline
              preload="metadata"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Play button overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center transition-opacity"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 hover:bg-white/30 hover:scale-110 transition-all">
                  <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="white" />
                </div>
              </button>
            )}

            {/* Fullscreen trigger button */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all z-10"
              title="Agrandir en plein écran"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 pointer-events-none">
              <h3 className="font-display text-lg sm:text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 drop-shadow-lg line-clamp-1">
                {videos[activeIndex].title}
              </h3>
              <p className="text-white/80 text-xs sm:text-sm md:text-lg max-w-xl drop-shadow-lg line-clamp-2">
                {videos[activeIndex].subtitle}
              </p>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/40 md:bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/40 md:bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="absolute bottom-3 right-4 md:bottom-4 md:right-6 flex gap-1.5 md:gap-2">
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
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

      {/* MODAL / PLEIN ÉCRAN */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          {/* Bouton Croix pour fermer */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all z-50 shadow-lg"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Titre en haut en mode plein écran */}
          <div className="absolute top-6 left-6 right-20 text-white z-40 pointer-events-none">
            <h3 className="font-display text-lg md:text-2xl font-bold truncate">
              {videos[activeIndex].title}
            </h3>
          </div>

          {/* Vidéo plein écran */}
          <div className="w-full max-w-5xl max-h-[80vh] flex items-center justify-center">
            <video
              src={videos[activeIndex].src}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </>
  );
}