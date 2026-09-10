# Report languages table

Apply the uploaded SQL as one new migration, exactly as written, then publish.

## What the migration does

- Creates a `report_languages` table listing the languages a report can be written in (code, native label, English label, script, sort order, on/off switch).
- Seeds seven languages, all switched on: English, Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam.
- Keeps an "updated at" timestamp current automatically.
- Lets anyone read only the languages that are switched on; changes are restricted to backend/admin processes.
- Links existing orders to this list and adds an index so the admin can filter orders by language.

## Scope

- No application files are touched. No code changes, no UI changes.
- The SQL is applied verbatim: no renames, no extra tables, columns, policies, or seed rows.

## One thing to note

The SQL includes a read rule for visitors but no explicit table-access grant. If reading the list from the app returns a permission error afterwards, a follow-up one-line grant will be needed. I will not add it now, as instructed.

## After the migration

Publish the site so the live version reflects the current build.
