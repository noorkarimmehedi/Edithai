export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get("connectionId")
    || searchParams.get("connectedAccountId")
    || searchParams.get("connected_account_id")
  const status = searchParams.get("status")

  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Gmail...</title></head>
<body>
<script>
(function() {
  const data = ${JSON.stringify({ connectionId: connectionId || null, connected: status === "success" || !!connectionId })}
  if (window.opener) {
    window.opener.postMessage({ type: "gmail-connected", ...data }, "*")
  }
  if (data.connectionId) {
    localStorage.setItem("voicemail-gmail-config", JSON.stringify({
      connectionId: data.connectionId
    }))
  }
  setTimeout(function() { window.close() }, 500)
})()
</script>
<p>Gmail connected! This window will close automatically.</p>
</body>
</html>`

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
