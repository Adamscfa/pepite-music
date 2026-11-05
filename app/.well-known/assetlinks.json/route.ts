const PACKAGE_NAME = "com.adamscfa.pepite";
const SHA256_FINGERPRINT = /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/i;

export function GET() {
  const fingerprints = (process.env.ANDROID_APP_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean);

  if (!fingerprints.length) {
    return new Response("Android app association is not configured.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (fingerprints.some((fingerprint) => !SHA256_FINGERPRINT.test(fingerprint))) {
    return new Response("Invalid Android signing certificate fingerprint.", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return Response.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
