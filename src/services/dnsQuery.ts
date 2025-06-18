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
      console.error(`DNS query for ${domain} [${recordType}] failed with status: ${response.status}`);
      return null; // Don't throw, allow analysis to continue
    }
    
    // Handle cases where the response might not be valid JSON or is empty
    const responseText = await response.text();
    if (!responseText) {
      return null;
    }
    const data: DnsResponse = JSON.parse(responseText);
    
    if (data.Status !== 0 || !Array.isArray(data.Answer) || data.Answer.length === 0) {
      return null;
    }
    
    // For TXT records, find the specific record we're looking for
    if (recordType === 'TXT') {
      const findTxtRecord = (searchText: string) => {
        const found = data.Answer?.find(record => 
          record && typeof record.data === 'string' && record.data.replace(/"/g, '').includes(searchText)
        );
        return found ? found.data.replace(/"/g, '') : null;
      };

      if (domain.startsWith('_dmarc.')) {
        return findTxtRecord('v=DMARC1');
      }
      if (domain.startsWith('default._bimi.')) {
        return findTxtRecord('v=BIMI1');
      }
      // Default to SPF for other TXT queries
      const spfRecord = findTxtRecord('v=spf1');
      if (spfRecord) return spfRecord;
      
      // Fallback for domains with multiple TXT records where the first isn't the one we want.
      const genericTxt = data.Answer?.find(r => r && typeof r.data === 'string');
      return genericTxt ? genericTxt.data.replace(/"/g, '') : null;
    }
    
    // For other record types (not currently used but good to have)
    if (data.Answer[0] && typeof data.Answer[0].data === 'string') {
        return data.Answer[0].data.replace(/"/g, '');
    }

    return null;
  } catch (error) {
    console.error(`DNS query or parsing error for ${domain} (${recordType}):`, error);
    return null; // Return null on any failure to prevent crashing the application
  }
};
