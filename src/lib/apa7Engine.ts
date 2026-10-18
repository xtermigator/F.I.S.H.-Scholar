import { PeerReviewedSource, ApaCheckResult, SourceValidationAudit } from '../types/matrix';

/**
 * APA 7th Edition Article Title Sentence Casing:
 * Capitalizes first letter of title, first letter after colon or dash, and keeps common academic acronyms.
 */
export function formatToSentenceCase(title: string): string {
  if (!title) return '';
  const trimmed = title.trim();

  // Split on colon or em/en dash to preserve subtitle capitalization
  const parts = trimmed.split(/(:\s+|\s+[-–—]\s+)/);

  return parts.map((part) => {
    if (part.startsWith(':') || part.trim() === '-' || part.trim() === '–' || part.trim() === '—') {
      return part;
    }
    if (part.length === 0) return part;

    const words = part.split(/\s+/);
    const converted = words.map((word, wIdx) => {
      // Check for acronyms like APA, AI, COVID, fMRI, USA, DNA, LLM, etc.
      const stripped = word.replace(/^[^\w]+|[^\w]+$/g, '');
      if (stripped.length > 1 && stripped === stripped.toUpperCase() && /^[A-Z0-9]+$/.test(stripped)) {
        return word; // Preserve uppercase acronym
      }
      if (wIdx === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    });
    return converted.join(' ');
  }).join('');
}

/**
 * Normalizes author name into "Surname, F. M." format
 */
export function formatAuthorName(rawAuthor: string): string {
  if (!rawAuthor) return '';
  const clean = rawAuthor.trim();

  // If already in "Surname, F. M." format
  if (/^[A-Z][a-zA-Z\s'-]+,\s+[A-Z]\./.test(clean)) {
    return clean;
  }

  // If in "First Middle Last" or "First Last" format
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const firstNames = parts.slice(0, parts.length - 1);
    const initials = firstNames.map(f => `${f.charAt(0).toUpperCase()}.`).join(' ');
    return `${lastName}, ${initials}`;
  }

  return clean;
}

/**
 * Formats full author list according to APA 7th rules:
 * - 1 author: Surname, F. M.
 * - 2 authors: Surname, F. M., & Surname, F. M.
 * - 3 to 20 authors: Surname, F. M., Surname, F. M., ... & Surname, F. M.
 * - 21+ authors: First 19 authors, then an ellipsis (...), then the final author (no ampersand).
 */
export function formatAuthorListApa7(authors: string[]): string {
  if (!authors || authors.length === 0) return 'Unknown Author';

  const formatted = authors.map(a => formatAuthorName(a));

  if (formatted.length === 1) {
    return formatted[0];
  }

  if (formatted.length === 2) {
    return `${formatted[0]}, & ${formatted[1]}`;
  }

  if (formatted.length <= 20) {
    const allExceptLast = formatted.slice(0, -1).join(', ');
    const last = formatted[formatted.length - 1];
    return `${allExceptLast}, & ${last}`;
  }

  // 21 or more authors rule
  const first19 = formatted.slice(0, 19).join(', ');
  const finalAuthor = formatted[formatted.length - 1];
  return `${first19}, ... ${finalAuthor}`;
}

/**
 * Generates APA 7th In-Text Citations:
 * - Parenthetical: (Author, 2023) or (Author & Author, 2023) or (Author et al., 2023)
 * - Narrative: Author (2023) or Author and Author (2023) or Author et al. (2023)
 */
export function getInTextCitations(source: PeerReviewedSource): { parenthetical: string; narrative: string } {
  const year = source.year || 'n.d.';
  const authors = source.authors || [];

  if (authors.length === 0) {
    const shortTitle = source.title ? `"${source.title.slice(0, 24)}..."` : 'Anonymous';
    return {
      parenthetical: `(${shortTitle}, ${year})`,
      narrative: `${shortTitle} (${year})`
    };
  }

  // Extract primary surname
  const getSurname = (authorStr: string) => {
    const parts = authorStr.split(',');
    return parts[0].trim();
  };

  if (authors.length === 1) {
    const surname = getSurname(authors[0]);
    return {
      parenthetical: `(${surname}, ${year})`,
      narrative: `${surname} (${year})`
    };
  }

  if (authors.length === 2) {
    const s1 = getSurname(authors[0]);
    const s2 = getSurname(authors[1]);
    return {
      parenthetical: `(${s1} & ${s2}, ${year})`,
      narrative: `${s1} and ${s2} (${year})`
    };
  }

  // 3 or more authors: APA 7th uses "et al." from the first citation
  const s1 = getSurname(authors[0]);
  return {
    parenthetical: `(${s1} et al., ${year})`,
    narrative: `${s1} et al. (${year})`
  };
}

/**
 * Formats full reference list entry in plain text
 */
export function formatApa7PlainText(source: PeerReviewedSource): string {
  const authorText = formatAuthorListApa7(source.authors);
  const yearText = `(${source.year || 'n.d.'}).`;
  const titleText = (source.titleSentenceCase || formatToSentenceCase(source.title)) + (source.title.endsWith('.') ? '' : '.');
  
  let journalPart = source.journal || 'Academic Journal';
  if (source.volume) {
    journalPart += `, ${source.volume}`;
    if (source.issue) {
      journalPart += `(${source.issue})`;
    }
  }
  if (source.pages) {
    const cleanPages = source.pages.replace(/^pp?\.\s*/i, '').replace('-', '–');
    journalPart += `, ${cleanPages}`;
  }
  journalPart += '.';

  const doiPart = source.doi ? ` ${source.doi}` : '';

  return `${authorText} ${yearText} ${titleText} ${journalPart}${doiPart}`;
}

/**
 * Formats full reference list entry in HTML (with precise italics for Journal title and Volume)
 */
export function formatApa7Html(source: PeerReviewedSource): string {
  const authorText = formatAuthorListApa7(source.authors);
  const yearText = `(${source.year || 'n.d.'}).`;
  const titleText = (source.titleSentenceCase || formatToSentenceCase(source.title)) + (source.title.endsWith('.') ? '' : '.');
  
  const journalName = source.journal ? `<em>${source.journal}</em>` : '<em>Academic Journal</em>';
  const volumePart = source.volume ? `, <em>${source.volume}</em>` : '';
  const issuePart = source.issue ? `(${source.issue})` : '';
  const pagesPart = source.pages ? `, ${source.pages.replace(/^pp?\.\s*/i, '').replace('-', '–')}` : '';

  const doiHtml = source.doi
    ? ` <a href="${source.doi}" target="_blank" rel="noopener noreferrer" class="text-stone-700 underline hover:text-stone-900">${source.doi}</a>`
    : '';

  return `${authorText} ${yearText} ${titleText} ${journalName}${volumePart}${issuePart}${pagesPart}.${doiHtml}`;
}

/**
 * Runs complete APA 7th edition validation audit on a source
 */
export function auditSourceApa7(source: PeerReviewedSource): SourceValidationAudit {
  const checks: ApaCheckResult[] = [];

  // Check 1: Author format
  const authors = source.authors || [];
  if (authors.length === 0) {
    checks.push({
      rule: 'Author Specification',
      passed: false,
      message: 'No authors specified. APA 7th requires individual or institutional authors.',
      severity: 'error',
      fixSuggestion: 'Add at least one author in Surname, Initial(s) format.'
    });
  } else {
    const allInverted = authors.every(a => /^[A-Z][a-zA-Z\s'-]+,\s+[A-Z]\./.test(a.trim()));
    if (allInverted) {
      checks.push({
        rule: 'Author Inversion',
        passed: true,
        message: 'All authors correctly formatted with Surname, First Initial(s).',
        severity: 'pass'
      });
    } else {
      checks.push({
        rule: 'Author Inversion',
        passed: false,
        message: 'Some authors are not inverted. APA 7th requires "Surname, F. M." format.',
        severity: 'warning',
        fixSuggestion: 'Auto-fix will reorder First/Last names to Surname, Initials.'
      });
    }
  }

  // Check 2: Publication Year
  if (source.year && source.year >= 1800 && source.year <= new Date().getFullYear() + 1) {
    checks.push({
      rule: 'Publication Year',
      passed: true,
      message: `Valid 4-digit year (${source.year}) enclosed in parentheses.`,
      severity: 'pass'
    });
  } else {
    checks.push({
      rule: 'Publication Year',
      passed: false,
      message: 'Missing or invalid publication year.',
      severity: 'error',
      fixSuggestion: 'Specify the 4-digit publication year.'
    });
  }

  // Check 3: Article Title Sentence Case
  const words = (source.title || '').trim().split(/\s+/);
  const midCaps = words.slice(1).filter(w => {
    const clean = w.replace(/^[^\w]+|[^\w]+$/g, '');
    return clean.length > 1 && clean[0] === clean[0].toUpperCase() && clean !== clean.toUpperCase();
  });
  
  if (midCaps.length === 0) {
    checks.push({
      rule: 'Title Sentence Case',
      passed: true,
      message: 'Article title is in sentence case (only first word, proper nouns, and post-colon capitalized).',
      severity: 'pass'
    });
  } else {
    checks.push({
      rule: 'Title Sentence Case',
      passed: false,
      message: `Article title uses title case. Capitalized internal words found: "${midCaps.slice(0, 3).join(', ')}".`,
      severity: 'warning',
      fixSuggestion: 'Convert article title to sentence case.'
    });
  }

  // Check 4: Scholarly Journal Container
  if (source.journal && source.journal.trim().length > 2) {
    checks.push({
      rule: 'Journal Title Presence',
      passed: true,
      message: `Published in journal "${source.journal}".`,
      severity: 'pass'
    });
  } else {
    checks.push({
      rule: 'Journal Title Presence',
      passed: false,
      message: 'Missing journal or periodical title.',
      severity: 'error',
      fixSuggestion: 'Provide the full peer-reviewed journal title.'
    });
  }

  // Check 5: Volume & Issue formatting
  if (source.volume) {
    checks.push({
      rule: 'Volume Number',
      passed: true,
      message: `Volume ${source.volume} is present and will be italicized.`,
      severity: 'pass'
    });
  } else {
    checks.push({
      rule: 'Volume Number',
      passed: false,
      message: 'Missing volume number.',
      severity: 'warning',
      fixSuggestion: 'Add journal volume number if published.'
    });
  }

  // Check 6: Pagination Format
  if (source.pages) {
    const hasP = /pp?\.|\s+pages?\b/i.test(source.pages);
    if (!hasP) {
      checks.push({
        rule: 'Page Range Notation',
        passed: true,
        message: `Pages formatted cleanly as "${source.pages}" without "p." or "pp." prefix.`,
        severity: 'pass'
      });
    } else {
      checks.push({
        rule: 'Page Range Notation',
        passed: false,
        message: 'Journal articles must NOT include "p." or "pp." prefixes before page numbers in APA 7th.',
        severity: 'warning',
        fixSuggestion: 'Remove "p." or "pp." prefix.'
      });
    }
  } else {
    checks.push({
      rule: 'Page Range Notation',
      passed: false,
      message: 'Page numbers or article number missing.',
      severity: 'warning',
      fixSuggestion: 'Add page range or article e-locator.'
    });
  }

  // Check 7: DOI HTTPS URL
  if (source.doi && source.doi.startsWith('https://doi.org/10.')) {
    checks.push({
      rule: 'Active HTTPS DOI Format',
      passed: true,
      message: 'DOI is formatted as an active HTTPS hyperlink (https://doi.org/10.xxxx/...).',
      severity: 'pass'
    });
  } else if (source.doi && !source.doi.startsWith('https://doi.org/')) {
    checks.push({
      rule: 'Active HTTPS DOI Format',
      passed: false,
      message: `DOI "${source.doi}" must begin with "https://doi.org/10.", not "doi:" or "http://".`,
      severity: 'error',
      fixSuggestion: 'Convert to https://doi.org/ URL.'
    });
  } else {
    checks.push({
      rule: 'Active HTTPS DOI Format',
      passed: false,
      message: 'No DOI URL provided. APA 7th strongly recommends DOIs for all electronic sources.',
      severity: 'warning',
      fixSuggestion: 'Add direct DOI URL if registered.'
    });
  }

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    sourceId: source.id,
    score,
    isCompliant: score >= 85,
    checks
  };
}

/**
 * Automatically repairs and formats a source to 100% APA 7th compliance
 */
export function autoFixSourceToApa7(source: PeerReviewedSource): PeerReviewedSource {
  const updated = { ...source };

  // 1. Fix author names to "Surname, F. M."
  if (updated.authors && updated.authors.length > 0) {
    updated.authors = updated.authors.map(a => formatAuthorName(a));
  }

  // 2. Fix title to sentence case
  updated.titleSentenceCase = formatToSentenceCase(updated.title);
  
  // 3. Clean pages: remove "p." / "pp." and enforce en-dash
  if (updated.pages) {
    updated.pages = updated.pages.replace(/^pp?\.\s*/i, '').replace(/-/g, '–').trim();
  }

  // 4. Clean DOI: ensure https://doi.org/
  if (updated.doi) {
    let cleanDoi = updated.doi.trim();
    if (cleanDoi.startsWith('doi:')) {
      cleanDoi = cleanDoi.replace(/^doi:\s*/i, '');
    }
    if (cleanDoi.startsWith('http://dx.doi.org/')) {
      cleanDoi = cleanDoi.replace('http://dx.doi.org/', '');
    } else if (cleanDoi.startsWith('https://dx.doi.org/')) {
      cleanDoi = cleanDoi.replace('https://dx.doi.org/', '');
    } else if (cleanDoi.startsWith('https://doi.org/')) {
      cleanDoi = cleanDoi.replace('https://doi.org/', '');
    }
    if (cleanDoi.startsWith('10.')) {
      updated.doi = `https://doi.org/${cleanDoi}`;
    }
  }

  // Recalculate score
  const audit = auditSourceApa7(updated);
  updated.apaComplianceScore = audit.score;

  return updated;
}

/**
 * Formats BibTeX entry for export
 */
export function formatBibtex(source: PeerReviewedSource): string {
  const firstAuthorSurname = source.authors[0] ? source.authors[0].split(',')[0].toLowerCase().replace(/\s+/g, '') : 'author';
  const citeKey = `${firstAuthorSurname}${source.year}`;
  const authorBib = source.authors.join(' and ');

  return `@article{${citeKey},
  author = {${authorBib}},
  title = {${source.titleSentenceCase || source.title}},
  journal = {${source.journal}},
  year = {${source.year}},
  volume = {${source.volume}},
  number = {${source.issue}},
  pages = {${source.pages}},
  doi = {${source.doi.replace('https://doi.org/', '')}}
}`;
}

/**
 * Formats RIS entry for Zotero / Mendeley / EndNote export
 */
export function formatRis(source: PeerReviewedSource): string {
  const lines: string[] = [
    'TY  - JOUR',
    `TI  - ${source.titleSentenceCase || source.title}`
  ];

  for (const a of source.authors) {
    lines.push(`AU  - ${a}`);
  }

  lines.push(`PY  - ${source.year}`);
  lines.push(`JO  - ${source.journal}`);
  if (source.volume) lines.push(`VL  - ${source.volume}`);
  if (source.issue) lines.push(`IS  - ${source.issue}`);
  if (source.pages) {
    const pParts = source.pages.split(/[–-]/);
    if (pParts[0]) lines.push(`SP  - ${pParts[0].trim()}`);
    if (pParts[1]) lines.push(`EP  - ${pParts[1].trim()}`);
  }
  if (source.doi) lines.push(`DO  - ${source.doi.replace('https://doi.org/', '')}`);
  if (source.abstract) lines.push(`AB  - ${source.abstract}`);
  lines.push('ER  - ');

  return lines.join('\n');
}
