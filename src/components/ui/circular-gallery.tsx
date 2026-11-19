import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';
import { X, ArrowRight, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  description?: string;
  badge?: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by?: string;
  };
}

// Define the props for the CircularGallery component
export interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
  onSelect?: (item: GalleryItem) => void;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 520, autoRotateSpeed = 0.035, onSelect, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragStartRotation = useRef(0);
    const hasDraggedRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    // Auto-rotation effect
    useEffect(() => {
      const autoRotate = () => {
        if (!isHovered && !selectedItem && !isDragging) {
          setRotation((prev) => (prev + autoRotateSpeed) % 360);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isHovered, selectedItem, isDragging, autoRotateSpeed]);

    // Handle drag / touch rotation
    const handlePointerDown = (e: React.PointerEvent) => {
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartRotation.current = rotation;
      hasDraggedRef.current = false;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Fallback if pointer capture is not supported
      }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartX.current;
      if (Math.abs(deltaX) > 6) {
        hasDraggedRef.current = true;
      }
      setRotation(dragStartRotation.current + deltaX * 0.25);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    };

    const handleCardClick = (item: GalleryItem) => {
      // If the user was dragging to rotate the wheel, do not open the modal!
      if (hasDraggedRef.current) return;
      setSelectedItem(item);
      if (onSelect) onSelect(item);
    };

    const handleCloseModal = () => {
      setSelectedItem(null);
    };

    const spinLeft = (e: React.MouseEvent) => {
      e.stopPropagation();
      setRotation((prev) => prev - 360 / items.length);
    };

    const spinRight = (e: React.MouseEvent) => {
      e.stopPropagation();
      setRotation((prev) => prev + 360 / items.length);
    };

    const anglePerItem = 360 / items.length;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn(
          "relative w-full h-[620px] flex items-center justify-center select-none overflow-hidden cursor-grab active:cursor-grabbing",
          className
        )}
        style={{ perspective: '2000px', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={() => {
          setIsDragging(false);
          setIsHovered(false);
        }}
        onPointerEnter={() => setIsHovered(true)}
        {...props}
      >
        {/* Navigation Arrows for effortless spinning */}
        <button
          type="button"
          onClick={spinLeft}
          className="absolute left-3 sm:left-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-[#3e6b35]/60 backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"
          aria-label="Previous therapy"
        >
          <ChevronLeft className="w-5 h-5 text-[#a2e283]" />
        </button>

        <button
          type="button"
          onClick={spinRight}
          className="absolute right-3 sm:right-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-[#3e6b35]/60 backdrop-blur-md shadow-2xl transition-all hover:scale-110 active:scale-95"
          aria-label="Next therapy"
        >
          <ChevronRight className="w-5 h-5 text-[#a2e283]" />
        </button>

        {/* Helper instruction badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-xs tracking-wider uppercase bg-[#182a17]/90 text-[#a0c888] px-4 py-1.5 rounded-full border border-[#2e5229]/60 backdrop-blur-md shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7ec45b] animate-pulse" />
          Drag or click arrows to spin • Click card to view details
        </div>

        {/* 3D Carousel Cylinder */}
        <div
          className="relative w-full h-full pointer-events-auto"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = ((rotation % 360) + 360) % 360;
            const relativeAngle = ((itemAngle + totalRotation) % 360 + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.25, 1 - normalizedAngle / 130);
            const isFront = normalizedAngle < 50;

            return (
              <div
                key={item.common + i}
                role="button"
                tabIndex={0}
                aria-label={`View ${item.common}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(item);
                }}
                className={cn(
                  "absolute w-[280px] sm:w-[320px] h-[400px] sm:h-[440px] cursor-pointer group transition-all duration-300",
                  isFront ? "z-10" : "z-0"
                )}
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-150px',
                  marginTop: '-210px',
                  opacity: opacity,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-[#2f4f29]/50 bg-[#121c10]/80 backdrop-blur-xl group-hover:scale-105 group-hover:border-[#7ec45b] group-hover:shadow-[0_0_35px_rgba(126,196,91,0.35)] transition-all duration-300">
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100 select-none pointer-events-none"
                    style={{ objectPosition: item.photo.pos || 'center' }}
                  />
                  {/* Subtle top badge */}
                  {item.badge && (
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-black/60 text-[#a0c888] border border-[#a0c888]/30 backdrop-blur-md">
                      {item.badge}
                    </div>
                  )}

                  {/* Gradient overlay and text */}
                  <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#080d07] via-[#080d07]/80 to-transparent text-white pointer-events-none">
                    <h3 className="text-xl font-bold tracking-tight text-[#e8f2e4] group-hover:text-[#a5e084] transition-colors">
                      {item.common}
                    </h3>
                    <p className="text-xs font-medium text-[#9fc095] mt-1">{item.binomial}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[#7ec45b] mt-3 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Explore treatment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Modal Dialog */}
        {selectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={handleCloseModal}
          >
            <div
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0d160c] border border-[#355b2d] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] p-6 text-white text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Therapy Photo */}
              <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden mb-5 border border-white/10 relative">
                <img
                  src={selectedItem.photo.url}
                  alt={selectedItem.common}
                  draggable={false}
                  className="w-full h-full object-cover select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d160c] via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#213f1d]/90 text-[#a2e283] border border-[#7ec45b]/40 backdrop-blur-md">
                  AYUSH Certified Treatment
                </span>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-3xl font-bold text-[#e6f4e1] tracking-tight">
                {selectedItem.common}
              </h2>
              <p className="text-sm font-semibold text-[#8ac477] mt-1 mb-4">
                Target: {selectedItem.binomial}
              </p>

              {/* Full Detailed Paragraph */}
              <div className="text-sm sm:text-base text-[#c7d8c3] leading-relaxed mb-6 space-y-3">
                <p>{selectedItem.description}</p>
                <p className="text-xs text-[#8ca884] italic">
                  * Administered at Divya Arogyam, 3rd Floor, Aditya City Center, Patna by Dr. Sudhir Kumar (BNYS, MD Acup.).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                <a
                  href={`https://wa.me/916203315830?text=${encodeURIComponent(
                    `Hello Dr. Sudhir Kumar / Divya Arogyam, I am interested in ${selectedItem.common} for ${selectedItem.binomial}. Please share consultation details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-sm transition-all shadow-lg shadow-[#25d366]/20"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Book on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#d8e6d4] font-medium text-sm transition-colors border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
