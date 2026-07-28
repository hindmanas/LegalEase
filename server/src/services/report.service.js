export function buildTextReport(document) {
  const analysis = document.analysis || {};
  
  const importantClauses = analysis.importantClauses || analysis.clauses || [];
  const risksRedFlags = analysis.risksRedFlags || analysis.risks || [];
  const hiddenChargesPenalties = analysis.hiddenChargesPenalties || analysis.hiddenCharges || [];
  const legalObligations = analysis.legalObligations || [];
  const userResponsibilities = analysis.userResponsibilities || [];
  const missingSuspiciousClauses = analysis.missingSuspiciousClauses || [];
  const recommendations = analysis.recommendations || [];

  const lines = [
    `============================================================`,
    `               AI Legal Document Review Report`,
    `============================================================`,
    `Document: ${document.originalName}`,
    `Document Type: ${analysis.documentType || 'Legal Document'}`,
    `Generated On: ${new Date().toLocaleString()}`,
    `Safety Score: ${analysis.safetyScore !== undefined ? analysis.safetyScore : 'N/A'}/100`,
    `Overall Risk Level: ${(analysis.overallRiskLevel || 'low').toUpperCase()}`,
    `============================================================`,
    '',
    '--- Executive Summary ---',
    analysis.executiveSummary || analysis.summary || 'No executive summary available.',
    '',
    '--- Simplified Summary ---',
    analysis.simplifiedSummary || analysis.simplifiedText || 'No simplified summary available.',
    '',
    '--- Key Information ---',
    analysis.keyInformation || 'No metadata key information available.',
    '',
    '--- Recommendations ---',
    recommendations.length 
      ? recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') 
      : 'No specific recommendations provided.',
    '',
    '--- Important Clauses ---',
    importantClauses.length
      ? importantClauses.map((c, i) => `${i + 1}. ${c.title} [Category: ${c.category}]\n   Explanation: ${c.explanation}`).join('\n\n')
      : 'No important clauses identified.',
    '',
    '--- Risks & Red Flags ---',
    risksRedFlags.length
      ? risksRedFlags.map((r, i) => `${i + 1}. ${r.title} [Severity: ${r.level.toUpperCase()}]\n   Explanation: ${r.explanation}\n   Suggestion: ${r.suggestion || 'N/A'}\n   Excerpt: "${r.excerpt || 'N/A'}"`).join('\n\n')
      : 'No risks or red flags detected.',
    '',
    '--- Hidden Charges & Penalties ---',
    hiddenChargesPenalties.length
      ? hiddenChargesPenalties.map((h, i) => `${i + 1}. ${h.title} [Amount/Penalty: ${h.amount || 'N/A'}]\n   Explanation: ${h.explanation}\n   Excerpt: "${h.excerpt || 'N/A'}"`).join('\n\n')
      : 'No hidden charges or financial penalties identified.',
    '',
    '--- Legal Obligations ---',
    legalObligations.length
      ? legalObligations.map((o, i) => `${i + 1}. ${o.title}\n   Covenant/Obligation: ${o.obligation}`).join('\n\n')
      : 'No specific legal obligations highlighted.',
    '',
    '--- User Responsibilities ---',
    userResponsibilities.length
      ? userResponsibilities.map((u, i) => `${i + 1}. ${u.title}\n   Duty/Responsibility: ${u.responsibility}`).join('\n\n')
      : 'No user-specific responsibilities highlighted.',
    '',
    '--- Missing or Suspicious Clauses ---',
    missingSuspiciousClauses.length
      ? missingSuspiciousClauses.map((m, i) => `${i + 1}. ${m.title}\n   Explanation: ${m.explanation}\n   Potential Impact: ${m.impact}`).join('\n\n')
      : 'No omitted or suspicious clauses flagged.',
    '',
    '--- Relevant Legal References ---',
    (analysis.relevantLegalReferences || []).length
      ? (analysis.relevantLegalReferences || []).map((ref, i) => `${i + 1}. ${ref.actName} [Provision: ${ref.sectionArticle || 'N/A'}] [Confidence: ${(ref.confidence || 'medium').toUpperCase()}]\n   Applicability: ${ref.whyApplies}`).join('\n\n')
      : 'No specific legal references could be confidently identified for this document.',
    '',
    '--- Final Conclusion ---',
    analysis.finalConclusion || 'No final conclusion available.',
    '',
    `============================================================`,
    'Disclaimer: This report is an AI-generated aid and does not constitute formal legal advice. Please consult with a qualified legal professional before signing.',
    `============================================================`
  ];

  return lines.join('\n');
}
