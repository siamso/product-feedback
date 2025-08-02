import {
  Page,
  Layout,
  Text,
  Thumbnail,
  BlockStack,
  Button,
} from "@shopify/polaris";
import { ClipboardCheckFilledIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <Page>
      <TitleBar title="Product Feedback"></TitleBar>
      <Layout>
        <Layout.Section>
          <Text as="h1" variant="headingLg" alignment="center">
            App Installed! Add the app blocks in your shopify store..
          </Text>
          <BlockStack inlineAlign="center">
            <Thumbnail source={ClipboardCheckFilledIcon} size="large" />
          </BlockStack>
        </Layout.Section>
        <Layout.Section>
          <BlockStack gap="3">
            <Button>
              <Link to="/app/productComments">View Products</Link>
            </Button>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
