import { SystemStatus } from "./SystemStatus";

export function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">ClaimSathi</h1>
      <SystemStatus />
    </main>
  );
}
