import { BASE_URL } from "../constants";

// Silly, but can't be bothered to set up environment variables yet
it("Should point at stately.ai", () => {
  expect(BASE_URL).toBe("https://stately.ai");
});
