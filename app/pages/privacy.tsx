import { Container, Stack, Typography } from '@mui/material'
import { type NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import App from '../components/App'
import theme from '../styles/theme'

const Policy: NextPage = () => {
  return (
    <App>
      <Head>
        <title>Privacy policy | Greenlight</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <Container>
        <Stack spacing={4}>
          <Typography variant="h1">Privacy Policy</Typography>
          <Stack spacing={2}>
            <Typography variant="h4">Information Technology for Public Transportation a.i.s.b.l</Typography>
            <Typography>
              Information Technology for Public Transport a.i.s.b.l. (hereinafter referred to as ITxPT) is a non-profit organization whose mission is to specify communication protocols and hardware interfaces to offer a full interoperability of IT systems in Public Transport applications.
              We are committed to protecting the privacy of our members and users. This privacy policy seeks to help you understand why and how we use your personal information. We value your privacy and strive to protect your personal information. Please read this Policy to understand what types of information we collect from you, for what purposes and what choices you have regarding our collection of your information.
              This policy covers ITxPT.org website and all *.itxpt.org subsites (collectively, the “Website”)
            </Typography>
            <Typography>By accessing, using or posting information to this Website, you agree to this Privacy Policy and the Terms of Use.</Typography>
          </Stack>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row">
              <Typography variant="h4" sx={{ color: theme.palette.accent.main }}>1.</Typography>
              <Typography variant="h4">Information We Collect About You</Typography>
            </Stack>
            <ol type="1">
              <li>Your email address. We treat this information as “Personally Identifiable Information” or “PII”.</li>
              <li>
                Non-personally identifiable information, such as demographic information about you, information about your computer system or device, your preferences, your online activity, and your location information (“Non-Personally Identifiable Information” a “Non-PII”). Non-PII, by itself, does not identify you, but it can be combined with other information in way that allows you to be identified. If this happens, we will treat the combined information as PII
                <br/><br/>
                We may collect information from or about you in the following ways:
                <br/><br/>
                Information Provided by You. We collect information provided by you when you (1) create your user account; (2) communicate with us or request information about or from us by e-mail or other means; (3) fill out forms or fields on this Website; (4) sign-up for any of our newsletters, materials or our services on this Website or other sites; or (5) participate in our online surveys or questionnaires.
                <br/><br/>
                Automatic Information Collection. We also use automatic data collection technologies to collect and store certain information about your equipment, browsing actions and patterns when you interact with this Website through your computer or mobile device.
              </li>
            </ol>
            <Stack spacing={1} direction="row">
              <Typography variant="subtitle1" sx={{ color: theme.palette.accent.main }}>1.1.</Typography>
              <Typography variant="subtitle1">Sub-sites</Typography>
            </Stack>
            <Typography>We may collect additional information from and about you when you visit certain *.itxpt.org sites and perform certain activities. Detailed information per site below.</Typography>
            <Stack spacing={1} direction="row">
              <Typography variant="subtitle1" sx={{ color: theme.palette.accent.main }}>1.1.1.</Typography>
              <Typography variant="subtitle1">ITxPT Documentation Centre: <a href="WIKI.ITXPT.ORG" target="_blank" rel="noreferrer">wiki.itxpt.org</a></Typography>
            </Stack>
            <Typography>When you request a registration, we will collect additional information about you, such as your professional email address, etc. We treat this information as non-public, “Personally Identifiable Information” or “PII”.</Typography>
            <Stack spacing={1} direction="row">
              <Typography variant="subtitle1" sx={{ color: theme.palette.accent.main }}>1.2.</Typography>
              <Typography variant="subtitle1">Links to Third Party Websites and Social Media Widgets</Typography>
            </Stack>
            <Typography>This Website and some of our electronic communications to you, may contain links to other websites that are owned and operated by third parties. Links to third parties from this Website are not an endorsement by us. We do not control, and are not responsible for, the privacy and security practices of these third parties. We recommend that you review the privacy and security policies of these third parties to determine how they handle information they may collect from or about you.</Typography>
            <Typography>This Website may also include features, such as Github, Docker. These features may collect information about your IP address and the page you are visiting on this Website, and they may set a cookie to make sure the feature functions properly. Your interactions with these features and the information from or about you collected by them are governed by the privacy policies of the companies that provide them.</Typography>
            <Stack spacing={1} direction="row">
              <Typography variant="subtitle1" sx={{ color: theme.palette.accent.main }}>1.3.</Typography>
              <Typography variant="subtitle1">Automatic Information Collection Technologies</Typography>
            </Stack>
            <Typography>The information that we collect about your equipment, browsing actions and patterns includes, but is not limited to, traffic data, location data, logs, the resources that you access, search queries, as well as information about the computer or device you are using and the Internet connection, including your IP address, operating system and browser type.</Typography>
            <Typography>This automatically collected information typically does not include PII, but we may maintain it or associate it with your personal information collected in other ways. Collection of this type of information helps us to improve this Website and to deliver a better and more personalized service by enabling us to, among other things: (1) estimate our audience size and usage patterns; (2) store information about your preferences, allowing us to customize this Website according to your individual interests; (3) speed up your searches; and (4) recognize you when you return to this Website.</Typography>
            <Typography>The automatic collection technologies we or our service providers use for this automatic information collection may include:
Cookies (or browser cookies). This Website may use two types of cookies (small data files placed on the hard drive of your computer when you visit a website): a “session cookie,” which expires immediately when you end your browsing session and a “persistent cookie,” which stores information on your hard drive so when you end your browsing session and return to this website later, the cookie information is still available. Web Beacons. Pages of this Website and any e-mails sent to you may contain small electronic files known as web beacons (also referred to as clear gifs, pixel tags, and single-pixel gifs) that permit us, for example, to count users who have visited those pages or opened our e-mails.</Typography>
            <Stack spacing={1} direction="row">
              <Typography variant="subtitle1" sx={{ color: theme.palette.accent.main }}>1.4.</Typography>
              <Typography variant="subtitle1">Service providers and partners</Typography>
            </Stack>
            <Typography>We use a number of service providers to help us operate the site and provide high quality user experience to our visitors. Some of those providers can access Non-PII about you via automatic data collection technologies.</Typography>
            <Typography>We may use ReCaptcha for spam detection and prevention. When you register an account or complete a form from ITxPT, you accept the ReCaptcha terms of service and privacy policy. We may use Mailchimp to send Newsletter emails to users who subscribe to receive them. You can review Mailchimp privacy policy for information on how they manage user data. We may use Google services to run surveys, forms, share collaborative documents. You can review related individual privacy policies for information on how they manage user data.</Typography>
          </Stack>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row">
              <Typography variant="h4" sx={{ color: theme.palette.accent.main }}>2.</Typography>
              <Typography variant="h4">How We Use Your Information</Typography>
            </Stack>
            <Typography>We use your information, including any PII, to:</Typography>
            <ul>
              <li>Provide information and services requested by you;</li>
              <li>Provide member support, including responding to your requests and questions and troubleshooting and resolving problems or complaints;</li>
              <li>Verify the information you provide to us;</li>
              <li>Communicate with you;</li>
              <li>Understand and anticipate your use of or interest in, our services, and content, and the products, services, and content offered by others;</li>
              <li>Develop and display products, services, and content tailored to your interests on our websites and other websites;</li>
              <li>Provide you with informational materials and newsletters in case you opt-in to receive those;</li>
              <li>Measure the overall effectiveness of our online, content, and programming, and other activities;</li>
              <li>Manage our activities and operations;</li>
              <li>Protect the security and integrity of this Website;</li>
              <li>Carry out our obligations and enforce our rights arising from any contracts entered into between you and us;</li>
              <li>Use or post user contributions as permitted in our Terms of Use; and</li>
              <li>Fulfil any other purposes for which you provide your information and for any other purpose as described to you at the time your information is collected or for which your consent is given.</li>
            </ul>
          </Stack>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row">
              <Typography variant="h4" sx={{ color: theme.palette.accent.main }}>3.</Typography>
              <Typography variant="h4">Disclosure of Your Information</Typography>
            </Stack>
            <Typography>We may disclose and share aggregated non-PII about you at our discretion.</Typography>
            <Typography>We may disclose or share your PII only in limited circumstances:</Typography>
            <Typography>With any ITxPT Association employee or agent for support of our internal and business operations or to respond to a request made by you. We may disclose information we collect from or about you when we believe disclosure is appropriate to comply with the law, to enforce agreements, or to protect the rights, property, or safety of users of this Website, the Association, or other persons or organizations.</Typography>
          </Stack>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row">
              <Typography variant="h4" sx={{ color: theme.palette.accent.main }}>4.</Typography>
              <Typography variant="h4">Your Choices About Use and Disclosure of Your Information</Typography>
            </Stack>
            <Typography>We strive to provide you with choices regarding our use of your personal information. Below are some mechanisms that provide you with control over your information:</Typography>
            <Typography>Informational emails. We do not send any informational emails without your opt-in first. If you do not wish to receive informational emails from us, follow the unsubscribe process at the bottom of the informational e-mail. Note that even if you opt-out, you may still receive transactional emails from us (e.g., e-mails related to the completion of your registration, correction of user data, password reset requests, reminder emails that you have requested, and any other similar communications essential to your transactions on this Website).</Typography>
            <Typography>Automatic Information Collection Technologies and Advertising. The “help” function of your browser should contain instructions on how to set your browser to not accept new cookies, to notify you when a cookie is issued, or how to disable cookies altogether. If you disable or refuse cookies, please note that some parts of this Website may be inaccessible or not function properly.</Typography>
            <Typography>Google Analytics. You can opt out from Google Analytics tracking via your browser privacy settings or by using browser addon.</Typography>
            <Stack spacing={1} direction="row">
              <Typography variant="subtitle1" sx={{ color: theme.palette.accent.main }}>4.1.</Typography>
              <Typography variant="subtitle1">Accessing and Correcting Your Information</Typography>
            </Stack>
            <Typography>To request access to, correct, or delete any personal information that you have provided to us you may contact us at info@itxpt.org.</Typography>
            <Typography>Upon deletion all private and personally identifying information from your profile will be deleted. Public content you created, such as issues, forum posts, projects, documentation page revisions, etc. won’t be deleted. All this content will be attributed to ‘Anonymous’ user.</Typography>
          </Stack>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row">
              <Typography variant="h4" sx={{ color: theme.palette.accent.main }}>5.</Typography>
              <Typography variant="h4">Protection of Your Information</Typography>
            </Stack>
            <Typography>We use reasonable security measures to protect your information collected through this Website. We do not store passwords in plain text format, only secure password hashes. However, no method of transmission or electronic storage is 100% safe, and we cannot guarantee absolute security. Therefore, your use of this Website is at your own risk and we do not promise or guarantee, and you should not expect, that your information will always and absolutely remain private and secure. We are not responsible for the circumvention of any privacy settings or security measures contained on or concerning this Website. You are also responsible for taking reasonable steps to protect your personal information against unauthorized disclosure or misuse.</Typography>
          </Stack>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row">
              <Typography variant="h4" sx={{ color: theme.palette.accent.main }}>6.</Typography>
              <Typography variant="h4">Changes to this Privacy Policy</Typography>
            </Stack>
            <Typography>We may update or amend this Privacy Policy at any time. All amendments will take effect immediately upon our posting of the updated Privacy Policy on this Website. Your continued use of this Website will indicate your acceptance of the changes to the Privacy Policy.</Typography>
          </Stack>
          <Stack spacing={2}>
            <Stack spacing={1} direction="row">
              <Typography variant="h4" sx={{ color: theme.palette.accent.main }}>7.</Typography>
              <Typography variant="h4">Contacting us</Typography>
            </Stack>
            <Typography>If you have questions or concerns about this Privacy Policy, our information practices, or wish to make a request regarding your information, please contact us at any of the following:</Typography>
            <Typography>Via postal mail:</Typography>
            <Typography>
              Information Technology for Public Transport<br/>
              Rue Sainte-Marie 6<br/>
              B-1080 Brussels<br/>
              Belgium<br/>
            </Typography>
            <Typography>Via e-mail: <a href="mailto:info@itxpt.org">info@itxpt.org</a></Typography>
          </Stack>
        </Stack>
      </Container>
    </App>
  )
}

export default Policy
