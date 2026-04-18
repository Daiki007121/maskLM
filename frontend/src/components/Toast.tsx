import * as Icon from "./Icons";

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="toast-wrap">
      <div className="toast liquid liquid-strong">
        <Icon.Check />
        <span>{message}</span>
      </div>
    </div>
  );
}
