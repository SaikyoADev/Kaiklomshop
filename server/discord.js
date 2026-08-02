const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

// Sends a Discord notification in the background. Never throws — if it fails
// (no webhook configured, Discord is down, bad URL, etc.) we just log it and
// move on. A notification failing must never break the actual topup request.
export function notifyDiscordTopup({ userName, username, amount, slipRef, transferAt }) {
  if (!webhookUrl) return;

  const payload = {
    embeds: [
      {
        title: "💰 มีคำขอเติมเงินใหม่",
        color: 0xf59e0b,
        fields: [
          { name: "สมาชิก", value: `${userName} (@${username})`, inline: true },
          { name: "จำนวน", value: `${Number(amount).toLocaleString("th-TH")} พอยต์`, inline: true },
          { name: "เลขอ้างอิงสลิป", value: slipRef || "-", inline: false },
          { name: "เวลาที่โอน", value: transferAt || "ไม่ระบุ", inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("[discord webhook] failed to send notification:", err.message);
  });
}
