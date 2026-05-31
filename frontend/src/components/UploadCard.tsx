import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { motion } from "framer-motion";

interface UploadCardProps {
  previewUrl: string | null;
  analyzing: boolean;
  compact?: boolean;
  onFileAccepted: (file: File) => void;
  onAnalyze: () => void;
  onReset: () => void;
}

export default function UploadCard({
  previewUrl,
  analyzing,
  compact = false,
  onFileAccepted,
  onAnalyze,
  onReset,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const acceptFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please upload a JPG, PNG, or WEBP food image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLocalError("The image is larger than 8 MB. Please choose a smaller file.");
      return;
    }
    setLocalError(null);
    onFileAccepted(file);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <motion.div
      id="scan"
      className={`upload-card ${compact ? "upload-card-compact" : ""}`}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <div className="upload-heading">
        <span className="eyebrow">AI FOOD SCANNER</span>
        <span className="tiny-pill">PHOTO → INSIGHTS</span>
      </div>
      <div
        className={`drop-zone ${dragging ? "drop-zone-dragging" : ""} ${previewUrl ? "drop-zone-preview" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={handleInput} hidden />
        {previewUrl ? (
          <img src={previewUrl} alt="Uploaded food preview" className="upload-preview" />
        ) : (
          <>
            <div className="plate-icon">
              <div className="plate-center">+</div>
            </div>
            <strong>Drop your dish here</strong>
            <span>or click to browse your photos</span>
            <small>JPG, PNG or WEBP · max 8 MB</small>
          </>
        )}
      </div>
      {localError && <p className="inline-error">{localError}</p>}
      <div className="upload-actions">
        <button className="button button-primary" onClick={onAnalyze} disabled={!previewUrl || analyzing}>
          {analyzing ? (
            <span className="food-loader" aria-label="Analyzing">
              <i />
              <i />
              <i />
              Analyzing plate
            </span>
          ) : (
            "Analyze My Meal"
          )}
        </button>
        {previewUrl && (
          <button className="button button-ghost" onClick={onReset} disabled={analyzing}>
            Reset
          </button>
        )}
      </div>
    </motion.div>
  );
}
