/* global process */

/**
 * Vercel Serverless — POST /api/create-checkout
 *
 * Mirrors the standalone dodo/server.js gateway so checkout works in
 * production without a separate host. Body: { userEmail, productId? }.
 * Returns: { checkout_url }.
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { productId, userEmail } = body
  const email =
    typeof userEmail === 'string' ? userEmail.trim() : ''

  if (!email) {
    return res.status(400).json({ error: 'userEmail is required' })
  }

  const apiKey = process.env.DODO_PAYMENTS_API_KEY?.trim()
  const dodoApiUrl = process.env.DODO_API_URL?.trim()
  const defaultProductId = process.env.PRODUCT_ID?.trim()
  const product =
    typeof productId === 'string' && productId.trim()
      ? productId.trim()
      : defaultProductId

  if (!apiKey || !dodoApiUrl || !product) {
    return res.status(500).json({
      error:
        'Server is missing DODO_PAYMENTS_API_KEY, DODO_API_URL, or PRODUCT_ID.',
    })
  }

  const origin =
    process.env.FRONTEND_URL?.trim() ||
    (typeof req.headers.origin === 'string' && req.headers.origin) ||
    (typeof req.headers.host === 'string'
      ? `https://${req.headers.host}`
      : '')

  const returnUrl = origin ? `${origin}/dashboard` : undefined

  try {
    const response = await fetch(`${dodoApiUrl}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: product, quantity: 1 }],
        customer: { email, name: 'Valued Customer' },
        ...(returnUrl ? { return_url: returnUrl } : {}),
      }),
    })

    const sessionData = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('[create-checkout] Dodo API error', response.status, sessionData)
      return res.status(response.status).json({ error: sessionData })
    }

    if (!sessionData?.checkout_url) {
      console.error('[create-checkout] Missing checkout_url in response', sessionData)
      return res
        .status(502)
        .json({ error: 'Dodo response missing checkout_url' })
    }

    return res.status(200).json({ checkout_url: sessionData.checkout_url })
  } catch (err) {
    console.error('[create-checkout] failed', err)
    return res.status(500).json({ error: err?.message || 'Checkout failed' })
  }
}
