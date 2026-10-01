# Apex Arena Hub

Free Fire Tournament App — Complete Development Prompt



You are an expert full-stack mobile app developer and UI/UX designer.



I want you to build a professional Free Fire Tournament Management App with a modern esports-style interface.



1. Main Goal



Create a complete tournament platform where users can:



- Register/Login

- Add their Free Fire UID and in-game name

- Browse tournaments

- Join tournaments

- Pay entry fees where legally permitted

- View tournament details

- Receive Room ID & Password

- View match status

- See leaderboard/results

- Track wallet and transactions

- Request withdrawals where legally permitted

- Use referral/promo codes

- Receive notifications



There must also be a separate secure Admin Panel to manage the entire platform.



---



2. Technology



Use a production-ready architecture.



Preferred:



- Frontend: React / Next.js or the most suitable framework

- Mobile responsive design

- Backend: Supabase or Firebase

- Database: PostgreSQL if using Supabase

- Authentication: Secure authentication

- Storage: Cloud storage where required

- Server-side functions/API for sensitive operations



Do NOT put secret API keys, admin credentials, payment secrets, or service-role keys inside frontend code.



If any technology choice is unclear, choose the most secure and scalable option and explain the choice briefly.



---



3. User App Screens



Create these screens:



Splash Screen



- Professional gaming logo

- Smooth animation

- App loading



Login/Register



- Mobile/email login

- Google login if supported

- Secure authentication

- Logout



Home



Show:



- Featured tournament banner

- Upcoming tournaments

- Live tournaments

- Completed tournaments

- Wallet balance

- Quick actions

- Announcements



Tournament List



Categories:



- Upcoming

- Live

- Completed



Each tournament card should show:



- Tournament name

- Solo/Duo/Squad

- Entry fee

- Prize pool

- Players joined

- Maximum players

- Date/time

- Status

- Join button



Tournament Details



Show:



- Tournament name

- Banner

- Mode

- Map

- Entry fee

- Prize pool

- Maximum players

- Joined players

- Date/time

- Rules

- Prize distribution

- Tournament status



Buttons:



- Join Tournament

- View Participants

- View Room Details when available



My Tournaments



Show:



- Upcoming tournaments

- Live tournaments

- Completed tournaments

- Tournament status

- Room details

- Results



Room Details



Only show Room ID and Password when the admin has published them.



Display:



- Room ID

- Password

- Match time

- Important instructions



Do not expose room credentials before the configured release time unless the admin explicitly publishes them.



Leaderboard



Show:



- Rank

- Player/team name

- Free Fire UID

- Kills

- Placement points

- Total points

- Prize



Sort automatically by configured tournament scoring rules.



Wallet



Show:



- Available balance

- Add Money

- Withdraw

- Transaction History



Every wallet operation must be validated server-side.



Profile



Show:



- Name

- Profile photo

- Free Fire UID

- In-game name

- Email/mobile

- Referral code

- Joined tournaments

- Account settings



Referral



Show:



- Referral code

- Referral link

- Number of referrals

- Referral rewards

- Referral history



Notifications



Show:



- Tournament announcements

- Room details

- Results

- Wallet updates

- Withdrawal updates

- Important notices



Support



Create a simple support/contact section.



---



4. Admin Panel



Create a separate secure admin dashboard.



Admin Dashboard



Display:



- Total users

- Active users

- Total tournaments

- Live tournaments

- Completed tournaments

- Pending withdrawals

- Total deposits

- Total withdrawals

- Recent activity



Use clean cards and charts.



---



5. Tournament Management



Admin can:



- Create tournament

- Edit tournament

- Cancel tournament

- Delete tournament

- Start tournament

- End tournament

- Set tournament name

- Set banner

- Set mode

- Set map

- Set entry fee

- Set prize pool

- Set maximum players

- Set date/time

- Set rules

- Add Room ID

- Add Room Password

- Publish/unpublish room details



Tournament statuses:



- Draft

- Upcoming

- Registration Open

- Full

- Live

- Completed

- Cancelled



---



6. Participant Management



Admin can:



- View participants

- Search participants

- View Free Fire UID

- View in-game name

- View payment status

- Remove participant if required

- Export participant data

- View team information



Prevent duplicate tournament registration.



---



7. Result Management



Admin can enter:



- Player/team

- Kills

- Placement

- Points

- Bonus points if configured



Automatically calculate:



Total Points = Kill Points + Placement Points + Bonus Points



Allow admin to review and approve results.



After result approval, distribute prizes according to the configured prize structure.



All prize distribution must happen server-side.



---



8. Wallet System



Implement a secure wallet.



Transaction types:



- Deposit

- Tournament Entry

- Prize

- Referral Reward

- Withdrawal

- Refund

- Admin Adjustment



Every transaction must have:



- Transaction ID

- User ID

- Amount

- Type

- Status

- Timestamp

- Description



Use an immutable transaction ledger where possible.



Never trust the wallet balance sent by the client.



---



9. Deposit System



If a payment gateway is integrated:



Flow:



User → Payment Gateway → Server Verification → Transaction Record → Wallet Credit



Never credit money only because the frontend says payment was successful.



Verify payment server-side using the payment provider's API/webhook.



Protect against:



- Duplicate payment

- Replay attacks

- Fake payment status

- Modified amount

- Duplicate webhook



---



10. Withdrawal System



User enters:



- Amount

- UPI ID/payment details



System validates:



- Minimum withdrawal

- Maximum withdrawal

- Available balance

- Pending withdrawal limit

- Account status



Flow:



User Request → Server Validation → Lock/Deduct Funds → Admin Review/Payment Processing → Final Status



Statuses:



- Pending

- Processing

- Completed

- Rejected

- Failed



If rejected, refund the locked amount safely.



Never allow negative balance.



---



11. Promo Code System



Admin can create promo codes.



Fields:



- Code

- Reward

- Minimum requirement

- Maximum usage

- Expiry date

- Per-user usage limit

- Active/inactive



Prevent multiple redemption of the same code by the same user.



---



12. Security Requirements



This is extremely important.



Implement:



- Secure authentication

- Role-based access control

- Admin-only APIs

- Database security rules

- Server-side wallet calculations

- Server-side tournament joining

- Server-side prize distribution

- Server-side payment verification

- Input validation

- Rate limiting

- Duplicate transaction protection

- Duplicate tournament join protection

- Audit logs

- Secure environment variables

- Proper error handling



NEVER expose:



- Admin passwords

- Service-role keys

- Payment gateway secret keys

- Private API secrets

- Database privileged credentials



in the frontend.



---



13. Anti-Abuse



Implement reasonable anti-abuse protections:



- One account per allowed device/account policy

- Suspicious activity detection

- Rate limiting

- Duplicate registration prevention

- Duplicate payment prevention

- Withdrawal abuse detection

- Admin ban/unban

- Account status: Active/Banned/Suspended



Do not permanently block legitimate users based only on unreliable device signals.



---



14. Database Structure



Create proper tables/collections for:



users



admins



tournaments



participants



teams



results



leaderboards



wallets



transactions



deposits



withdrawals



promo_codes



promo_redemptions



notifications



support_tickets



audit_logs



settings



Create proper relationships, indexes and constraints.



Use server-side timestamps.



---



15. UI/UX Design



The UI should look like a professional esports application.



Style:



- Dark gaming theme

- Modern cards

- Premium tournament banners

- Smooth animations

- Clean typography

- Proper spacing

- Responsive layout

- Bottom navigation on mobile

- Clear CTA buttons

- Loading skeletons

- Empty states

- Error states

- Success animations where appropriate



Do NOT make the UI overly complicated.



The home page should immediately show the most important tournaments.



---



16. Navigation



Bottom navigation:



Home | Tournaments | My Games | Wallet | Profile



Admin navigation:



Dashboard | Users | Tournaments | Results | Payments | Withdrawals | Notifications | Settings



---



17. Notifications



Implement notifications for:



- Tournament joined

- Tournament starting soon

- Room ID released

- Match completed

- Result published

- Prize credited

- Withdrawal approved/rejected

- Important announcements



---



18. Legal/Compliance



Do not assume that real-money tournaments, entry fees, prizes or withdrawals are legally permitted everywhere.



Design the payment/prize features so they can be disabled by region or configuration.



Include placeholders for:



- Terms & Conditions

- Privacy Policy

- Responsible gaming notice where applicable

- Refund policy

- Tournament rules



Also ensure the use of Free Fire/Garena trademarks, logos and assets complies with applicable permissions and platform policies. Do not copy proprietary branding without authorization.



---



19. Developer Requirements



Build the project in a clean and maintainable structure.



Requirements:



- Reusable components

- Clean folder structure

- Environment variables

- Secure API layer

- Database migrations/schema

- Proper validation

- Error handling

- Loading states

- Responsive UI

- Comments only where useful

- No unnecessary dependencies



Do not create fake/mock functionality and present it as production functionality.



If a real payment gateway, authentication provider, notification provider or backend service cannot be connected in the current environment, clearly mark it as a configuration step.



---



20. Development Process



Follow this order:



Phase 1



Create project structure and UI.



Phase 2



Create authentication.



Phase 3



Create database schema.



Phase 4



Connect backend.



Phase 5



Create tournament system.



Phase 6



Create participant and leaderboard system.



Phase 7



Create wallet and transaction ledger.



Phase 8



Create payment integration architecture.



Phase 9



Create withdrawal system.



Phase 10



Create admin panel.



Phase 11



Add notifications.



Phase 12



Security audit and testing.



---



21. Important Instruction



Do not generate the entire project as one giant incomplete file.



Build it systematically.



First create the complete project structure and core UI.



Then implement each module one by one.



For every module:



1. Create the required files.

2. Implement functionality.

3. Connect it to the backend/database.

4. Check for errors.

5. Test the important flows.

6. Fix issues before moving to the next module.



At the end, provide:



- Complete project structure

- Database schema

- Required environment variables

- Setup instructions

- Admin setup instructions

- Deployment instructions

- Security checklist

- Testing checklist



The final application should be production-oriented, secure, responsive and visually polished.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fire-fame.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d4228565-8c21-4773-aff0-6b68f800a89f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
