import { lazy, Suspense, useState } from "react";
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomeScreen } from "./components/HomeScreen";
// The home page loads first; the other pages are fetched only when someone opens them.
const CaseScreen = lazy(() => import("./components/CaseScreen").then((m) => ({ default: m.CaseScreen })));
const HelpdeskScreen = lazy(() => import("./components/HelpdeskScreen").then((m) => ({ default: m.HelpdeskScreen })));
const RulesScreen = lazy(() => import("./components/RulesScreen").then((m) => ({ default: m.RulesScreen })));
import type { Language } from "./lib/i18n";

interface AppContentProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

function AppContent({ language, setLanguage }: AppContentProps) {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
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
          path="/case/:token/:section"
          element={<CaseScreen language={language} onLanguageChange={setLanguage} />}
        />
        <Route
          path="/rules"
          element={<RulesScreen language={language} onLanguageChange={setLanguage} />}
        />
        <Route
          path="/helpdesk"
          element={<HelpdeskScreen language={language} onLanguageChange={setLanguage} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
