import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
      console.error("No session found");
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const shopDomain =
      request.headers.get("X-Shopify-Shop-Domain") || session.shop;

    if (!shopDomain) {
      console.error("Missing shop domain from both header and session");
      return json(
        { success: false, error: "Invalid request - missing shop domain" },
        { status: 400 },
      );
    }

    const requestData = await request.json();
    const { productId, name, email, comment } = requestData;

    if (!productId || !name || !email || !comment) {
      return json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    const feedback = await prisma.Feedback.create({
      data: {
        productId: String(productId),
        name,
        email,
        comment,
      },
    });

    return json({ success: true, feedback });
  } catch (error) {
    console.error("Action error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function loader({ request }) {
  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
      console.error("No session found");
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const shopDomain =
      request.headers.get("X-Shopify-Shop-Domain") || session.shop;

    if (!shopDomain) {
      console.error("Missing shop domain from both header and session");
      return json(
        { success: false, error: "Invalid request - missing shop domain" },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
      return json(
        { success: false, error: "productId is required" },
        { status: 400 },
      );
    }

    const feedback = await prisma.Feedback.findMany({
      where: { productId: String(productId) },
      orderBy: { createdAt: "desc" },
    });

    console.log("Found feedback:", feedback);
    const response = json({ success: true, feedback });
    console.log("Response:", response);
    return response;
  } catch (error) {
    console.error("Loader error:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}
