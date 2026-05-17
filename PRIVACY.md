# Privacy Policy

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

*This Privacy Policy was last updated on May 17, 2026.*
