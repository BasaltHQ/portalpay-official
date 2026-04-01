import sys
import PyPDF2

def read_pdf(file_path):
    with open(file_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if "init" in line.lower() or "connect" in line.lower() or "printerapi" in line.lower() or "usbapi" in line.lower():
                try:
                    start = max(0, i - 1)
                    end = min(len(lines), i + 2)
                    for j in range(start, end):
                        print(f"[{j}]: {lines[j].strip().encode('utf-8', 'ignore').decode('utf-8')}")
                    print("---")
                except Exception:
                    pass

if __name__ == "__main__":
    if len(sys.argv) > 1:
        read_pdf(sys.argv[1])
