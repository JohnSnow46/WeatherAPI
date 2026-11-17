import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, getCurrentWeatherBatch } from "./api.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(response: Response) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return response;
  }) as typeof fetch;
  return calls;
}

test("getCurrentWeatherBatch POSTs every location as JSON in one request", async () => {
  const calls = stubFetch(new Response("[]", { status: 200 }));
  const locations = [
    { latitude: 52.23, longitude: 21.01 },
    { latitude: 51.11, longitude: 17.03 },
  ];

  await getCurrentWeatherBatch(locations);

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/api\/weather\/current\/batch$/);
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(calls[0].init?.headers, { "Content-Type": "application/json" });
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), locations);
  assert.ok(calls[0].init?.signal, "the request keeps the client-side timeout");
});

test("getCurrentWeatherBatch surfaces the API's validation message as an ApiError", async () => {
  stubFetch(
    new Response(JSON.stringify({ title: "Bad Request", detail: "A batch request supports at most 10 locations." }), {
      status: 400,
    }),
  );

  await assert.rejects(getCurrentWeatherBatch([]), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 400);
    assert.equal(error.message, "A batch request supports at most 10 locations.");
    return true;
  });
});

test("getCurrentWeatherBatch falls back to a status message when the error body is not JSON", async () => {
  stubFetch(new Response("upstream down", { status: 503 }));

  await assert.rejects(getCurrentWeatherBatch([{ latitude: 1, longitude: 2 }]), {
    name: "ApiError",
    message: "Request failed with status 503",
  });
});
