import { it, expect } from "vitest";
import { youtubeVideoId } from "../../src/modules/site-settings/domain/ulujam";
it("YouTube bağlantılarından yalnız izinli sunucu ve geçerli video kimliğini alır", () => {
  for (const url of [
    "https://youtu.be/_ECGC1V__xo",
    "https://www.youtube.com/watch?v=_ECGC1V__xo&t=30",
    "https://www.youtube.com/shorts/_ECGC1V__xo",
    "https://www.youtube-nocookie.com/embed/_ECGC1V__xo",
  ])
    expect(youtubeVideoId(url)).toBe("_ECGC1V__xo");
  for (const url of [
    "http://youtube.com/watch?v=_ECGC1V__xo",
    "https://youtube.com.evil.test/watch?v=_ECGC1V__xo",
    "https://youtube.com@evil.test/watch?v=_ECGC1V__xo",
    "javascript:alert(1)",
    "https://youtu.be/invalid",
    "https://user:pass@youtube.com/watch?v=_ECGC1V__xo",
  ])
    expect(youtubeVideoId(url)).toBeNull();
});
