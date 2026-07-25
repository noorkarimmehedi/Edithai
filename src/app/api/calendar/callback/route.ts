import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get("connectionId")

  if (!connectionId) {
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: "calendar-connected", connectionId: "" }, "*");
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  }

  // Store in localStorage via the callback page
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Connected</title></head>
    <body>
      <script>
        localStorage.setItem("voicemail-calendar-config", JSON.stringify({ connectionId: "${connectionId}" }));
        window.opener?.postMessage({ type: "calendar-connected", connectionId: "${connectionId}" }, "*");
        setTimeout(() => window.close(), 500);
      </script>
      <p>Google Calendar connected! Closing...</p>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  })
}
