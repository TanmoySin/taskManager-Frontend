import { toast, type ToastOptions } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions,
  ) => {
    return toast.promise(
      promise,
      {
        pending: messages.pending,
        success: messages.success,
        error: messages.error,
      },
      { ...defaultOptions, ...options },
    );
  },
};

// Confirmation dialog replacement
export const confirmAction = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message); // Keep confirm for now, we'll enhance later
    resolve(confirmed);
  });
};
