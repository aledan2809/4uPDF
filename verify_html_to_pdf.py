#!/usr/bin/env python3
"""Proof that /api/html-to-pdf paginates instead of silently dropping content.

Runs the conversion the endpoint performs, on documents built to overflow one page, and asserts
that every line survives. The bug this guards against reported success: a 60-line invoice came back
as `{"status": "done", "pages": 1}` with 3 lines and the total silently missing.

Usage:  python3 verify_html_to_pdf.py            (local, exercises the conversion directly)
        python3 verify_html_to_pdf.py --live URL (also drives the deployed endpoint end-to-end)
"""
import sys
import tempfile
from pathlib import Path

import fitz

MAX_HTML_PDF_PAGES = 200
failures = 0


def check(ok: bool, label: str) -> None:
    global failures
    print(f"  {'✅' if ok else '🔴'} {label}")
    if not ok:
        failures += 1


def build_invoice(n_lines: int) -> str:
    rows = "\n".join(
        f"<tr><td>{i}</td><td>Serviciu abonament linia {i} — descriere suficient de lunga "
        f"cat sa ocupe spatiu real pe pagina</td><td>1</td><td>49,00</td><td>19%</td>"
        f"<td>58,31</td></tr>"
        for i in range(1, n_lines + 1)
    )
    return (
        "<html><body><h1>FACTURA FBL-0001</h1>"
        "<p>Furnizor: Fabulosos SRL — Client: Rad Val SRL</p>"
        '<table border="1"><tr><th>#</th><th>Descriere</th><th>Cant</th><th>Pret</th>'
        f"<th>TVA</th><th>Total</th></tr>{rows}</table>"
        "<h2>TOTAL_FINAL_MARKER — Total de plata: 3498,60 RON</h2></body></html>"
    )


def convert(html: str, out: Path) -> int:
    """The endpoint's conversion, verbatim in shape (see api.py html_to_pdf)."""
    story = fitz.Story(html=html)
    writer = fitz.DocumentWriter(str(out))
    mediabox = fitz.paper_rect("a4")
    where = mediabox + (36, 36, -36, -36)
    pages, more = 0, 1
    while more:
        device = writer.begin_page(mediabox)
        more, _ = story.place(where)
        story.draw(device)
        writer.end_page()
        pages += 1
        if pages > MAX_HTML_PDF_PAGES:
            writer.close()
            raise RuntimeError("runaway pagination")
    writer.close()
    return pages


def text_of(path: Path) -> str:
    doc = fitz.open(path)
    try:
        return "\n".join(p.get_text() for p in doc)
    finally:
        doc.close()


def main() -> None:
    tmp = Path(tempfile.mkdtemp())

    print("\npagination:")
    for n in (5, 60, 300):
        out = tmp / f"inv_{n}.pdf"
        pages = convert(build_invoice(n), out)
        txt = text_of(out)
        missing = [i for i in range(1, n + 1) if f"linia {i} " not in txt]
        check(not missing, f"{n} lines → {pages} page(s), none missing" + (f" (missing {missing[:5]})" if missing else ""))
        check("TOTAL_FINAL_MARKER" in txt, f"{n} lines → the TOTAL line survives")

    print("\nsingle-page documents still produce one page:")
    out = tmp / "short.pdf"
    pages = convert("<html><body><p>O singura linie.</p></body></html>", out)
    check(pages == 1, f"a short document is still 1 page (got {pages})")
    check("O singura linie" in text_of(out), "…and its text is there")

    print("\nthe old behaviour would have failed these:")
    # Reproduce the previous implementation and show it losing content — so the check above is
    # demonstrably testing something, not passing by luck.
    old_out = tmp / "old.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_htmlbox(page.rect + fitz.Rect(36, 36, -36, -36), build_invoice(60))
    doc.save(str(old_out))
    doc.close()
    old_txt = text_of(old_out)
    check(
        "TOTAL_FINAL_MARKER" not in old_txt,
        "the single-page implementation really did drop the TOTAL line (bug reproduced)",
    )

    if "--live" in sys.argv:
        import json
        import urllib.request
        import urllib.parse

        base = sys.argv[sys.argv.index("--live") + 1].rstrip("/")
        print(f"\nlive endpoint {base}:")
        body = urllib.parse.urlencode({"html_content": build_invoice(60)}).encode()
        req = urllib.request.Request(f"{base}/api/html-to-pdf", data=body)
        with urllib.request.urlopen(req, timeout=120) as r:
            res = json.load(r)
        check(res.get("status") == "done", f"conversion reported done ({res.get('status')})")
        check(int(res.get("pages", 0)) > 1, f"reported more than one page (got {res.get('pages')})")
        with urllib.request.urlopen(f"{base}{res['download_url']}", timeout=120) as r:
            live = tmp / "live.pdf"
            live.write_bytes(r.read())
        live_txt = text_of(live)
        check("TOTAL_FINAL_MARKER" in live_txt, "the TOTAL line is present in the served PDF")
        missing = [i for i in range(1, 61) if f"linia {i} " not in live_txt]
        check(not missing, f"all 60 lines present in the served PDF (missing {missing[:5]})")

    print(f"\n{'🔴 ' + str(failures) + ' check(s) failed' if failures else '✅ all checks passed'}")
    sys.exit(1 if failures else 0)


main()
