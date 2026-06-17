import fitz
import sys
import os

def main():
    try:
        if len(sys.argv) > 1:
            pdf_path = sys.argv[1]
            if not os.path.exists(pdf_path):
                print(f"Error: File not found at {pdf_path}", file=sys.stderr)
                sys.exit(1)
            doc = fitz.open(pdf_path)
        else:
            # Fallback: Read raw PDF data from stdin
            pdf_data = sys.stdin.buffer.read()
            if not pdf_data:
                print("Error: No data received via stdin or arguments", file=sys.stderr)
                sys.exit(1)
            doc = fitz.open(stream=pdf_data, filetype="pdf")
            
        total_pages = len(doc)
        text = ""
        print(f"PROGRESS:START Total pages: {total_pages}", file=sys.stderr)
        sys.stderr.flush()
        
        for i, page in enumerate(doc):
            text += page.get_text()
            percent_remaining = ((total_pages - (i + 1)) / total_pages) * 100
            print(f"PROGRESS:PAGE {i+1}/{total_pages} ({percent_remaining:.1f}% remaining)", file=sys.stderr)
            sys.stderr.flush()
            
        # Write to stdout with utf-8 encoding
        sys.stdout.buffer.write(text.encode('utf-8'))
    except Exception as e:
        print(f"Error extracting PDF: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
