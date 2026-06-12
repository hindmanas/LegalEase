export function buildTextReport(document) {
  const analysis = document.analysis || {};
  const risks = analysis.risks || [];
  const clauses = analysis.clauses || [];

  return [
    `AI Legal Document Simplifier Report`,
    `Document: ${document.originalName}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'Simple Summary',
    analysis.summary || 'No summary available.',
    '',
    'Risk Highlights',
    risks.length
      ? risks.map((risk, index) => `${index + 1}. [${risk.level}] ${risk.title}\n${risk.explanation}\nSuggestion: ${risk.suggestion || 'Review with counsel.'}`).join('\n\n')
      : 'No risks detected.',
    '',
    'Important Clauses',
    clauses.length
      ? clauses.map((clause, index) => `${index + 1}. ${clause.title} (${clause.category})\n${clause.explanation}`).join('\n\n')
      : 'No clauses available.',
    '',
    'Simplified Version',
    analysis.simplifiedText || 'No simplified text available.',
    '',
    'Disclaimer: This report is an AI-generated aid and is not legal advice.'
  ].join('\n');
}
