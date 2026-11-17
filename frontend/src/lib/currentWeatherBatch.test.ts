import { test } from "node:test";
import assert from "node:assert/strict";
import type { BatchCurrentWeatherItemDto, CurrentWeatherDto } from "./api.ts";
import { currentWeatherBatchQueryKey, currentWeatherQueryKey, toCurrentWeatherEntries } from "./currentWeatherBatch.ts";

function weather(temperatureC: number): CurrentWeatherDto {
  return {
    time: "2026-11-17T12:00",
    temperatureC,
    apparentTemperatureC: temperatureC,
    windSpeedKmh: 10,
    windDirectionDeg: 180,
    precipitationMm: 0,
    weatherCode: 0,
    isDay: true,
  };
}

test("batch results land under the same keys the single-location queries use", () => {
  const items: BatchCurrentWeatherItemDto[] = [
    { latitude: 52.23, longitude: 21.01, weather: weather(5) },
    { latitude: 51.11, longitude: 17.03, weather: weather(7) },
  ];

  assert.deepEqual(toCurrentWeatherEntries(items), [
    [currentWeatherQueryKey(52.23, 21.01), weather(5)],
    [currentWeatherQueryKey(51.11, 17.03), weather(7)],
  ]);
  assert.deepEqual(currentWeatherQueryKey(52.23, 21.01), ["current-weather", 52.23, 21.01]);
});

test("each result is keyed by its echoed coordinates, whatever the response order", () => {
  const items: BatchCurrentWeatherItemDto[] = [
    { latitude: 51.11, longitude: 17.03, weather: weather(7) },
    { latitude: 52.23, longitude: 21.01, weather: weather(5) },
  ];

  const byKey = new Map(toCurrentWeatherEntries(items).map(([key, value]) => [key.join("|"), value]));
  assert.equal(byKey.get(currentWeatherQueryKey(52.23, 21.01).join("|"))?.temperatureC, 5);
  assert.equal(byKey.get(currentWeatherQueryKey(51.11, 17.03).join("|"))?.temperatureC, 7);
});

test("the batch query key changes when the set of favorites changes", () => {
  const two = currentWeatherBatchQueryKey([
    { latitude: 52.23, longitude: 21.01 },
    { latitude: 51.11, longitude: 17.03 },
  ]);
  const three = currentWeatherBatchQueryKey([
    { latitude: 52.23, longitude: 21.01 },
    { latitude: 51.11, longitude: 17.03 },
    { latitude: 50.06, longitude: 19.94 },
  ]);

  assert.deepEqual(two, ["current-weather-batch", "52.23,21.01", "51.11,17.03"]);
  assert.notDeepEqual(two, three);
});
