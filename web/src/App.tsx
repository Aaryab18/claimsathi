import { useState } from "react";
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomeScreen } from "./components/HomeScreen";
import { CaseScreen } from "./components/CaseScreen";
import { HelpdeskScreen } from "./components/HelpdeskScreen";
import type { Language } from "./lib/i18n";

interface AppContentProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

function AppContent({ language, setLanguage }: AppContentProps) {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomeScreen language={language} onLanguageChange={setLanguage} />}
      />
      <Route
        path="/case/:token"
        element={<CaseScreen language={language} onLanguageChange={setLanguage} />}
      />
      <Route
        path="/helpdesk"
        element={<HelpdeskScreen language={language} onLanguageChange={setLanguage} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

interface AppProps {
  initialEntries?: string[];
}

export function App({ initialEntries }: AppProps) {
  const [language, setLanguage] = useState<Language>("en");

  if (initialEntries && initialEntries.length > 0) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AppContent language={language} setLanguage={setLanguage} />
      </MemoryRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppContent language={language} setLanguage={setLanguage} />
    </BrowserRouter>
  );
}
