# Election Data Directory

This directory contains election data files that the chatbot will automatically load and use to answer questions.

## Supported File Formats

- **JSON files** (.json) - Structured election data
- **CSV files** (.csv) - Tabular data like candidate lists, polling locations
- **Excel files** (.xlsx, .xls) - Spreadsheet data
- **PDF files** (.pdf) - Official election documents, voter guides
- **Image files** (.png, .jpg, .jpeg) - Ballot samples, infographics

## Sample Files

- `election-info.json` - Main election information including dates, candidates, ballot measures
- `candidates.csv` - Detailed candidate information in tabular format

## File Naming Conventions

- Use descriptive names: `candidates.csv`, `polling-locations.json`, `ballot-measures.pdf`
- The system will automatically detect and load all supported files in this directory
- Files are processed in alphabetical order

## Adding Your Own Data

1. Place your election data files in this directory
2. Restart the application to load new files
3. The chatbot will automatically incorporate the data into its responses

## Data Structure Examples

### JSON Structure
```json
{
  "election": {
    "name": "Election Name",
    "date": "YYYY-MM-DD"
  },
  "candidates": [...],
  "polling_locations": [...]
}
```

### CSV Structure
```csv
Office,Name,Party,Experience
President,John Doe,Party Name,Background info
```