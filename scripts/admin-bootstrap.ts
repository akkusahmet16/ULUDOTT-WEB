import { parseArgs } from "node:util";
import { Secret, TOTP } from "otpauth";
import { bootstrapAdmin } from "../src/modules/admin/application/bootstrap-admin.ts";
import { closeDatabase } from "../src/lib/database/client.ts";
import { roles } from "../src/modules/admin/domain/permissions.ts";

function ask(prompt: string, hidden = false): Promise<string> {
  process.stdout.write(prompt);
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    function done(error?: Error) {
      process.stdin.off("data", receive);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    }
    function receive(chunk: string) {
      for (const char of chunk) {
        if (char === "\u0003") {
          done(new Error("Kurulum iptal edildi"));
          return;
        }
        if (char === "\r" || char === "\n") {
          done();
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value) {
            value = value.slice(0, -1);
            if (!hidden) process.stdout.write("\b \b");
          }
          continue;
        }
        if (char >= " ") {
          value += char;
          if (!hidden) process.stdout.write(char);
          if (Buffer.byteLength(value) > 1024) {
            done(new Error("Girdi çok uzun"));
            return;
          }
        }
      }
    }
    process.stdin.on("data", receive);
  });
}
try {
  const { values } = parseArgs({
    options: {
      role: { type: "string", multiple: true },
      event: { type: "string", multiple: true },
      help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.log(
      "pnpm admin:bootstrap --role system_admin [--role event_manager --event <UUID>]\nİzinli roller: " +
        roles.join(", ") +
        "\nE-posta, parola ve MFA yalnızca etkileşimli terminalde alınır.",
    );
  } else {
    if (!process.stdin.isTTY || !process.stdout.isTTY)
      throw new Error("Kurulum etkileşimli terminal gerektirir");
    if (
      !values.role?.length ||
      values.role.some(
        (role) => !roles.includes(role as (typeof roles)[number]),
      )
    )
      throw new Error("En az bir geçerli --role gerekir");
    const email = (await ask("Yönetici e-posta: ")).trim().toLowerCase();
    const password = await ask("Parola (en az 14 karakter, gizli): ", true);
    if (password !== (await ask("Parola tekrar (gizli): ", true)))
      throw new Error("Parolalar eşleşmiyor");
    const secret = new Secret({ size: 32 });
    console.log(
      "Bu kişiye özel MFA adresini güvenilir doğrulayıcıya ekleyin. Terminal çıktısını paylaşmayın:\n" +
        new TOTP({ issuer: "Uludott", label: email, secret }).toString(),
    );
    const result = await bootstrapAdmin({
      email,
      password,
      secret: secret.base32,
      code: await ask("Doğrulayıcının 6 haneli kodu (gizli): ", true),
      roles: values.role,
      eventScopes: values.event ?? [],
    });
    console.log(
      "Yönetici oluşturuldu: " +
        result.id +
        "\nTek kullanımlık kurtarma kodları; çevrimdışı güvenli saklayın, yeniden gösterilemez:\n" +
        result.recoveryCodes.join("\n") +
        "\nKurulum kodu tekrar kullanılamaz. Giriş için sonraki 30 saniyelik kodu bekleyin.",
    );
  }
} catch {
  console.error(
    "Kurulum tamamlanamadı. Girdileri, roller/kapsamları, MFA kodunu ve sunucu yapılandırmasını kontrol edin.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
