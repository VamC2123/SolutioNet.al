import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "sonner";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NextUIProvider>
      <App />
      <Toaster position="bottom-right" />
    </NextUIProvider>
  </StrictMode>
);
