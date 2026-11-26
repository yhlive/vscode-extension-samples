#!/usr/bin/env python3
"""Verify the three SVGs downloaded from 04-release-export.excalidraw."""

import argparse
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile


EXPECTED = {
    "01-Release-QA.svg": "LOGIN SMOKE CHECK",
    "02-Release-QA.svg": "PAYMENT SMOKE CHECK",
    "03-Résumé.svg": "HANDOFF ONLY",
}


def require(condition, message):
    if not condition:
        raise SystemExit(f"FAIL: {message}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    with ZipFile(args.archive) as archive:
        require(archive.testzip() is None, "Invalid ZIP checksum")
        require(
            archive.namelist() == list(EXPECTED),
            f"Expected these three SVGs in order: {', '.join(EXPECTED)}. "
            f"Found: {', '.join(archive.namelist())}",
        )
        for name, expected in EXPECTED.items():
            root = ElementTree.fromstring(archive.read(name))
            require(root.tag == "{http://www.w3.org/2000/svg}svg", f"{name} has no SVG root")
            require(root.attrib.get("viewBox") == "0 0 410 250", f"{name} has incorrect bounds")
            text = " ".join("".join(node.itertext()) for node in root.findall(".//{*}text"))
            require(expected in text, f"{name} is missing {expected}")
            require("DO NOT EXPORT" not in text, f"{name} includes the outside note")
            for other in EXPECTED.values():
                if other != expected:
                    require(other not in text, f"{name} includes a different frame's content")
            print(f"PASS  {name} | 410 × 250 | {expected}")
    print("PASS  3 SVGs, valid ZIP, exports isolated by frame")


if __name__ == "__main__":
    main()
