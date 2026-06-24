import React from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import WhatsAppFloat from './WhatsAppFloat';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      {/* Mobile spacer so fixed mobile header doesn't cover page content */}
      <div className="md:hidden h-20" aria-hidden="true" />
      <main className="flex-grow">
        {children}
      </main>
      <PublicFooter />
      <WhatsAppFloat />
    </div>
  );
};

export default PublicLayout;
