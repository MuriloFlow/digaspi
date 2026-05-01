"use client";

type Props = {
  message: string;
  onConfirm: () => void;
  className: string;
  children: React.ReactNode;
};

export function ConfirmButton({ message, onConfirm, className, children }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {children}
    </button>
  );
}
