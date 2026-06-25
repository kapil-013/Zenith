import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 right-0 sm:right-6 z-[100] flex flex-col gap-3 pointer-events-none px-4 sm:px-0 w-full sm:w-auto items-center sm:items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-center gap-3 py-3 px-4 bg-[#e9eef5] rounded-2xl shadow-[6px_6px_12px_#b8bec5,-6px_-6px_12px_#ffffff] border border-white/50 w-full sm:w-[350px]"
            >
              <div
                className={`p-2 rounded-full shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff] ${toast.type === "success" ? "text-green-500 bg-green-50" : toast.type === "error" ? "text-red-500 bg-red-50" : "text-blue-500 bg-blue-50"}`}
              >
                {toast.type === "success" && (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                {toast.type === "error" && (
                  <AlertTriangle className="h-5 w-5" />
                )}
                {toast.type === "info" && <Info className="h-5 w-5" />}
              </div>
              <p className="flex-1 text-sm font-bold text-slate-700">
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
