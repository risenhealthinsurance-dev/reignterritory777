import { describe, expect, it } from "vitest";
import { extractVoiceDisposition } from "./voiceDisposition";

describe("voice disposition extraction", () => {
  it("extracts a reloop contact and day", () => {
    expect(extractVoiceDisposition("Owner: Sarah Lee will be there Thursday morning")).toMatchObject({ disposition: "reloop", contactName: "Sarah Lee", dayOrWindow: "Thursday morning" });
  });
  it("maps not interested to lost and decision language to waiting", () => {
    expect(extractVoiceDisposition("Not interested").disposition).toBe("lost");
    expect(extractVoiceDisposition("They need to think it over").disposition).toBe("waiting_on_decision");
  });
});
