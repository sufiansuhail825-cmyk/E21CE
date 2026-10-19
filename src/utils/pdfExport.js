import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Renders a DOM node to a multi-page A4 PDF and triggers a browser download.
 *
 * Important: we slice the source canvas into one JPEG per output page rather
 * than re-embedding the full-height canvas on every page (which is what a
 * naive position-offset approach does, and which produces multi-hundred-MB
 * files because jsPDF stores the full image once per page).
 */
async function renderToPdf(node) {
  if (!node) return null;

  const sourceCanvas = await html2canvas(node, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#FBF8F2",
    windowWidth: node.scrollWidth,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidthPt = pdf.internal.pageSize.getWidth();
  const pageHeightPt = pdf.internal.pageSize.getHeight();

  // Scale factor: canvas pixels -> PDF points, based on matching widths
  const pxPerPt = sourceCanvas.width / pageWidthPt;
  const pageHeightPx = Math.floor(pageHeightPt * pxPerPt);

  const totalPages = Math.ceil(sourceCanvas.height / pageHeightPx);

  for (let i = 0; i < totalPages; i++) {
    const sliceHeightPx = Math.min(pageHeightPx, sourceCanvas.height - i * pageHeightPx);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = sourceCanvas.width;
    pageCanvas.height = sliceHeightPx;

    const ctx = pageCanvas.getContext("2d");
    ctx.fillStyle = "#FBF8F2";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      sourceCanvas,
      0, i * pageHeightPx, sourceCanvas.width, sliceHeightPx,
      0, 0, sourceCanvas.width, sliceHeightPx
    );

    const sliceData = pageCanvas.toDataURL("image/jpeg", 0.88);
    const sliceHeightPt = (sliceHeightPx / sourceCanvas.width) * pageWidthPt;

    if (i > 0) pdf.addPage();
    pdf.addImage(sliceData, "JPEG", 0, 0, pageWidthPt, sliceHeightPt);
  }

  return pdf;
}

export async function generatePdf(node, filename = "report.pdf") {
  const pdf = await renderToPdf(node);
  if (!pdf) return null;
  pdf.save(filename);
  return pdf;
}

export async function generatePdfBase64(node) {
  const pdf = await renderToPdf(node);
  if (!pdf) return null;
  return pdf.output("datauristring");
}
