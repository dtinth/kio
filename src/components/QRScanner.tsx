import { Icon } from "@iconify-icon/react";
import { useStore } from "@nanostores/react";
import { useEffect, useRef, useState } from "react";
import { $scanning } from "./QRScannerState";

export function QRScanner() {
  const scanning = useStore($scanning);
  return (
    <>
      <button
        className="fixed top-3 right-3 opacity-0 hover:opacity-100 focus-within:opacity-100 z-40"
        onClick={() => $scanning.set(!$scanning.get())}
      >
        <Icon icon="material-symbols:qr-code" />
      </button>
      {scanning && (
        <DraggablePanel>
          <iframe
            src={
              "https://qr.spacet.me/?action=scan&fit=cover&delay=100&post=parent"
            }
            allow="camera"
            width={96}
            height={96}
            className="-scale-x-100"
          ></iframe>
        </DraggablePanel>
      )}
    </>
  );
}

function DraggablePanel({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      setPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    if (panelRef.current) {
      panelRef.current.setPointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={panelRef}
      className="z-30"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        backgroundColor: "#353433",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        borderRadius: "2px",
        padding: "4px",
      }}
      onPointerDown={handlePointerDown}
    >
      {children}
      <div
        style={{ cursor: "move", marginBottom: "2px" }}
        className="absolute top-2 left-2 text-white z-10 opacity-0 hover:opacity-100"
      >
        <Icon icon="mdi:drag" />
      </div>
    </div>
  );
}
