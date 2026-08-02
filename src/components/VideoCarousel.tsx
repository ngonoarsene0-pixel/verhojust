import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

/**
 * Video Carousel — displays a rotating set of video clips.
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
            className="w-full h-full object-contain bg-black"
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
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 hover:bg-white/30 hover:scale-110 transition-all">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>
          )}

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 pointer-events-none">
            <h3 className="font-display text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {videos[activeIndex].title}
            </h3>
            <p className="text-white/80 text-sm md:text-lg max-w-xl drop-shadow-lg">
              {videos[activeIndex].subtitle}
            </p>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots indicator */}
        <div className="absolute bottom-4 right-6 flex gap-2">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {videos.map((v, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`relative rounded-xl overflow-hidden aspect-video transition-all bg-black ${
              i === activeIndex
                ? "ring-2 ring-primary-500 ring-offset-2"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <video
              src={v.src}
              className="w-full h-full object-contain"
              preload="metadata"
              muted
            />
            <div className="absolute inset-0 bg-black/30 flex items-end p-2">
              <p className="text-xs font-semibold text-white drop-shadow line-clamp-1">
                {v.title}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}