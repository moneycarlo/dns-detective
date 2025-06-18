// Cloudflare DNS over HTTPS API
const DNS_API_BASE = 'https://cloudflare-dns.com/dns-query';

interface DnsResponse {
  Status: number;
  Answer?: Array<{
    name: string;
    type: number;
    data: string;
  }>;
}

export const queryDnsRecord = async (domain: string, recordType: string): Promise<string | null> => {
  try {
    const response = await fetch(`${DNS_API_BASE}?name=${domain}&type=${recordType}`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DNS query failed with status: ${response.status}`);
    }
    
    const data: DnsResponse = await response.json();
    
    if (data.Status !== 0 || !Array.isArray(data.Answer) || data.Answer.length === 0) {
      return null;
    }
    
    // For TXT records, we need to find the specific record we're looking for
    if (recordType === 'TXT') {
      const findTxtRecord = (searchText: string) => {
        const found = data.Answer?.find(record => 
          record && typeof record.data === 'string' && record.data.replace(/"/g, '').includes(searchText)
        );
        return found ? found.data.replace(/"/g, '') : null;
      }

      if (domain.startsWith('_dmarc.')) {
        return findTxtRecord('v=DMARC1');
      }
      if (domain.startsWith('default._bimi.')) {
        return findTxtRecord('v=BIMI1');
      }
      // Default to SPF for other TXT queries on the root domain
      return findTxtRecord('v=spf1');
    }
    
    // For other record types, return the first record
    if (data.Answer[0] && typeof data.Answer[0].data === 'string') {
        return data.Answer[0].data.replace(/"/g, '');
    }

    return null;
  } catch (error) {
    console.error(`DNS query error for ${domain} (${recordType}):`, error);
    throw new Error(`DNS query failed for ${domain}. Please check the domain and network connection.`);
  }
};
