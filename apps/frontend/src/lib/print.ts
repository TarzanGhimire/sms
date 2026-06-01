/**
 * Print/save-as-PDF a single DOM element by opening it in a standalone window.
 *
 * Why a new window instead of window.print():
 *  - window.print() inside an embedded iframe/webview is often blocked
 *    ("this app doesn't support print preview").
 *  - A popup is a top-level browsing context, so the browser's native
 *    print / "Save as PDF" works reliably.
 *  - Only the target element is included, so the sidebar/header are excluded.
 */
export function printElement(el: HTMLElement | null, title: string) {
  if (!el) return;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Please allow pop-ups for this site to print or save as PDF.');
    return;
  }

  // Copy the app's stylesheets so the printed document keeps its styling.
  const styleTags = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style'),
  )
    .map((node) => node.outerHTML)
    .join('\n');

  // Force the "light" theme in the print window for clean black-on-white output.
  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html class="light" lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${styleTags}
  <style>
    html, body {
      background: #ffffff !important;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { margin: 14mm; }
  </style>
</head>
<body>${el.outerHTML}</body>
</html>`);
  win.document.close();
  win.focus();

  // Give styles & web fonts a moment to load before invoking print.
  const triggerPrint = () => {
    win.print();
    // Close shortly after the print dialog is dismissed.
    setTimeout(() => win.close(), 300);
  };

  if (win.document.readyState === 'complete') {
    setTimeout(triggerPrint, 450);
  } else {
    win.onload = () => setTimeout(triggerPrint, 450);
  }
}
