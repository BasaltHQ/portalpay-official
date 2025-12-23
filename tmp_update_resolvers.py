from pathlib import Path
import re

path = Path('src/lib/graphql/resolvers.ts')
text = path.read_text()

helpers = """function isPopulatedSupplier(value: unknown): boolean {\n  if (!value || typeof value !== \"object\") {\n    return false;\n  }\n  const candidate = value as Record[str\n"""
