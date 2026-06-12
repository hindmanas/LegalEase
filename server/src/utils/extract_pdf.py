import fitz
import sys

def main():
    try:
        # Read raw PDF data from stdin
        pdf_data = sys.stdin.buffer.read()
        if not pdf_data:
            print("Error: No data received via stdin", file=sys.stderr)
            sys.exit(1)
            
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
            
        # Write to stdout with utf-8 encoding
        sys.stdout.buffer.write(text.encode('utf-8'))
    except Exception as e:
        print(f"Error extracting PDF: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
