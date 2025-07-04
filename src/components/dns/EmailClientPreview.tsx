
import React from 'react';
import { Menu, Search } from 'lucide-react';
import { BimiLogo } from './BimiLogo';

interface EmailClientPreviewProps {
  logoUrl: string | null;
  domain: string;
}

export const EmailClientPreview: React.FC<EmailClientPreviewProps> = ({ logoUrl, domain }) => {
  return (
    <div>
      <h4 className="font-medium mb-2">Email Client Preview</h4>
      <div className="w-full max-w-sm mx-auto bg-gray-800 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="w-full bg-white rounded-[2rem] overflow-hidden">
          <div className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center">
            <Menu className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Inbox</h2>
            <Search className="h-6 w-6" />
          </div>
          <ul className="divide-y divide-gray-200">
            {/* BIMI Email */}
            <li className="p-3 flex items-center space-x-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-full shadow-md overflow-hidden">
                <BimiLogo logoUrl={logoUrl} domain={domain} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{domain}</p>
                <p className="text-sm font-medium text-gray-800 truncate">Getting BIMI for your brand now! *</p>
                <p className="text-sm text-gray-500 truncate">Welcome to the world of BIMI</p>
              </div>
            </li>
            {/* Static Examples */}
            <li className="p-3 flex items-center space-x-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">Andrew Baker</p>
                <p className="text-sm text-gray-800 truncate">Proposal Updates</p>
                <p className="text-sm text-gray-500 truncate">Hey, I hope you had a nice weeke...</p>
              </div>
            </li>
            <li className="p-3 flex items-center space-x-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">T</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">Taxi Receipts</p>
                <p className="text-sm text-gray-800 truncate">Wednesday 24th May 11:15 ride.</p>
                <p className="text-sm text-gray-500 truncate">Thank you for choosing Taxi servi...</p>
              </div>
            </li>
            <li className="p-3 flex items-center space-x-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">G</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">General Bank</p>
                <p className="text-sm text-gray-800 truncate">Online statement now available</p>
                <p className="text-sm text-gray-500 truncate">Dear customer, Your online bank...</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
