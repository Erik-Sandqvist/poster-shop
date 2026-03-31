// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
	httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const { cartItems } = await req.json();

		if (!Array.isArray(cartItems) || cartItems.length === 0) {
			throw new Error("Cart is empty");
		}

		const lineItems = cartItems.map((item: any) => {
			const product = item?.product_variants?.products;
			const productName = product?.name || "Product";
			const productPrice = Number(product?.price || 0);
			const quantity = Number(item?.quantity || 1);
			const unitAmount = Math.round(productPrice * 100);

			if (unitAmount <= 0) {
				throw new Error(`Invalid price for ${productName}`);
			}

			return {
				price_data: {
					currency: "sek",
					product_data: {
						name: productName,
						description: `Size: ${item?.product_variants?.size || "N/A"}, Color: ${item?.product_variants?.color || "N/A"}`,
						images: product?.image_url ? [product.image_url] : [],
					},
					unit_amount: unitAmount,
				},
				quantity,
			};
		});

		const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";

		const session = await stripe.checkout.sessions.create({
			ui_mode: "embedded",
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			return_url: `${siteUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
			automatic_tax: { enabled: false },
			shipping_address_collection: {
				allowed_countries: ["SE", "NO", "DK", "FI"],
			},
		});

		if (!session.client_secret) {
			throw new Error("No client secret returned from Stripe");
		}

		return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
			status: 200,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unexpected error";
		console.error("Error creating checkout session:", message);
		return new Response(JSON.stringify({ error: message }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
			status: 400,
		});
	}
});
