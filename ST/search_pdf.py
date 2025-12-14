import pypdf

def search_pdf(path, keywords):
    try:
        reader = pypdf.PdfReader(path)
        print(f"Searching for {keywords} in {len(reader.pages)} pages...")
        found = False
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            for kw in keywords:
                if kw in text:
                    print(f"Found '{kw}' in Page {i+1}")
                    print(text[text.find(kw)-100 : text.find(kw)+100])
                    found = True
        if not found:
            print("No matches found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_pdf("C:\\AG\\ST\\키움 REST API 문서.pdf", ["나스닥", "미국", "Global", "NASDAQ"])
