import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    if (!productId) {
      return json({ comments: [], totalPages: 0, currentPage: 1 });
    }

    // Get total count for pagination
    const totalComments = await prisma.Feedback.count({
      where: {
        productId: productId,
      },
    });

    const totalPages = Math.ceil(totalComments / limit);

    const comments = await prisma.Feedback.findMany({
      where: {
        productId: productId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return json({
      comments,
      totalPages,
      currentPage: page,
      totalComments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return json({ comments: [], totalPages: 0, currentPage: 1 });
  }
};

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    const commentId = parseInt(formData.get("commentId"));

    if (action === "delete") {
      await prisma.Feedback.delete({
        where: {
          id: commentId,
        },
      });
      return json({ success: true, message: "Comment deleted successfully" });
    }

    if (action === "edit") {
      const name = formData.get("name");
      const email = formData.get("email");
      const comment = formData.get("comment");

      await prisma.Feedback.update({
        where: {
          id: commentId,
        },
        data: {
          name,
          email,
          comment,
        },
      });
      return json({ success: true, message: "Comment updated successfully" });
    }

    return json({ success: false, message: "Invalid action" });
  } catch (error) {
    console.error("Error in action:", error);
    return json({ success: false, message: "An error occurred" });
  }
};
