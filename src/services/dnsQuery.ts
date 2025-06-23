// Cloudflare DNS over HTTPS API
const DNS_API_BASE = 'https://cloudflare-dns.com/dns-query';

export interface DnsAnswer {
  name: string;
  type: number;
  data: string;
}

export interface DnsResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

export const queryDns = async (domain: string, recordType: string): Promise<DnsResponse> => {
  try {
    const response = await fetch(`${DNS_API_BASE}?name=${domain}&type=${recordType}`, {
      headers: { 'Accept': 'application/dns-json' }
    });

    if (!response.ok) {
      throw new Error(`DNS query failed with status: ${response.status}`);
    }
    // Return the full JSON response for the caller to process
    return await response.json();
  } catch (error) {
    console.error(`DNS query for ${domain} [${recordType}] failed:`, error);
    // Re-throw the error so the calling function knows the request failed and can handle it.
    throw error;
  }
};
