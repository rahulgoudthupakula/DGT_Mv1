import { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const FloatingAIButton = () => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 }); // distance from right/bottom
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    didDrag.current = false;
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    didDrag.current = true;
    const btnSize = 56;
    const newX = window.innerWidth - (e.clientX - dragOffset.current.x + btnSize);
    const newY = window.innerHeight - (e.clientY - dragOffset.current.y + btnSize);
    setPosition({
      x: Math.max(8, Math.min(newX, window.innerWidth - btnSize - 8)),
      y: Math.max(8, Math.min(newY, window.innerHeight - btnSize - 8)),
    });
  }, [dragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleClick = () => {
    if (!didDrag.current) setOpen((v) => !v);
  };

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-3"
      style={{ right: position.x, bottom: position.y }}
    >
      {open && (
        <div className="w-80 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Gemini AI Assistant</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4 h-64 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Ask me anything about your store…
            </div>
            <div className="flex gap-2 mt-2">
              <Input placeholder="Type a message…" className="text-sm h-9" />
              <Button size="sm" className="h-9 px-3 shrink-0">Send</Button>
            </div>
          </div>
        </div>
      )}

      <button
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        className={`group relative h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 transition-shadow duration-300 hover:scale-105 active:scale-95 flex items-center justify-center select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-violet-400 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Sparkles className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
        <div className="absolute inset-0 rounded-full animate-ping bg-violet-400/20 pointer-events-none" style={{ animationDuration: "3s" }} />
      </button>
    </div>
  );
};
