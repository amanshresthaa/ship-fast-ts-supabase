#!/usr/bin/env python3
"""
A simple script to collect all code files from a project, including JSON files
by default. Only excludes Markdown (.md) files.
Can limit quiz JSON files to only 3 questions per quiz type.

Usage:
  python3 collect_code_for_llm.py
  python3 collect_code_for_llm.py --output-dir=./output
  python3 collect_code_for_llm.py --exclude large-data.json another-file.json
  python3 collect_code_for_llm.py --limit-quiz-questions 3
"""

import os
import json
import datetime
from pathlib import Path
import argparse
import sys


def is_quiz_file(filepath, content):
    """Determines if a JSON file is a quiz file by checking for specific structures."""
    try:
        data = json.loads(content)
        # Check for quiz structure pattern
        if 'quiz' in data and 'questions' in data['quiz']:
            return True
        # Check for questions array pattern (from separated quiz files)
        if 'questions' in data and isinstance(data['questions'], list):
            return True
        return False
    except (json.JSONDecodeError, TypeError):
        return False

def limit_quiz_questions(content, max_questions=3):
    """Limits the number of questions in a quiz file to max_questions."""
    try:
        data = json.loads(content)
        
        # Handle quiz structure
        if 'quiz' in data and 'questions' in data['quiz']:
            if len(data['quiz']['questions']) > max_questions:
                data['quiz']['questions'] = data['quiz']['questions'][:max_questions]
        
        # Handle questions array structure (from separated quiz files)
        elif 'questions' in data and isinstance(data['questions'], list):
            if len(data['questions']) > max_questions:
                data['questions'] = data['questions'][:max_questions]
        
        return json.dumps(data, indent=2)
    except (json.JSONDecodeError, TypeError):
        # If there's an error, return the original content
        return content

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Collect code files for LLM analysis.')
    parser.add_argument('--output-dir', default='.', help='Directory to save output files')
    parser.add_argument('--exclude', nargs='+', default=[], 
                      help='JSON files to exclude (all other JSON files will be included)')
    parser.add_argument('--root-dir', default='.', help='Root directory of the project')
    parser.add_argument('--limit-quiz-questions', type=int, default=0,
                      help='Limit the number of questions in quiz files (0 = no limit)')
    args = parser.parse_args()

    # Normalize paths
    root_dir = Path(args.root_dir).absolute()
    output_dir = Path(args.output_dir).absolute()
    output_dir.mkdir(exist_ok=True)

    # Generate timestamp for output files
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    json_outfile = output_dir / f"cognitive_quiz_code_{timestamp}.json"
    md_outfile = output_dir / f"cognitive_quiz_code_{timestamp}.md"
    
    print(f"Project root: {root_dir}")
    print(f"Output directory: {output_dir}")
    print(f"JSON files to exclude: {', '.join(args.exclude)}")
    if args.limit_quiz_questions > 0:
        print(f"Limiting quiz files to {args.limit_quiz_questions} questions per quiz type")
    
    # Collection stats
    stats = {
        'total_files': 0,
        'included_files': 0,
        'json_excluded': 0,
        'markdown_excluded': 0,
        'binary_excluded': 0,
        'ignored_dirs_excluded': 0,
        'other_excluded': 0,
        'quiz_files_limited': 0
    }
    
    collected_files = []
    errors = []
    
    # Directories to ignore
    ignore_dirs = ['.git', 'node_modules', '.next', 'dist', 'build']
    
    # Extensions to treat as binary
    binary_extensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.svg',
        '.mp4', '.webm', '.mp3', '.ogg', '.wav',
        '.pdf', '.docx', '.xlsx', '.pptx',
        '.zip', '.tar', '.gz', '.7z',
        '.ttf', '.woff', '.woff2', '.eot'
    ]
    
    # Walk through the directory tree
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip ignored directories
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        
        for filename in filenames:
            stats['total_files'] += 1
            filepath = Path(dirpath) / filename
            rel_path = filepath.relative_to(root_dir)
            rel_path_str = str(rel_path).replace(os.sep, '/')
            
            # Skip files in ignored directories
            if any(ignore_dir in str(filepath) for ignore_dir in ignore_dirs):
                stats['ignored_dirs_excluded'] += 1
                continue
                
            # Handle JSON files
            if filepath.suffix.lower() == '.json':
                # Skip JSON files if they're in the exclude list
                if any(exclude_file in filepath.name for exclude_file in args.exclude):
                    print(f"Excluding JSON file: {rel_path_str}")
                    stats['json_excluded'] += 1
                    continue
            
            # Handle Markdown files - exclude all .md files
            if filepath.suffix.lower() == '.md':
                print(f"Excluding Markdown file: {rel_path_str}")
                stats['markdown_excluded'] += 1
                continue
            
            # Skip binary files
            if filepath.suffix.lower() in binary_extensions:
                print(f"Skipping binary file: {rel_path_str}")
                stats['binary_excluded'] += 1
                continue
                
            # Read the file
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Limit quiz JSON files if requested
                if args.limit_quiz_questions > 0 and filepath.suffix.lower() == '.json':
                    if is_quiz_file(filepath, content):
                        original_content = content
                        content = limit_quiz_questions(content, args.limit_quiz_questions)
                        if content != original_content:
                            stats['quiz_files_limited'] += 1
                            print(f"Limited quiz questions in: {rel_path_str}")
                    
                collected_files.append({
                    'filepath': rel_path_str,
                    'content': content
                })
                
                stats['included_files'] += 1
                print(f"Collected: {rel_path_str}")
                
            except UnicodeDecodeError:
                # Skip binary files that weren't caught by extension
                print(f"Skipping binary file (decode error): {rel_path_str}")
                stats['binary_excluded'] += 1
            except Exception as e:
                error_msg = f"Error reading {rel_path_str}: {e}"
                print(f"Error: {error_msg}")
                errors.append(error_msg)
    
    # Calculate other excluded files
    stats['other_excluded'] = (stats['total_files'] - stats['included_files'] - 
                              stats['json_excluded'] - stats['markdown_excluded'] -
                              stats['binary_excluded'] - stats['ignored_dirs_excluded'])
    
    # Create project structure
    structure = sorted([f['filepath'] for f in collected_files])
    
    # Create output JSON
    output = {
        'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'project_structure': structure,
        'files': collected_files
    }
    
    # Write JSON output
    with open(json_outfile, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)
    
    # Write Markdown output
    with open(md_outfile, 'w', encoding='utf-8') as f:
        # Write header
        f.write(f"# Cognitive Quiz Codebase\n\n")
        f.write(f"Generated on: {output['date']}\n\n")
        
        # Write project structure
        f.write("## Project Structure\n\n```\n")
        for path in structure:
            f.write(f"{path}\n")
        f.write("```\n\n")
        
        # Write file contents
        f.write("## File Contents\n\n")
        for file_data in collected_files:
            f.write(f"### {file_data['filepath']}\n\n")
            extension = os.path.splitext(file_data['filepath'])[1][1:] or 'text'
            
            # Map file extensions to markdown code block language identifiers
            extension_map = {
                'js': 'javascript',
                'jsx': 'jsx',
                'ts': 'typescript',
                'tsx': 'tsx',
                'py': 'python',
                'css': 'css',
                'scss': 'scss',
                'html': 'html',
                'md': 'markdown',
                'json': 'json',
                'yaml': 'yaml',
                'yml': 'yaml',
                'sh': 'bash',
                'bash': 'bash',
                'zsh': 'bash'
            }
            
            lang = extension_map.get(extension.lower(), extension)
            f.write(f"```{lang}\n{file_data['content']}\n```\n\n")
    
    # Print summary
    print("\nCollection complete:")
    print(f"- Total files scanned: {stats['total_files']}")
    print(f"- Files included: {stats['included_files']}")
    print(f"- JSON files excluded: {stats['json_excluded']}")
    print(f"- Markdown files excluded: {stats['markdown_excluded']}")
    print(f"- Binary files excluded: {stats['binary_excluded']}")
    print(f"- Files in ignored directories: {stats['ignored_dirs_excluded']}")
    print(f"- Other files excluded: {stats['other_excluded']}")
    if args.limit_quiz_questions > 0:
        print(f"- Quiz files limited to {args.limit_quiz_questions} questions: {stats['quiz_files_limited']}")
    
    print(f"\nOutput files created:")
    print(f"- JSON: {json_outfile}")
    print(f"- Markdown: {md_outfile}")

if __name__ == "__main__":
    main()