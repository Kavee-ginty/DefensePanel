import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL;
// Frontend local port eka 5173 nisa CORS allow karanna
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY;
const PRODUCT_ID = process.env.PRODUCT_ID;
const DODO_API_URL = process.env.DODO_API_URL;

// 1. Checkout Route (Postman & Frontend ekata dekatama meka use karanna puluwan)
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { productId, userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "userEmail is required" });
    }

    console.log(`Processing checkout for ${userEmail} and product ${productId}`);

    const response = await fetch(`${DODO_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DODO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_cart: [{ product_id: PRODUCT_ID, quantity: 1 }],
        customer: { email: userEmail, name: 'Valued Customer' },
        return_url: `${FRONTEND_URL}/dashboard`, // Payment eka iwara wela ena thana
      })
    });

    const sessionData = await response.json();
    
    if (!response.ok) {
      console.error("Dodo API Error:", sessionData);
      return res.status(response.status).json({ error: sessionData });
    }

    // Success response eka checkout URL eka samaga
    return res.json({ checkout_url: sessionData.checkout_url });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});