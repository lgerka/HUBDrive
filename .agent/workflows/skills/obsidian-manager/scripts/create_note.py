import argparse
import os
import datetime
import re

def sanitize_title(title):
    # Convert to lowercase and replace non-alphanumeric characters with hyphens
    s = title.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def create_note(title, content, tags):
    # Ensure new/ directory exists
    target_dir = "new"
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    filename = f"{sanitize_title(title)}.md"
    filepath = os.path.join(target_dir, filename)

    date_str = datetime.date.today().isoformat()
    tags_list = [t.strip() for t in tags.split(',')] if tags else []
    
    # Format YAML frontmatter
    frontmatter = "---\n"
    frontmatter += f"title: {title}\n"
    frontmatter += f"date: {date_str}\n"
    if tags_list:
        frontmatter += "tags:\n"
        for tag in tags_list:
            frontmatter += f"  - {tag}\n"
    frontmatter += "---\n\n"

    full_content = frontmatter + content + "\n"

    # Write file
    with open(filepath, "w") as f:
        f.write(full_content)
    
    print(f"Note created at: {filepath}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new Obsidian note.")
    parser.add_argument("title", help="Title of the note")
    parser.add_argument("content", help="Content of the note")
    parser.add_argument("--tags", help="Comma-separated tags", default="")
    
    args = parser.parse_args()
    create_note(args.title, args.content, args.tags)
