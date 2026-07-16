import { WeatherDashboard } from "@/components/WeatherDashboard";

export default function Home() {
  return (
    <div
      className="flex flex-1 flex-col items-center"
      style={{
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, var(--accent-glow), transparent 70%)",
        backgroundColor: "var(--page)",
      }}
    >
      <main className="flex w-full flex-1 flex-col items-center">
        <header className="flex flex-col items-center gap-1 pt-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">WeatherMap</h1>
          <p className="text-sm text-ink-secondary">Live weather, forecast, and radar for any location.</p>
        </header>
        <WeatherDashboard />
      </main>
    </div>
  );
}
