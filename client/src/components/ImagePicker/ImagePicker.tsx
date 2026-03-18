import { useRef, type ChangeEvent } from "react";

interface ImagePickerProps {
  preview: string;
  onPick: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  previewSize?: number;
}

const ImagePicker = ({ preview, onPick, onClear, previewSize = 64 }: ImagePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file, URL.createObjectURL(file));
  };

  return (
    <div className="d-flex align-items-center gap-2">
      {preview && (
        <div className="position-relative">
          <img
            src={preview}
            alt="Preview"
            className="rounded-3"
            style={{ width: previewSize, height: previewSize, objectFit: "cover" }}
          />
          {onClear && (
            <button
              type="button"
              className="btn btn-sm position-absolute top-0 end-0 p-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 20, height: 20, marginTop: -6, marginRight: -6 }}
              onClick={onClear}
            >
              <i className="bi bi-x" style={{ fontSize: "0.7rem" }}></i>
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => inputRef.current?.click()}
      >
        <i className="bi bi-camera me-1"></i>
        {preview ? "Change Photo" : "Add Photo"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} hidden />
    </div>
  );
};

export default ImagePicker;
