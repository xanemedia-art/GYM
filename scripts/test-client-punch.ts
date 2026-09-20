async function testClientPunchApi() {
  const endpoint = "http://localhost:3000/api/v1/attendance/client-punch";
  console.log("Testing POST", endpoint);

  // 1. Valid Member Punch
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug: "be-free-fitness-delhi",
        identifier: "7650007000",
        punchType: "CHECK_IN",
      }),
    });

    const json = await res.json();
    console.log("Client Punch Response 1:", JSON.stringify(json, null, 2));

    // 2. Duplicate punch within 5 mins
    const resDup = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug: "be-free-fitness-delhi",
        identifier: "7650007000",
        punchType: "CHECK_IN",
      }),
    });
    const jsonDup = await resDup.json();
    console.log("Client Punch Duplicate Response 2:", JSON.stringify(jsonDup, null, 2));

    // 3. Invalid member
    const resInvalid = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug: "be-free-fitness-delhi",
        identifier: "0000000000",
        punchType: "CHECK_IN",
      }),
    });
    const jsonInvalid = await resInvalid.json();
    console.log("Client Punch Invalid Response 3:", JSON.stringify(jsonInvalid, null, 2));

  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testClientPunchApi();
