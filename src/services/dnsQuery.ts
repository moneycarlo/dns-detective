
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
      throw new Error(`DNS query failed: ${response.status}`);
    }
    
    const data: DnsResponse = await response.json();
    
    if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
      return null;
    }
    
    // For TXT records, we need to find the specific record we're looking for
    if (recordType === 'TXT') {
      // For SPF records on the main domain, look for v=spf1
      if (!domain.startsWith('_dmarc.') && !domain.startsWith('default._bimi.')) {
        const spfRecord = data.Answer.find(record => 
          record.data.replace(/"/g, '').includes('v=spf1')
        );
        if (spfRecord) {
          return spfRecord.data.replace(/"/g, '');
        }
      }
      
      // For DMARC records, look for v=DMARC1
      if (domain.startsWith('_dmarc.')) {
        const dmarcRecord = data.Answer.find(record => 
          record.data.replace(/"/g, '').includes('v=DMARC1')
        );
        if (dmarcRecord) {
          return dmarcRecord.data.replace(/"/g, '');
        }
      }
      
      // For BIMI records, look for v=BIMI1
      if (domain.startsWith('default._bimi.')) {
        const bimiRecord = data.Answer.find(record => 
          record.data.replace(/"/g, '').includes('v=BIMI1')
        );
        if (bimiRecord) {
          return bimiRecord.data.replace(/"/g, '');
        }
      }
      
      return null;
    }
    
    // For other record types, return the first record
    return data.Answer[0].data.replace(/"/g, '');
  } catch (error) {
    console.error(`DNS query error for ${domain} (${recordType}):`, error);
    return null;
  }
};
