import { PrismaClient } from "../src/server/db/client";

const prisma = new PrismaClient();

const termsContent = `# Terms of Service

**Effective Date:** May 17, 2026

Welcome to Code Catch. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.

---

## 1. Acceptance of Terms

By creating an account, accessing, or using Code Catch ("the Service," "we," "us," or "our"), you acknowledge that you have read, understood, and agree to be bound by these Terms. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.

If you do not agree to these Terms, you must not access or use the Service.

## 2. Description of Service

Code Catch is an AI-powered code review platform that integrates with GitHub to provide:

- **Automated Code Analysis** — AI-driven detection of bugs, security vulnerabilities, performance issues, and maintainability concerns in pull requests.
- **Multi-Provider AI** — Analysis powered by leading AI providers including OpenAI, Google Gemini, Groq, and Hugging Face.
- **Team Collaboration** — Shared workspaces, team-based reviews, and collaborative feedback tools.
- **Analytics & Insights** — Dashboards tracking code quality trends, review metrics, and team performance over time.
- **Automatic Diagram Generation** — ERD, Class, and Use-Case diagrams generated from your codebase.
- **Real-time Notifications** — Live updates on review status, team activity, and system events.

## 3. Account Registration & Eligibility

### 3.1 Eligibility
You must be at least 16 years of age to use the Service. By registering, you represent and warrant that you meet this age requirement.

### 3.2 Account Creation
- You must provide accurate, current, and complete information during registration.
- You are responsible for maintaining the confidentiality of your account credentials.
- You must notify us immediately of any unauthorized use of your account.
- One person or legal entity may not maintain more than one free account.

### 3.3 Account Security
You are solely responsible for all activity that occurs under your account. We are not liable for any loss or damage arising from your failure to maintain the security of your account credentials.

## 4. Acceptable Use Policy

### 4.1 Permitted Use
You may use the Service only for lawful purposes and in accordance with these Terms. You agree to use the Service solely for legitimate software development and code review activities.

### 4.2 Prohibited Conduct
You agree **not** to:

- Use the Service for any unlawful purpose or in violation of any applicable local, state, national, or international law.
- Attempt to gain unauthorized access to the Service, other accounts, computer systems, or networks connected to the Service.
- Interfere with or disrupt the integrity, performance, or availability of the Service or its infrastructure.
- Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service.
- Use the Service to transmit malicious code, viruses, or harmful content.
- Exceed published rate limits or abuse API access in a manner that degrades the Service for other users.
- Use automated means (bots, scrapers, crawlers) to access the Service without our express written permission.
- Resell, sublicense, or redistribute access to the Service without authorization.
- Use the Service to develop a competing product or service.
- Harass, abuse, or harm other users of the Service.

### 4.3 Enforcement
We reserve the right to investigate and take appropriate action against anyone who violates this section, including removing content, suspending or terminating accounts, and reporting violations to law enforcement.

## 5. Intellectual Property Rights

### 5.1 Your Content
You retain all ownership rights to your code, repositories, pull requests, and any other content you submit through the Service ("Your Content"). We do not claim any intellectual property rights over Your Content.

### 5.2 Limited License to Us
By using the Service, you grant us a limited, non-exclusive, worldwide license to access, process, and analyze Your Content solely for the purpose of providing the Service to you. This license terminates when you delete Your Content or close your account.

### 5.3 Our Intellectual Property
The Service, including its original content, features, functionality, design, and underlying technology, is and remains the exclusive property of Code Catch and its licensors. The Service is protected by copyright, trademark, and other intellectual property laws.

### 5.4 Feedback
If you provide us with feedback, suggestions, or ideas regarding the Service, you grant us a perpetual, irrevocable, non-exclusive license to use such feedback for any purpose without compensation to you.

## 6. AI-Generated Content

### 6.1 Nature of AI Output
The Service uses artificial intelligence to generate code review suggestions, analysis reports, and recommendations. These outputs are generated algorithmically and should be treated as suggestions, not definitive assessments.

### 6.2 No Guarantee of Accuracy
We do **not** guarantee the accuracy, completeness, reliability, or suitability of AI-generated feedback. AI outputs may contain errors, miss issues, or provide suggestions that are not appropriate for your specific context.

### 6.3 Human Oversight Required
AI-generated reviews are intended to supplement, not replace, professional human code review. You are solely responsible for evaluating and acting upon any AI-generated suggestions. Critical decisions about code quality, security, and deployment should always involve human judgment.

### 6.4 AI Provider Terms
Your use of AI-generated features is also subject to the terms and policies of our underlying AI providers. We are not responsible for changes in AI provider capabilities or availability.

## 7. Payment & Billing

### 7.1 Pricing
The Service offers both free and paid subscription plans. Current pricing is available on our pricing page. All prices are in US Dollars unless otherwise stated.

### 7.2 Billing Cycle
Paid plans are billed in advance on a monthly or annual basis, depending on your selected plan. Your subscription automatically renews at the end of each billing period unless cancelled.

### 7.3 Payment Method
You must provide a valid payment method for paid plans. You authorize us to charge your payment method for all fees incurred under your account.

### 7.4 Price Changes
We reserve the right to modify pricing at any time. We will provide at least 30 days' advance notice of any price increase. Price changes take effect at the start of your next billing cycle following the notice period.

### 7.5 Refunds
All fees are non-refundable except:
- As required by applicable law.
- As explicitly stated in a promotional offer.
- At our sole discretion in cases of Service failure attributable to us.

### 7.6 Taxes
You are responsible for all applicable taxes. If we are required to collect taxes, they will be added to your invoice.

### 7.7 Failure to Pay
If payment fails, we will attempt to notify you. Continued failure to pay may result in downgrade to the free plan or suspension of your account.

## 8. Service Availability & Support

### 8.1 Availability
We strive to maintain high availability of the Service but do **not** guarantee uninterrupted, error-free, or secure access. The Service may be temporarily unavailable due to:
- Scheduled maintenance (we will provide advance notice when possible).
- Unscheduled emergency maintenance.
- Factors beyond our reasonable control (force majeure events, third-party service outages, etc.).

### 8.2 Service Level
We do not offer a formal Service Level Agreement (SLA) for free plans. Paid plans may include SLA terms as specified in the applicable plan documentation.

### 8.3 Modifications
We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We will make reasonable efforts to notify users of material changes.

## 9. Data Handling

### 9.1 Code Processing
Your code is transmitted to third-party AI providers for analysis. We do not permanently store your source code beyond the duration necessary to complete the review. Code snippets included in review results are retained as part of the review record.

### 9.2 Data Retention
Review results, analytics data, and account information are retained for the lifetime of your account unless you request deletion. See our Privacy Policy for complete details on data handling.

### 9.3 Data Export
You may export your review data at any time through the Service's export functionality or by contacting support.

## 10. Third-Party Services

### 10.1 Integrations
The Service integrates with third-party services including GitHub, AI providers, and infrastructure partners. Your use of these integrations is subject to the respective third-party terms of service.

### 10.2 No Endorsement
Integration with or reference to third-party services does not constitute endorsement. We are not responsible for the availability, accuracy, or practices of third-party services.

## 11. Termination

### 11.1 Termination by You
You may terminate your account at any time through your account settings or by contacting support. Upon termination:
- Your right to access the Service ceases immediately.
- We will delete your account data within 30 days.
- No refund will be issued for the remaining portion of any prepaid billing period.

### 11.2 Termination by Us
We may suspend or terminate your access to the Service immediately, without prior notice, if:
- You breach any provision of these Terms.
- Your account is used for prohibited activities.
- We are required to do so by law.
- We discontinue the Service.

### 11.3 Effect of Termination
Upon termination, all licenses granted to you under these Terms immediately cease. Sections that by their nature should survive termination will survive (including Intellectual Property, Limitation of Liability, and Indemnification).

## 12. Disclaimer of Warranties

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. WE SPECIFICALLY DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

WE DO NOT WARRANT THAT:
- The Service will meet your specific requirements.
- The Service will be uninterrupted, timely, secure, or error-free.
- The results obtained from the Service will be accurate or reliable.
- Any errors in the Service will be corrected.

## 13. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CODE CATCH, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR:

- Any indirect, incidental, special, consequential, or punitive damages.
- Any loss of profits, revenue, data, business opportunities, or goodwill.
- Any damages arising from your use of or inability to use the Service.
- Any damages arising from unauthorized access to or alteration of your data.

OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED US DOLLARS ($100).

## 14. Indemnification

You agree to indemnify, defend, and hold harmless Code Catch and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with:
- Your access to or use of the Service.
- Your violation of these Terms.
- Your violation of any third-party rights.
- Your Content.

## 15. Governing Law & Dispute Resolution

### 15.1 Governing Law
These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Code Catch is incorporated, without regard to conflict of law principles.

### 15.2 Dispute Resolution
Any dispute arising from these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with applicable arbitration rules.

### 15.3 Class Action Waiver
You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.

## 16. Changes to These Terms

We may update these Terms from time to time. When we make material changes:
- We will update the "Effective Date" at the top of this page.
- We will notify you via email or through a prominent notice within the Service.
- We will provide at least 14 days' notice before changes take effect.

Your continued use of the Service after the effective date of revised Terms constitutes acceptance of the changes. If you do not agree to the revised Terms, you must stop using the Service.

## 17. General Provisions

### 17.1 Entire Agreement
These Terms, together with our Privacy Policy, constitute the entire agreement between you and Code Catch regarding the Service.

### 17.2 Severability
If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

### 17.3 Waiver
Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.

### 17.4 Assignment
You may not assign or transfer these Terms without our prior written consent. We may assign our rights and obligations without restriction.

### 17.5 Force Majeure
We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control.

## 18. Contact Information

If you have any questions about these Terms of Service, please contact us:

- **Email:** [support@codecatch.dev](mailto:support@codecatch.dev)
- **Website:** [https://codecatch.dev/contact](https://codecatch.dev/contact)

---

*These Terms of Service were last updated on May 17, 2026.*`;

const privacyContent = `# Privacy Policy

**Effective Date:** May 17, 2026

Code Catch ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered code review platform ("the Service").

---

## 1. Information We Collect

### 1.1 Account Information
When you create an account, we collect:
- **Name** — Your display name as provided via GitHub OAuth.
- **Email address** — Your primary email from your GitHub account.
- **GitHub username** — Your public GitHub handle.
- **Profile avatar** — Your GitHub profile image URL.
- **Account preferences** — Settings you configure within the Service.

### 1.2 Code & Repository Data
When you use the Service for code reviews, we process:
- **Repository metadata** — Repository names, descriptions, languages, visibility settings, and branch information.
- **Pull request content** — Titles, descriptions, diffs, file changes, and commit messages submitted for review.
- **Code snippets** — Portions of code processed during AI analysis and included in review results.
- **Diagram data** — Schema and code structure information used to generate diagrams.

### 1.3 Usage Data
We automatically collect:
- **Device information** — Browser type and version, operating system, device type.
- **Network information** — IP address, approximate geographic location (country/region level).
- **Interaction data** — Pages visited, features used, buttons clicked, time spent on pages.
- **Review history** — Records of reviews initiated, completed, and their outcomes.
- **Performance data** — Page load times, errors encountered, API response times.

### 1.4 Communication Data
- **Support messages** — Content of messages you send through our contact or support channels.
- **Feedback** — Ratings, comments, and suggestions you provide about the Service.

## 2. How We Use Your Information

We use the information we collect to:

| Purpose | Legal Basis |
|---------|-------------|
| Provide and maintain the Service | Contract performance |
| Process your code through AI analysis | Contract performance |
| Send notifications about review results | Legitimate interest |
| Generate analytics and code quality insights | Contract performance |
| Improve our AI models and Service quality | Legitimate interest |
| Communicate updates, changes, and announcements | Legitimate interest |
| Detect, prevent, and address fraud or abuse | Legitimate interest |
| Respond to support requests | Contract performance |
| Comply with legal obligations | Legal obligation |
| Enforce our Terms of Service | Legitimate interest |

## 3. Code Data Processing

### 3.1 AI Provider Transmission
Your code is transmitted to third-party AI providers solely for generating review feedback:
- **OpenAI** — For GPT-based code analysis.
- **Google (Gemini)** — For Gemini-based code analysis.
- **Groq** — For high-speed inference analysis.
- **Hugging Face** — For open-source model analysis.

### 3.2 Code Retention
- Source code submitted for analysis is **not permanently stored** by Code Catch after the review is complete.
- Code snippets included in review results are retained only as long as the review record exists in your account.
- AI providers may process your code according to their own data retention policies. We select providers that do not use customer data for model training.

### 3.3 Code Security During Transit
- All code is transmitted over encrypted connections (TLS 1.2+).
- Code is processed in memory and not written to persistent storage during analysis.
- We do not share your code with any party other than the AI provider selected for your review.

## 4. Data Sharing & Disclosure

We do **not** sell your personal information. We may share data with the following categories of recipients:

### 4.1 AI Providers
As described in Section 3, code is shared with AI providers (OpenAI, Google, Groq, Hugging Face) exclusively for review processing.

### 4.2 Infrastructure Partners
We use the following services to operate the platform:
- **Vercel** — Application hosting and serverless functions.
- **Neon / PostgreSQL** — Database hosting and storage.
- **Pusher** — Real-time notification delivery.
- **Resend** — Transactional email delivery.
- **Upstash Redis** — Rate limiting and caching.
- **Vercel Blob** — File upload storage.

### 4.3 Team Members
If you are part of a team on Code Catch:
- Review data for team repositories is visible to all team members.
- Your name, email, and avatar are visible to other team members.
- Team analytics aggregate data from all team members.

### 4.4 Legal Requirements
We may disclose your information if required to do so by law or in response to:
- A subpoena, court order, or other legal process.
- A request from a law enforcement agency.
- Protection of our rights, property, or safety, or that of our users or the public.

### 4.5 Business Transfers
In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of any such transfer and any changes to this Privacy Policy.

## 5. Data Security

We implement industry-standard security measures to protect your information:

- **Encryption in transit** — All data is transmitted over TLS 1.2+ encrypted connections.
- **Authentication** — Secure OAuth 2.0 authentication via GitHub.
- **Access controls** — Role-based access controls on all data stores and internal systems.
- **Rate limiting** — Protection against brute-force attacks and abuse via Upstash Redis.
- **Input validation** — Server-side validation on all API endpoints.
- **Dependency monitoring** — Regular updates and vulnerability scanning of dependencies.

**Important:** No method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.

## 6. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Account information | Lifetime of your account |
| Review results | Until you delete them or account termination |
| Source code (during analysis) | Not permanently stored; processed in memory |
| Analytics data | Lifetime of your account |
| Audit logs | 90 days (configurable by admin) |
| Session data | 30 days of inactivity |
| Support messages | 2 years after resolution |
| Deleted account data | Purged within 30 days of account deletion |

## 7. Your Rights

Depending on your jurisdiction, you may have the following rights regarding your personal data:

### 7.1 Right of Access
You have the right to request a copy of the personal data we hold about you.

### 7.2 Right to Rectification
You have the right to request correction of inaccurate or incomplete personal data.

### 7.3 Right to Erasure
You have the right to request deletion of your personal data. You can delete your account at any time through Settings, which triggers deletion of all associated data within 30 days.

### 7.4 Right to Data Portability
You have the right to receive your data in a structured, commonly used, machine-readable format. You can export your review data through the Service.

### 7.5 Right to Object
You have the right to object to processing of your personal data for certain purposes, including direct marketing.

### 7.6 Right to Restrict Processing
You have the right to request restriction of processing of your personal data under certain circumstances.

### 7.7 Right to Withdraw Consent
Where processing is based on consent, you have the right to withdraw consent at any time without affecting the lawfulness of prior processing.

### 7.8 Exercising Your Rights
To exercise any of these rights, contact us at [privacy@codecatch.dev](mailto:privacy@codecatch.dev). We will respond within 30 days.

## 8. Cookies & Tracking Technologies

### 8.1 Essential Cookies
We use essential cookies for:
- **Session management** — Maintaining your authenticated session.
- **Security** — CSRF protection and fraud prevention.
- **Preferences** — Storing your theme and language preferences.

### 8.2 Analytics
We collect anonymized usage analytics to improve the Service. This data is:
- Aggregated and not linked to individual users.
- Not shared with third-party advertisers.
- Used solely for Service improvement.

### 8.3 No Third-Party Advertising
We do **not** use third-party advertising cookies or tracking pixels. We do not sell or share your data with advertisers.

### 8.4 Managing Cookies
You can control cookies through your browser settings. Note that disabling essential cookies may prevent you from using certain features of the Service.

## 9. International Data Transfers

Your information may be transferred to and processed in countries other than your country of residence. When we transfer data internationally, we ensure appropriate safeguards are in place, including:
- Standard Contractual Clauses (SCCs) approved by relevant authorities.
- Adequacy decisions where applicable.
- Binding Corporate Rules where applicable.

## 10. Children's Privacy

The Service is **not** intended for users under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected data from a child under 16, we will:
- Delete the information promptly.
- Terminate the associated account.

If you believe a child under 16 has provided us with personal information, please contact us immediately at [privacy@codecatch.dev](mailto:privacy@codecatch.dev).

## 11. California Privacy Rights (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

- **Right to Know** — You can request disclosure of the categories and specific pieces of personal information we have collected.
- **Right to Delete** — You can request deletion of your personal information.
- **Right to Non-Discrimination** — We will not discriminate against you for exercising your CCPA rights.
- **Right to Opt-Out of Sale** — We do not sell personal information, so this right does not apply.

## 12. European Privacy Rights (GDPR)

If you are in the European Economic Area (EEA), United Kingdom, or Switzerland:

- Our legal bases for processing are described in Section 2.
- You have all rights described in Section 7.
- Our Data Protection Officer can be reached at [privacy@codecatch.dev](mailto:privacy@codecatch.dev).
- You have the right to lodge a complaint with your local supervisory authority.

## 13. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we make material changes:
- We will update the "Effective Date" at the top of this page.
- We will notify you via email or through a prominent notice within the Service.
- We will provide at least 14 days' notice before changes take effect.

Your continued use of the Service after the effective date constitutes acceptance of the updated Privacy Policy.

## 14. Data Breach Notification

In the event of a data breach that affects your personal information:
- We will notify affected users within 72 hours of becoming aware of the breach.
- We will notify relevant supervisory authorities as required by law.
- We will provide details about the nature of the breach, data affected, and steps taken.

## 15. Contact Us

If you have questions about this Privacy Policy, wish to exercise your data rights, or have concerns about our data practices, please contact us:

- **Privacy inquiries:** [privacy@codecatch.dev](mailto:privacy@codecatch.dev)
- **General support:** [support@codecatch.dev](mailto:support@codecatch.dev)
- **Website:** [https://codecatch.dev/contact](https://codecatch.dev/contact)

For EU/UK residents, you may also contact our Data Protection Officer at the email above.

---

*This Privacy Policy was last updated on May 17, 2026.*`;

async function main() {
  console.log("Seeding legal pages...");

  await prisma.legalPage.upsert({
    where: { slug: "terms" },
    create: { slug: "terms", title: "Terms of Service", content: termsContent },
    update: { title: "Terms of Service", content: termsContent },
  });

  await prisma.legalPage.upsert({
    where: { slug: "privacy" },
    create: { slug: "privacy", title: "Privacy Policy", content: privacyContent },
    update: { title: "Privacy Policy", content: privacyContent },
  });

  console.log("✓ Legal pages seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
