import { Report } from "@/types/report";

export async function submitReport(data: Report) {
  const res = await fetch("https://us-central1-nagar-chakshu.cloudfunctions.net/api/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to submit report");
  return res.json();
}
