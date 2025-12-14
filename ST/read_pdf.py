import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import pypdf
except ImportError:
    print("Installing pypdf...")
    install("pypdf")
    import pypdf

def read_pdf(path):
    try:
        reader = pypdf.PdfReader(path)
        print(f"Total Pages: {len(reader.pages)}")
        
        # Extract text from first 10 pages for overview
        print("--- HEADER / OVERVIEW ---")
        for i in range(min(5, len(reader.pages))):
            print(f"Page {i+1}:")
            print(reader.pages[i].extract_text())
            print("-" * 20)

        # Search for "해외" (Overseas) keyword
        print("\n--- SEARCH: '해외' ---")
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if "해외" in text or "미국" in text:
                print(f"Found in Page {i+1}:")
                # Print context (first 500 chars of page)
                print(text[:1000]) 
                print("..." + "-" * 20)
                if i > 20: break # Avoid too much output

    except Exception as e:
        print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    read_pdf("C:\\AG\\ST\\키움 REST API 문서.pdf")
