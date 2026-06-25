interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * SEO Competitors MCP — domain ranked keywords via DataForSEO Labs (dataforseo.com)
 *
 * Tools:
 * - seo_domain_ranked_keywords: every keyword a domain ranks for in Google.
 *
 * Auth: DataForSEO HTTP Basic. Pass _apiKey = base64("login:password").
 * Wave 1 = BYO-key only. Wave 2 adds a measured `cost` CostModel + realCogs flag.
 */


const BASE_URL = 'https://api.dataforseo.com';

const tools: McpToolExport['tools'] = [
  {
    name: 'seo_domain_ranked_keywords',
    description:
      'What keywords does `<domain>` rank for — returns the keywords a domain ranks for in Google organic, with search volume, current rank, and ranking URL. Competitor SEO intelligence. Example: seo_domain_ranked_keywords({ target: "nike.com", location_code: 2840, limit: 50, _apiKey: "your-base64-key" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        target: {
          type: 'string',
          description: 'Domain to analyze (no protocol), e.g. "nike.com"',
        },
        location_code: {
          type: 'integer',
          description: 'DataForSEO location code (default 2840 = United States)',
        },
        language_code: {
          type: 'string',
          description: 'Two-letter language code (default "en")',
        },
        limit: {
          type: 'integer',
          description: 'Max keywords to return (default 20, max 100)',
        },
        order_by: {
          type: 'string',
          description: 'Optional sort, e.g. "keyword_data.keyword_info.search_volume,desc"',
        },
        _apiKey: {
          type: 'string',
          description: 'DataForSEO API key = base64("login:password") from your dataforseo.com account',
        },
      },
      required: ['target', '_apiKey'],
    },
  },
];

async function dfsPost(path: string, body: unknown, apiKey: string, tool: string) {
  if (!apiKey) {
    throw new Error(
      `${tool} requires a DataForSEO API key. Pass _apiKey = base64("login:password") from your DataForSEO account (sign up at dataforseo.com). This is a paid data source — bring your own key, or add credits at https://pipeworx.io/account.`,
    );
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `DataForSEO auth failed (HTTP ${res.status}). Check _apiKey is base64("login:password") and your account is funded/verified (data endpoints return 40104 until the account is funded). Re-encode credentials and retry.`,
    );
  }
  if (!res.ok) throw new Error(`DataForSEO ${tool} error: HTTP ${res.status}`);
  const data = (await res.json()) as DfsResponse;
  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO ${tool}: ${data.status_code} ${data.status_message}`);
  }
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20000) {
    throw new Error(`DataForSEO ${tool}: ${task?.status_code ?? 'no task'} ${task?.status_message ?? ''}`.trim());
  }
  return task;
}

interface DfsResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    cost: number;
    result?: Array<Record<string, unknown>> | null;
  }>;
}

async function domainRankedKeywords(args: Record<string, unknown>, apiKey: string) {
  const target = args.target as string;
  if (!target) {
    throw new Error('seo_domain_ranked_keywords requires a `target` domain (e.g. "nike.com", no protocol).');
  }
  const location_code = (args.location_code as number) ?? 2840;
  const language_code = (args.language_code as string) ?? 'en';
  const limit = Math.min(Math.max(Number(args.limit ?? 20), 1), 100);
  const order_by = args.order_by as string | undefined;

  const body: Record<string, unknown> = { target, location_code, language_code, limit };
  if (order_by) body.order_by = [order_by];

  const task = await dfsPost(
    '/v3/dataforseo_labs/google/ranked_keywords/live',
    [body],
    apiKey,
    'seo_domain_ranked_keywords',
  );

  const result = (task.result?.[0] ?? {}) as {
    total_count?: number;
    items?: Array<Record<string, unknown>>;
  };
  const items = (result.items ?? []).map((it) => {
    const kd = (it.keyword_data ?? {}) as Record<string, unknown>;
    const ki = (kd.keyword_info ?? {}) as Record<string, unknown>;
    const rse = (it.ranked_serp_element ?? {}) as Record<string, unknown>;
    const si = (rse.serp_item ?? {}) as Record<string, unknown>;
    return {
      keyword: kd.keyword as string,
      search_volume: (ki.search_volume as number) ?? null,
      rank: (si.rank_group as number) ?? null,
      url: (si.url as string) ?? null,
    };
  });

  return { target, location_code, total: result.total_count ?? null, keywords: items };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  switch (name) {
    case 'seo_domain_ranked_keywords':
      return domainRankedKeywords(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Wave 1 (BYO-only): nominal access meter; user's own key bears DataForSEO COGS.
// Wave 2: replace with measured `cost` CostModel (limit=100) + realCogs gate.
export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
