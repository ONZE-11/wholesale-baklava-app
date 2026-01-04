"use client";

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  destructive,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-3 py-2 rounded border hover:bg-gray-50" onClick={onCancel}>
            {cancelText}
          </button>

          <button
            className={`px-3 py-2 rounded text-white hover:opacity-90 ${
              destructive ? "bg-red-600" : "bg-black"
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
