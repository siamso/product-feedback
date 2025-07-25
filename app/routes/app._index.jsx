import { Page, Layout, Text } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function Index() {
  return (
    <Page>
      <TitleBar title="Product Feedback"></TitleBar>
      <Layout>
        <Layout.Section>
          <Text as="h2" variant="headingMd">
            App Installed!Add the app blocks in your shopify store
          </Text>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
