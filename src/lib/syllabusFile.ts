/// <reference types="vite/client" />
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/** Extract text locally. The original document never leaves the browser. */
export async function readSyllabusFile(file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Choose a document smaller than 15 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text: string;
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
    const document = await pdfjs.getDocument({
      data: await file.arrayBuffer(),
      isEvalSupported: false,
    }).promise;
    try {
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        let previousY: number | undefined;
        const lines: string[] = [];
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const y = item.transform[5];
          if (previousY !== undefined && Math.abs(y - previousY) > 3)
            lines.push("\n");
          lines.push(item.str, item.hasEOL ? "\n" : " ");
          previousY = item.hasEOL ? undefined : y;
        }
        pages.push(lines.join(""));
      }
      text = pages.join("\n\n");
    } finally {
      await document.destroy();
    }
  } else if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    text = result.value;
  } else if (["txt", "md"].includes(extension ?? "")) {
    text = await file.text();
  } else {
    throw new Error(
      "Choose a PDF, DOCX, TXT, or Markdown file. Save older Word documents as DOCX first.",
    );
  }
  if (!text.trim())
    throw new Error(
      "No readable text found. For a scanned PDF, run OCR first or paste the syllabus text below.",
    );
  return text.trim();
}
