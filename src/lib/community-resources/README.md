# Community Resources for HSC AI Chat Bot

This folder contains community documents that the AI chat bot can access to answer questions about Hillsmere Shores community information.

## Folder Structure

```
src/lib/community-resources/
├── index.json                 # Master index of all documents
├── hoa/                      # HOA & Governance documents
├── codes-ordinances/         # Building codes, zoning, permits
├── services/                 # Community services, utilities
├── emergency/               # Emergency contacts, procedures
├── forms/                   # Community forms, applications
├── meetings/                # Meeting agendas, minutes
└── announcements/           # Community announcements, newsletters
```

## How to Add New Documents

### 1. Upload Files
Place your documents in the appropriate subfolder:
- **PDFs**: Original scanned documents
- **TXT files**: Plain text versions (for AI processing)
- **MD files**: Markdown versions (for structured content)

### 2. Update the Index
After adding files, update `index.json` to include:
```json
{
  "filename": "document-name.pdf",
  "title": "Document Title",
  "description": "Brief description of contents",
  "category": "hoa",
  "date_added": "2024-01-01",
  "keywords": ["keyword1", "keyword2"],
  "content_summary": "Brief summary of key points"
}
```

### 3. File Naming Convention
Use descriptive, lowercase filenames with hyphens:
- `hoa-bylaws-2024.pdf`
- `building-permit-process.txt`
- `emergency-contacts.md`

## Supported File Types

- **PDF**: Original documents (will be processed for text extraction)
- **TXT**: Plain text (fastest AI processing)
- **MD**: Markdown (structured content)
- **DOC/DOCX**: Word documents (will be converted)

## How the AI Uses These Files

1. **Query Analysis**: AI determines which category is most relevant
2. **Document Search**: Searches through relevant category keywords
3. **Content Retrieval**: Extracts relevant sections from documents
4. **Response Generation**: Combines document info with Franklin personality

## Categories Explained

- **hoa/**: Bylaws, board minutes, governance documents
- **codes-ordinances/**: Building codes, zoning variances, permits
- **services/**: Utilities, trash, maintenance, contractors
- **emergency/**: Emergency contacts, procedures, safety
- **forms/**: Applications, request forms, community forms
- **meetings/**: Meeting agendas, minutes, schedules
- **announcements/**: General announcements, newsletters

## Tips for Best Results

1. **Include summaries**: Add brief content summaries to index.json
2. **Use keywords**: Include relevant search terms
3. **Keep current**: Update documents regularly
4. **Text format**: Convert PDFs to text when possible for better AI processing 