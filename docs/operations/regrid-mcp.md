# Regrid MCP setup

The repository includes `.mcp.json` with a Regrid MCP server entry. It resolves the credential from the `REGRID_TOKEN` environment variable and never stores the token in the repository.

## Local setup

1. Create or copy a Regrid sandbox/API token from the Regrid account API Access page.
2. Register it as a user-level environment variable named `REGRID_TOKEN`.
3. Restart the MCP-compatible client so it inherits the updated environment.
4. Use the Regrid MCP endpoint at `https://support.regrid.com/mcp`.

The token must have parcel API access for parcel records to be returned. Sandbox tokens are appropriate for development and should be rotated before production. The application should use the Regrid REST API through a server-side function for runtime requests; MCP is intended for AI-assisted exploration and query construction.
