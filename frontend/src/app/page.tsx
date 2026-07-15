import { WeatherDashboard } from "@/components/WeatherDashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full flex-1 flex-col items-center">
        <WeatherDashboard />
      </main>
    </div>
  );
}
