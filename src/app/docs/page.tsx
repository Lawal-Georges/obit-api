import { DocPage, readProjectFile } from "./DocPage";

export default function DocsPage() {
  const markdown = readProjectFile("README.md");
  return <DocPage markdown={markdown} eyebrow="Orbit · README" />;
}
