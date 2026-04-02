import { DocsThemeConfig } from "nextra-theme-docs";
import DocFooter from "./components/DocFooter";

const config: DocsThemeConfig = {
  logo: (
    <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>Veil</span>
  ),
  project: {
    link: "https://github.com/veil-dev/veil",
  },
  docsRepositoryBase: "https://github.com/veil-dev/veil/tree/main/apps/docs",
  footer: {
    component: <DocFooter />,
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Veil documentation: add one line of code and see every failure in your AI agent" />
      <title>Veil Docs</title>
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: "%s | Veil Docs",
    };
  },
  primaryHue: 220,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  editLink: {
    text: "",
  },
  feedback: {
    content: null,
  },
};

export default config;
