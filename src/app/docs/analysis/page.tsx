import { DocPage, readProjectFile } from "../DocPage";

export default function AnalysisDocsPage() {
  const markdown = readProjectFile("analysis/README.md");
  return <DocPage markdown={markdown} eyebrow="Orbit · Dossier d'analyse" backHref="/docs" />;
}
