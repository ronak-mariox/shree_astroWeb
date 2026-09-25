const EFFECTIVE = 'Effective Date: 1 January 2026 · Last Updated: 19 August 2026'

export const PRIVACY = {
  slug: 'privacy',
  tag: 'LEGAL',
  title: 'Privacy Policy',
  effective: EFFECTIVE,
  intro: null,
  sections: [
    {
      id: 'introduction',
      heading: 'Introduction',
      content: [
        'Shree Astro ("we", "us", or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform at shreeastro.com or use our mobile application.',
        'Please read this policy carefully. If you disagree with its terms, please discontinue use of the platform immediately. We reserve the right to make changes to this policy at any time and for any reason, and we will alert you about any changes by updating the "Last Updated" date.',
      ],
    },
    {
      id: 'information-we-collect',
      heading: 'Information We Collect',
      content: [
        'We collect information that you provide directly to us, including:',
        {
          bullets: [
            'Account Information: Name, email address, phone number, and password when you register',
            'Profile Information: Date of birth, time of birth, place of birth for astrological services',
            'Payment Information: Billing address and payment method details (processed securely via Razorpay)',
            'Communication Data: Messages exchanged with astrologers during consultations',
            'Usage Data: Pages visited, features used, time spent, and interaction data',
            'Device Data: IP address, browser type, operating system, and device identifiers',
          ],
        },
        'We do not sell, trade, or rent your personal identification information to third parties.',
      ],
    },
    {
      id: 'how-we-use-your-information',
      heading: 'How We Use Your Information',
      content: [
        'We use the information we collect to:',
        {
          bullets: [
            'Provide, operate, and maintain our astrological services',
            'Process transactions and send related information (receipts, invoices, reminders)',
            'Send promotional communications (only with your explicit consent)',
            'Respond to your enquiries and provide customer support',
            'Monitor and analyse usage patterns to improve our platform',
            'Detect, prevent, and address technical issues and fraudulent activity',
            'Comply with legal obligations and enforce our Terms & Conditions',
          ],
        },
        'Your birth details and consultation history are used exclusively to provide personalised astrological insights and are never shared with third parties for marketing purposes.',
      ],
    },
    {
      id: 'information-sharing-and-disclosure',
      heading: 'Information Sharing and Disclosure',
      content: [
        'We may share your information only in the following limited circumstances:',
        {
          bullets: [
            'With Astrologers: Birth details and session context are shared only with the specific astrologer you book, solely to enable the consultation',
            'Service Providers: Trusted third-party vendors (payment processors, cloud storage, analytics) who assist us in operating the platform, under strict confidentiality agreements',
            'Legal Requirements: When required by applicable law, court order, or government authority',
            'Business Transfers: In the event of a merger, acquisition, or asset sale, with advance notice to you',
            'Safety: To protect the rights, property, or safety of Shree Astro, our users, or the public',
          ],
        },
        'We never sell your personal information to advertisers or data brokers.',
      ],
    },
    {
      id: 'data-retention',
      heading: 'Data Retention',
      content: [
        'We retain your personal information for as long as your account is active or as needed to provide services. Specifically:',
        {
          bullets: [
            'Account data: Retained until you delete your account',
            'Consultation transcripts: Retained for 24 months for quality and compliance purposes',
            'Payment records: Retained for 7 years as required by Indian tax law',
            'Log and analytics data: Retained for 12 months',
          ],
        },
        'You may request deletion of your account and associated data at any time by contacting support@shreeastro.com. We will process deletion requests within 30 days, subject to legal retention requirements.',
      ],
    },
    {
      id: 'data-security',
      heading: 'Data Security',
      content: [
        'We implement industry-standard security measures to protect your information:',
        {
          bullets: [
            '256-bit SSL/TLS encryption for all data in transit',
            'AES-256 encryption for sensitive data at rest',
            'Regular security audits and penetration testing',
            'Access controls — only authorised personnel can access personal data',
            'PCI-DSS compliance for payment data processing',
          ],
        },
        'Despite these measures, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security, and you acknowledge this inherent risk. You are responsible for maintaining the confidentiality of your account credentials.',
      ],
    },
    {
      id: 'your-rights',
      heading: 'Your Rights',
      content: [
        'Under applicable Indian data protection laws and GDPR (for users in the EU), you have the right to:',
        {
          bullets: [
            'Access: Request a copy of the personal data we hold about you',
            'Correction: Request correction of inaccurate or incomplete information',
            'Deletion: Request deletion of your personal data (subject to legal obligations)',
            'Portability: Receive your data in a structured, machine-readable format',
            'Objection: Object to certain types of processing, including marketing communications',
            'Withdrawal of Consent: Withdraw consent at any time without affecting prior lawful processing',
          ],
        },
        'To exercise these rights, contact us at privacy@shreeastro.com. We will respond within 30 days.',
      ],
    },
    {
      id: 'cookies-and-tracking',
      heading: 'Cookies and Tracking',
      content: [
        'We use cookies and similar tracking technologies to enhance your experience:',
        {
          bullets: [
            'Essential Cookies: Required for platform functionality (login sessions, security)',
            'Performance Cookies: Analyse platform usage to improve performance (Google Analytics)',
            'Personalisation Cookies: Remember your preferences and settings',
            'Marketing Cookies: Deliver relevant advertisements (only with your consent)',
          ],
        },
        'You can control cookie settings through your browser. Disabling certain cookies may affect platform functionality. We do not respond to "Do Not Track" signals, as no industry standard has been established.',
      ],
    },
    {
      id: 'childrens-privacy',
      heading: "Children's Privacy",
      content: [
        'Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information immediately.',
        'If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@shreeastro.com.',
      ],
    },
    {
      id: 'contact-us',
      heading: 'Contact Us',
      content: [
        'If you have questions, concerns, or requests regarding this Privacy Policy, please contact our Privacy Officer:',
        {
          lines: [
            'Email: privacy@shreeastro.com',
            'Phone: +91 1800-XXX-XXXX (Toll-Free)',
            'Address: Shree Astro Pvt. Ltd., 4th Floor, Prestige Tower, MG Road, Bengaluru – 560001, Karnataka, India',
          ],
        },
        'For data protection enquiries, you may also contact the Data Protection Officer at dpo@shreeastro.com.',
        'Last Updated: 19 August 2026',
      ],
    },
  ],
  help: {
    title: 'Have a question?',
    text: 'Our team is happy to help with any privacy concerns.',
    buttonLabel: 'Contact Us',
    to: '/contact',
  },
}

export const TERMS = {
  slug: 'terms',
  tag: 'LEGAL',
  title: 'Terms & Conditions',
  effective: EFFECTIVE,
  intro: null,
  sections: [
    {
      id: 'acceptance-of-terms',
      heading: 'Acceptance of Terms',
      content: [
        'By accessing or using the Shree Astro platform (www.shreeastro.com) or our mobile application, you agree to be bound by these Terms & Conditions ("Terms") and all applicable laws and regulations. If you do not agree to these Terms, please do not use our services.',
        'These Terms constitute a legally binding agreement between you and Shree Astro Pvt. Ltd. ("Shree Astro", "we", "us", or "our"). We reserve the right to modify these Terms at any time, and your continued use of the platform constitutes acceptance of any changes.',
      ],
    },
    {
      id: 'description-of-services',
      heading: 'Description of Services',
      content: [
        'Shree Astro provides an online platform connecting users with professional astrologers for personalised consultations via voice call and chat. We also offer:',
        {
          bullets: [
            'Free Kundli generation and analysis',
            'Daily horoscopes and panchang',
            'AI-powered astrological insights',
            'Online puja booking services',
            'Spiritual products via our marketplace',
            'Educational astrology content',
          ],
        },
        'All astrological services are provided for entertainment, spiritual guidance, and personal reflection purposes. They are not a substitute for professional medical, legal, financial, or psychological advice.',
      ],
    },
    {
      id: 'user-accounts-and-registration',
      heading: 'User Accounts and Registration',
      content: [
        'To access certain features, you must register an account. By registering, you agree to:',
        {
          bullets: [
            'Provide accurate, current, and complete information',
            'Maintain and update your information to keep it accurate',
            'Protect your account credentials and not share them with others',
            'Notify us immediately of any unauthorised use of your account',
            'Accept responsibility for all activities occurring under your account',
          ],
        },
        'You must be at least 18 years of age to create an account. We reserve the right to suspend or terminate accounts that violate these Terms or are inactive for more than 24 months.',
      ],
    },
    {
      id: 'wallet-payments-and-refunds',
      heading: 'Wallet, Payments and Refunds',
      content: [
        'Shree Astro uses a prepaid wallet system for consultation services:',
        {
          bullets: [
            'Minimum recharge: ₹99 · Maximum single recharge: ₹10,000',
            'Wallet balance is non-transferable and cannot be redeemed for cash',
            'Consultation charges are deducted in real-time at the advertised per-minute rate',
            'First consultation of up to 5 minutes is free for new users (one-time offer)',
          ],
        },
        'Refund Policy:',
        {
          bullets: [
            'Wallet recharges are non-refundable except in cases of technical failure',
            'If a consultation is interrupted due to our platform malfunction, the unused time will be credited back',
            'Fraudulent chargebacks may result in permanent account suspension',
          ],
        },
        'All prices are inclusive of applicable GST. Payment processing is handled by Razorpay and subject to their terms.',
      ],
    },
    {
      id: 'user-conduct-and-prohibited-activities',
      heading: 'User Conduct and Prohibited Activities',
      content: [
        'You agree not to use the Shree Astro platform to:',
        {
          bullets: [
            'Harass, abuse, threaten, or intimidate astrologers or other users',
            'Share false, misleading, or defamatory content',
            'Solicit personal contact information from astrologers outside the platform',
            'Record consultations without explicit consent of all parties',
            'Circumvent the platform to arrange direct consultations (bypassing fees)',
            'Use automated bots, scrapers, or other unauthorised data collection tools',
            'Attempt to reverse-engineer, hack, or compromise platform security',
            'Violate any applicable local, national, or international law',
          ],
        },
        'Violation of these rules may result in immediate account suspension and potential legal action.',
      ],
    },
    {
      id: 'astrologer-standards-and-disclaimers',
      heading: 'Astrologer Standards and Disclaimers',
      content: [
        'All astrologers on Shree Astro are independent professionals who have been verified for credentials and background. However:',
        {
          bullets: [
            "Shree Astro does not endorse any specific astrologer's predictions or advice",
            'Predictions made by astrologers are opinions based on astrological principles, not guarantees',
            'Shree Astro is not liable for any decisions made based on astrological consultations',
            'Users consult astrologers entirely at their own discretion and risk',
          ],
        },
        'Astrological services are meant for spiritual guidance and self-reflection. Do not make major life decisions (medical, financial, legal) based solely on astrological advice without consulting qualified professionals in the respective field.',
      ],
    },
    {
      id: 'intellectual-property',
      heading: 'Intellectual Property',
      content: [
        'All content on the Shree Astro platform — including but not limited to text, graphics, logos, icons, images, audio, video, software, and page layouts — is the intellectual property of Shree Astro Pvt. Ltd. and is protected by Indian and international copyright laws.',
        'You are granted a limited, non-exclusive, non-transferable license to access and use the platform for personal, non-commercial purposes. You may not:',
        {
          bullets: [
            'Reproduce, distribute, or publicly display platform content without written permission',
            'Use our trademarks or branding without prior consent',
            'Create derivative works based on our content or software',
          ],
        },
      ],
    },
    {
      id: 'limitation-of-liability',
      heading: 'Limitation of Liability',
      content: [
        'To the maximum extent permitted by applicable law, Shree Astro and its officers, directors, employees, and agents shall not be liable for:',
        {
          bullets: [
            'Any indirect, incidental, special, consequential, or punitive damages',
            'Loss of profits, data, goodwill, or other intangible losses',
            'Damages resulting from your access to or inability to access the platform',
            'Damages resulting from any content or conduct of third parties on the platform',
          ],
        },
        'In no event shall our total liability exceed the amount paid by you in the 3 months preceding the claim. Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.',
      ],
    },
    {
      id: 'governing-law-and-dispute-resolution',
      heading: 'Governing Law and Dispute Resolution',
      content: [
        'These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law principles.',
        'Any dispute arising out of or relating to these Terms or the use of the platform shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be referred to arbitration in Bengaluru, Karnataka, under the Arbitration and Conciliation Act, 1996, before a mutually agreed single arbitrator.',
        'For consumer complaints, you may also approach the Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.',
      ],
    },
    {
      id: 'contact-information',
      heading: 'Contact Information',
      content: [
        'For questions about these Terms & Conditions:',
        {
          lines: [
            'Email: legal@shreeastro.com',
            'Phone: +91 1800-XXX-XXXX (Toll-Free, Mon–Sat 9 AM – 6 PM IST)',
            'Address: Shree Astro Pvt. Ltd., 4th Floor, Prestige Tower, MG Road, Bengaluru – 560001, Karnataka, India',
            'CIN: U74999KA2024PTC000001',
          ],
        },
        'Last Updated: 19 August 2026',
      ],
    },
  ],
  help: {
    title: 'Questions?',
    text: 'Contact our legal team for clarification on any terms.',
    buttonLabel: 'Contact Us',
    to: '/contact',
  },
}

export const REFUND = {
  slug: 'refund',
  tag: 'LEGAL',
  title: 'Refund Policy',
  effective: EFFECTIVE,
  intro: null,
  sections: [
    {
      id: 'refund-policy-overview',
      heading: 'Refund Policy Overview',
      content: [
        'At Shree Astro, we strive to deliver a premium astrological experience. This Refund Policy outlines the circumstances under which refunds or credits are issued, and the process for requesting them.',
        "By using Shree Astro's services, you acknowledge and agree to this policy. This policy forms part of our Terms & Conditions.",
        'Last Updated: 19 August 2026',
      ],
    },
    {
      id: 'wallet-recharges',
      heading: 'Wallet Recharges',
      content: [
        'Standard Policy: Wallet recharges are generally non-refundable once completed. The wallet balance can be used for any consultation or service on the platform.',
        'Eligible Refund Cases:',
        {
          bullets: [
            'Technical failure during recharge (money debited but wallet not credited)',
            'Duplicate transaction processing (same amount charged twice)',
            'Unauthorised transaction reported within 7 days of occurrence',
          ],
        },
        'Non-Refundable Cases:',
        {
          bullets: [
            'Change of mind after successful recharge',
            'Account suspended due to policy violations',
            'Wallet balance remaining at account closure',
          ],
        },
        'To report a recharge issue, email billing@shreeastro.com with your transaction ID within 7 days. Eligible refunds are processed within 5–7 business days to the original payment method.',
      ],
    },
    {
      id: 'consultation-refunds',
      heading: 'Consultation Refunds',
      content: [
        'First Consultation Offer: New users receive their first consultation (up to 5 minutes) free of charge. This offer cannot be exchanged for wallet credit.',
        "Paid Consultations: Consultations are charged in real-time per minute. Once started, consultations are generally non-refundable as the astrologer's time has been utilized.",
        'Eligible Credit Cases: Credit (not cash refund) to your Shree Astro wallet may be issued in the following cases:',
        {
          bullets: [
            'Platform malfunction causing call/chat disconnection within first 2 minutes (full session credit)',
            'Astrologer did not join within 5 minutes of scheduled appointment time',
            'Technical issues on our end causing persistent audio/video failure',
            'Astrologer behaviour reported as grossly inappropriate (subject to review)',
          ],
        },
        'Process: Submit a support request within 24 hours of the session at support@shreeastro.com with the session ID and a description of the issue.',
      ],
    },
    {
      id: 'online-puja-bookings',
      heading: 'Online Puja Bookings',
      content: [
        'Cancellation & Refund Policy for Puja Services:',
        {
          bullets: [
            '7+ days before puja date: 100% refund to original payment method',
            '3–6 days before puja date: 75% refund (25% non-refundable processing fee)',
            '1–2 days before puja date: 50% refund',
            'Less than 24 hours: No refund (full amount forfeited)',
            'After puja has commenced: No refund',
          ],
        },
        'Rescheduling: You may reschedule a puja booking up to 48 hours before the scheduled time without any penalty (subject to pandit availability).',
        'Cancellation by Us: If Shree Astro cancels a puja booking (e.g., pandit unavailability), you will receive a 100% refund to the original payment method within 3–5 business days.',
      ],
    },
    {
      id: 'store-and-product-returns',
      heading: 'Store and Product Returns',
      content: [
        'Physical Products (Gemstones, Rudraksha, Spiritual Items):',
        {
          bullets: [
            'Return Window: 7 days from delivery',
            'Condition: Item must be unused, undamaged, and in original packaging',
            'Process: Email store@shreeastro.com with order ID and reason for return',
            'Shipping: Return shipping costs are borne by the customer unless the item is defective or incorrect',
          ],
        },
        'Non-Returnable Items:',
        {
          bullets: [
            'Personalised items (custom engravings, specific cuttings)',
            'Digital products (e-books, digital content)',
            'Items damaged due to customer misuse',
            'Items without original packaging',
          ],
        },
        'Refund Processing: Approved returns are refunded within 7–10 business days after we receive and inspect the returned item.',
      ],
    },
    {
      id: 'refund-process-and-timeline',
      heading: 'Refund Process and Timeline',
      content: [
        'How to Request a Refund:',
        {
          numbered: [
            'Email billing@shreeastro.com with subject: "Refund Request — [Your Order/Transaction ID]"',
            'Include: Your registered email, transaction ID, amount, date, and reason for refund',
            'We acknowledge your request within 24 hours',
            'Investigation is completed within 3–5 business days',
            'If approved, refund is initiated within 2 business days',
          ],
        },
        'Refund Timelines by Payment Method:',
        {
          bullets: [
            'UPI/Net Banking: 3–5 business days',
            'Credit/Debit Card: 5–10 business days (depending on your bank)',
            'Wallet (Paytm, PhonePe): 1–3 business days',
            'Shree Astro Wallet Credit: Instant',
          ],
        },
        'Escalation: If your refund is not processed within the stated timeline, escalate to escalations@shreeastro.com or call +91 1800-XXX-XXXX.',
      ],
    },
    {
      id: 'contact-for-refund-queries',
      heading: 'Contact for Refund Queries',
      content: [
        {
          lines: [
            'Billing Support:',
            'Email: billing@shreeastro.com',
            'Phone: +91 1800-XXX-XXXX (Mon–Sat, 9 AM–6 PM IST)',
          ],
        },
        { lines: ['Store Returns:', 'Email: store@shreeastro.com'] },
        { lines: ['General Support:', 'Email: support@shreeastro.com'] },
        'For urgent issues, please use our in-app chat support for the fastest response.',
        {
          lines: ['Shree Astro Pvt. Ltd.', '4th Floor, Prestige Tower, MG Road', 'Bengaluru – 560001, Karnataka, India'],
        },
      ],
    },
  ],
  help: {
    title: 'Need a refund?',
    text: 'Our support team will help resolve your billing concern.',
    buttonLabel: 'Contact Support',
    to: '/support',
    tone: 'green',
  },
}
