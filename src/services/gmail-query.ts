// Builds search query variants to try, most specific first.
// Handles the common failure mode where the model guesses a sender domain or
// full address (e.g. from:capitalone.com) that doesn't match the real sender
// (e.g. capitalone@notification.capitalone.co.uk). Gmail's from: operator
// matches the sender's display name or any word in their address, so falling
// back to the bare company word reliably finds the mail.
export function buildSearchFallbacks(query: string): string[] {
  const variants = [query]
  const fromTerms = query.match(/from:[^\s"]+/g) || []
  for (const fromTerm of fromTerms) {
    const value = fromTerm.slice("from:".length)
    let replacement: string | null = null
    if (value.includes("@")) {
      replacement = `from:${value.split("@")[0]}`
    } else if (value.includes(".")) {
      replacement = `from:${value.split(".")[0]}`
    }
    if (replacement && replacement !== fromTerm) {
      variants.push(query.replace(fromTerm, replacement))
    }
  }
  return [...new Set(variants)]
}
