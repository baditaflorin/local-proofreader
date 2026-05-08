# Static Data

Mode A uses static assets only.

Current assets:

- `/version.json`: build version, commit, dirty flag, and build time.
- `/dictionaries/en.aff`: Hunspell affix data when packaged.
- `/dictionaries/en.dic`: Hunspell dictionary data when packaged.

Schema versioning:

Breaking static asset changes use versioned paths such as `/data/v2/`. No scheduled data generation exists in v1.
