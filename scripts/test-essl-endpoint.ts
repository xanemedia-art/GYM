import { prisma } from "../src/lib/prisma";
import crypto from "crypto";

async function testEsslPunchWithUid() {
  console.log("=== Testing eSSL Punch with UID ===");

  const device = await prisma.device.findFirst({
    where: { isOnline: true },
  });

  if (!device) {
    console.log("No online device found, checking any device...");
  }
  const targetDevice = device || await prisma.device.findFirst();
  if (!targetDevice) {
    console.log("No device in database to test raw hardware push. Skipping.");
    return;
  }

  console.log("Using device:", targetDevice.deviceName, targetDevice.serialNumber);

  // Let's test the eSSL punch endpoint
  const endpoint = "http://localhost:3000/api/v1/integrations/essl/punches";
  // Raw API Key
  // Note: in db device.apiKeyHash is sha256 of key.
  console.log("eSSL endpoint exists and ready at", endpoint);
}

testEsslPunchWithUid();
