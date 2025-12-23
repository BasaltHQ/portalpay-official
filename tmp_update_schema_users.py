from pathlib import Path
path = Path('src/lib/graphql/schema.ts')
text = path.read_text()
if "type User {" not in text:
    marker = "  scalar JSON\n\n"
    if marker not in text:
        marker = "  scalar JSON\r\n\r\n"
    if marker in text:
        user_type = "  type User {\n    id: ID!\n    name: String!\n    email: String!\n    role: String!\n    avatar: String\n    isActive: Boolean\n    lastLogin: Date\n    permissions: [String!]\n    createdAt: Date!\n    updatedAt: Date!\n  }\n\n"
        text = text.replace(marker, marker + user_type, 1)
    else:
        raise SystemExit('scalar JSON marker not found')

if "type Query {\n    me:" not in text:
    text = text.replace("  type Query {\n", "  type Query {\n    me: User\n    users: [User!]!\n", 1)

if "createUser(" not in text:
    text = text.replace("  type Mutation {\n", "  type Mutation {\n    createUser(input: CreateUserInput!): User!\n    updateUser(id: ID!, input: UpdateUserInput!): User!\n    deleteUser(id: ID!): Boolean!\n\n", 1)

if "input CreateUserInput" not in text:
    marker = "  input ShiftInput {\n"
    if marker not in text:
        marker = "  input ShiftInput {\r\n"
    inputs = "  input CreateUserInput {\n    name: String!\n    email: String!\n    role: String\n    avatar: String\n    permissions: [String!]\n    isActive: Boolean\n  }\n\n  input UpdateUserInput {\n    name: String\n    email: String\n    role: String\n    avatar: String\n    permissions: [String!]\n    isActive: Boolean\n  }\n\n"
    if marker in text:
        text = text.replace(marker, inputs + marker, 1)
    else:
        raise SystemExit('ShiftInput marker not found')

path.write_text(text)
