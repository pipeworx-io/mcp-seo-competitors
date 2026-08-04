# mcp-seo-competitors

SEO Competitors MCP — domain ranked keywords via DataForSEO Labs (dataforseo.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `seo_domain_ranked_keywords` | What keywords does `<domain>` rank for — returns the keywords a domain ranks for in Google organic, with search volume, current rank, and ranking URL. Competitor SEO intelligence. Example: seo_domain_ranked_keywords({ target: "nike.com", location_code: 2840, limit: 50, _apiKey: "your-base64-key" }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "seo-competitors": {
      "url": "https://gateway.pipeworx.io/seo-competitors/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Seo Competitors data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
