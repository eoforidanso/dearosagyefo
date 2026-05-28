#!/usr/bin/env python3
import os
import json
import PyPDF2

# List of PDF files to process
pdf_files = [
    'THE PERSISTENT CHALLENGE OF SMALL-SCALE MINING.pdf',
    'A NATIONS DRS DRAMAS AND DELUSIONS.pdf',
    'Dear Osagyefo,.pdf',
    'Letter XX.pdf',
    'GHOST OF NEW YEAR\'S RESOLUTIONS.pdf',
    'ANKWANOMA OSP: THE SINGING PROSECUTOR AND THE BAILED-OUT LAWYER.pdf'
]

def extract_pdf_text(file_path):
    """Extract text from a PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ''
            
            for page in pdf_reader.pages:
                text += page.extract_text() + '\n'
            
            return text.strip()
    except Exception as e:
        print(f"Error extracting {file_path}: {str(e)}")
        return None

def main():
    print('📄 Extracting text from PDF letters...\n')
    
    results = []
    
    for filename in pdf_files:
        file_path = os.path.join(os.path.dirname(__file__), filename)
        
        if not os.path.exists(file_path):
            print(f'⚠️  File not found: {filename}')
            continue
        
        print(f'Processing: {filename}')
        text = extract_pdf_text(file_path)
        
        if text:
            # Extract title from filename
            title = filename.replace('.pdf', '').replace('_', ' ')
            
            results.append({
                'filename': filename,
                'title': title,
                'text': text,
                'length': len(text)
            })
            
            print(f'✅ Extracted {len(text)} characters\n')
    
    # Save results to JSON file
    output_path = os.path.join(os.path.dirname(__file__), 'extracted-letters.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f'\n✨ Extraction complete! Saved to: extracted-letters.json')
    print(f'Total letters extracted: {len(results)}')
    
    # Print summary
    print('\n📊 Summary:')
    for idx, letter in enumerate(results, 1):
        print(f'{idx}. {letter["title"]}')
        print(f'   Characters: {letter["length"]}')
        preview = letter['text'][:100].replace('\n', ' ')
        print(f'   Preview: {preview}...')
        print('')

if __name__ == '__main__':
    main()
