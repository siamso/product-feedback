import {
  Page,
  Layout,
  Text,
  Thumbnail,
  BlockStack,
  Card,
  Button,
  InlineStack,
  TextField,
  Modal,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    try {
      const productsResponse = await admin.graphql(
        `#graphql
            query getProducts {
              products(first: 25) {
                edges {
                  node {
                    id
                    title
                    handle
                    status
                    images(first: 1) {
                      edges {
                        node {
                          src
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
        `,
      );

      const productsData = await productsResponse.json();
      console.log("Products data:", productsData);

      return json(productsData);
    } catch (graphqlError) {
      console.error("GraphQL Error:", graphqlError);
      return json(
        {
          error: "GraphQL request failed",
          details: graphqlError.message,
          session: session ? "Session exists" : "No session",
        },
        { status: 500 },
      );
    }
  } catch (authError) {
    console.error("Authentication Error:", authError);
    return json(
      {
        error: "Authentication failed",
        details: authError.message,
      },
      { status: 401 },
    );
  }
};

export default function ProductComments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    comment: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalComments, setTotalComments] = useState(0);

  const data = useLoaderData();
  const products =
    data?.data?.products?.edges.map(({ node }) => ({
      id: node.id.split("/").pop(),
      title: node.title,
      handle: node.handle,
      status: node.status,
      image: node.images.edges[0]?.node || null,
    })) || [];

  const fetchComments = async (productId, page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/app/comments?productId=${productId}&page=${page}`,
      );
      const data = await response.json();
      setComments(data.comments || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || 1);
      setTotalComments(data.totalComments || 0);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
      setTotalPages(0);
      setCurrentPage(1);
      setTotalComments(0);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowComments(true);
    setIsModalOpen(false);
    setCurrentPage(1);
    fetchComments(product.id, 1);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setShowComments(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchComments(selectedProduct.id, newPage);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("commentId", commentId);

      try {
        const response = await fetch("/app/comments", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (result.success) {
          fetchComments(selectedProduct.id, currentPage);
        } else {
          alert("Error deleting comment: " + result.message);
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Error deleting comment");
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditForm({
      name: comment.name,
      email: comment.email,
      comment: comment.comment,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const formData = new FormData();
    formData.append("action", "edit");
    formData.append("commentId", editingComment.id);
    formData.append("name", editForm.name);
    formData.append("email", editForm.email);
    formData.append("comment", editForm.comment);

    try {
      const response = await fetch("/app/comments", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        setIsEditModalOpen(false);
        setEditingComment(null);
        fetchComments(selectedProduct.id, currentPage);
      } else {
        alert("Error updating comment: " + result.message);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Error updating comment");
    }
  };

  return (
    <Page>
      <TitleBar title="Product Feedback"></TitleBar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="3">
            <Button onClick={handleOpenModal}>
              View Products ({products.length})
            </Button>

            {selectedProduct && (
              <Card>
                <BlockStack gap="3">
                  <Text as="h2" variant="headingMd">
                    Selected Product: {selectedProduct.title}
                  </Text>
                  <Text variant="bodyMd">Product ID: {selectedProduct.id}</Text>
                  <Text variant="bodyMd">Status: {selectedProduct.status}</Text>
                  <Button onClick={() => setShowComments(!showComments)}>
                    {showComments ? "Hide Comments" : "Show Comments"}
                  </Button>

                  {showComments && (
                    <Card>
                      <BlockStack gap="3">
                        <Text as="h3" variant="headingMd">
                          Comments for {selectedProduct.title}
                        </Text>

                        {totalComments > 0 && (
                          <Text variant="bodyMd" color="subdued">
                            Showing {comments.length} of {totalComments}{" "}
                            comments
                          </Text>
                        )}

                        {loading ? (
                          <Text variant="bodyMd">Loading comments...</Text>
                        ) : comments.length > 0 ? (
                          <BlockStack gap="5">
                            {comments.map((comment, index) => (
                              <Card key={index}>
                                <BlockStack gap="5">
                                  <InlineStack align="space-between">
                                    <Text variant="headingSm">
                                      {comment.name}
                                    </Text>
                                    <Text variant="bodySm" color="subdued">
                                      {new Date(
                                        comment.createdAt,
                                      ).toLocaleDateString()}
                                    </Text>
                                  </InlineStack>
                                  <Text variant="bodyMd">
                                    {comment.comment}
                                  </Text>
                                  <Text variant="bodySm" color="subdued">
                                    Email: {comment.email}
                                  </Text>
                                  <InlineStack gap="5">
                                    <Button
                                      size="small"
                                      onClick={() => handleEditComment(comment)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="small"
                                      tone="critical"
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </InlineStack>
                                </BlockStack>
                              </Card>
                            ))}

                            {totalPages > 1 && (
                              <Card>
                                <BlockStack gap="3">
                                  <Text variant="bodyMd" alignment="center">
                                    Page {currentPage} of {totalPages}
                                  </Text>
                                  <InlineStack gap="3" alignment="center">
                                    <Button
                                      onClick={() =>
                                        handlePageChange(currentPage - 1)
                                      }
                                      disabled={currentPage === 1}
                                      size="small"
                                    >
                                      Previous
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handlePageChange(currentPage + 1)
                                      }
                                      disabled={currentPage === totalPages}
                                      size="small"
                                    >
                                      Next
                                    </Button>
                                  </InlineStack>
                                </BlockStack>
                              </Card>
                            )}
                          </BlockStack>
                        ) : (
                          <Text variant="bodyMd">
                            No comments found for this product.
                          </Text>
                        )}
                      </BlockStack>
                    </Card>
                  )}
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        message="Select a Product"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div style={{ padding: "20px" }}>
          <BlockStack gap="4">
            {products.map((product, index) => (
              <Card key={index}>
                <BlockStack gap="3">
                  <Text as="h3" variant="headingMd">
                    {product.title}
                  </Text>
                  <Thumbnail
                    source={
                      product.image && product.image.src
                        ? product.image.src
                        : "https://via.placeholder.com/150"
                    }
                    alt={product.title}
                  />
                  <Text variant="bodyMd">Status: {product.status}</Text>
                  <Button onClick={() => handleProductSelect(product)} primary>
                    Select This Product
                  </Button>
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        </div>
      </Modal>

      <Modal
        message="Edit Comment"
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingComment(null);
        }}
      >
        <div style={{ padding: "20px" }}>
          <BlockStack gap="4">
            <TextField
              label="Name"
              value={editForm.name}
              onChange={(value) => setEditForm({ ...editForm, name: value })}
            />
            <TextField
              label="Email"
              value={editForm.email}
              onChange={(value) => setEditForm({ ...editForm, email: value })}
            />
            <TextField
              label="Comment"
              value={editForm.comment}
              onChange={(value) => setEditForm({ ...editForm, comment: value })}
              multiline={3}
            />
            <InlineStack gap="2">
              <Button onClick={handleSaveEdit} primary>
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingComment(null);
                }}
              >
                Cancel
              </Button>
            </InlineStack>
          </BlockStack>
        </div>
      </Modal>
    </Page>
  );
}
