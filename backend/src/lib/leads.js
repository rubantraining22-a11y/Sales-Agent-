import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "../config.js";

function ensureLeadsFile() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  if (!fs.existsSync(config.leadsFile)) {
    fs.writeFileSync(config.leadsFile, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getLeads() {
  ensureLeadsFile();
  try {
    const raw = fs.readFileSync(config.leadsFile, "utf-8");
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export async function saveLead(leadData) {
  ensureLeadsFile();
  const leads = getLeads();

  const newLead = {
    id: crypto.randomUUID(),
    name: (leadData.name || "").trim(),
    phone: (leadData.phone || "").trim(),
    email: (leadData.email || "").trim(),
    model: (leadData.model || "General Inquiry").trim(),
    notes: (leadData.notes || "").trim(),
    createdAt: new Date().toISOString(),
  };

  leads.unshift(newLead);
  fs.writeFileSync(config.leadsFile, JSON.stringify(leads, null, 2), "utf-8");

  // Post to Google Sheets if Webhook URL is configured
  let googleSheetResult = { sent: false };
  const webhookUrl = config.googleSheetWebhookUrl;

  if (webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLead.name,
          phone: newLead.phone,
          email: newLead.email,
          model: newLead.model,
          notes: newLead.notes,
          timestamp: newLead.createdAt,
        }),
      });
      googleSheetResult = { sent: true, status: response.status };
    } catch (err) {
      console.error("[sales-agent] Google Sheet webhook error:", err.message);
      googleSheetResult = { sent: false, error: err.message };
    }
  }

  return { lead: newLead, googleSheet: googleSheetResult };
}
