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
		const { session_id } = await req.json();

		if (!session_id) {
			throw new Error("Missing session_id");
		}

		const session = await stripe.checkout.sessions.retrieve(session_id, {
			expand: ["customer_details"],
		});

		return new Response(
			JSON.stringify({
				status: session.status,
				payment_status: session.payment_status,
				customer_email: session.customer_details?.email || null,
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			}
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unexpected error";
		console.error("Error fetching session status:", message);
		return new Response(JSON.stringify({ error: message }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
			status: 400,
		});
	}
});