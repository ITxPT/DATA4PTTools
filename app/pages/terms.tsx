import { Container, Stack, Typography } from '@mui/material'
import { type NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import App from '../components/App'

const siteUrl = 'https://greenlight.itxpt.eu/'

const Terms: NextPage = () => {
  const meta = {
    title: 'Terms of Use - Greenlight',
    description: 'Fast and simple NeTEx validation',
    link: siteUrl,
    image: `${siteUrl}/social_logo.png`
  }

  return (
    <App>
      <Head>
        <title>{meta.title}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="description" property="description" content={meta.description} />
        <meta name="og:type" property="og:type" content="website" />
        <meta name="og:url" property="og:url" content={meta.link} key="ogurl" />
        <meta name="og:image" property="og:image" content={meta.image} key="ogimage" />
        <meta name="og:site_name" property="og:site_name" content="Bencha" key="ogsitename" />
        <meta name="og:title" property="og:title" content={meta.title} key="ogtitle" />
        <meta name="og:description" property="og:description" content={meta.description} key="ogdesc" />
        <meta name="og:locale" property="og:locale" content="sv_SE" />
        <meta name="twitter:card" property="twitter:card" content="summary" key="twcard" />
        <meta name="twitter:title" property="twitter:title" content={meta.title} />
        <meta name="twitter:description" property="twitter:description" content={meta.description} />
        <meta name="twitter:image" property="twitter:image" content={meta.image} />
      </Head>

      <Container>
        <Stack spacing={4}>
          <Typography variant="h1">Terms of Use</Typography>
          <Stack spacing={2}>
            <Typography variant="h4">Information Technology for Public Transportation a.i.s.b.l</Typography>
            <Typography>Welcome to the Information Technology for Public Transport a.i.s.b.l.{"'"}s Terms of Use agreement. For purposes of this agreement, “Site” refers to the Company{"'"}s website, which can be accessed at: <a href="https://itxpt.org" target="_blank" rel="noreferrer">https://itxpt.org</a> The terms “ITxPT“, “we,” “us,” and “our” refer to the Company. “You” refers to you, as a user of our Site or our Service.</Typography>
            <Typography>The following Terms of Use apply when you access the Greenlight tool ITxPT website located at: <a href={siteUrl}>{siteUrl}</a></Typography>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h4">Introduction</Typography>
            <Typography>These terms of use apply between you, the User of this Website (including any sub-domains, unless expressly excluded by their own terms of use), and ITxPT, the owner and operator of this Website. Please read these terms of use carefolly, as they affect your legal rights. Your agreement to comply with and be bound by these terms of use is deemed to occur upon your first use of the Website. If you do not agree to be bound by these terms of use, you shoold stop using the Website immediately.</Typography>
            <Typography>In these terms of use, User or Users means any third party that accesses the Website and is not either (i) employed by ITxPT and acting in the course of their employment or (ii) engaged as a consoltant or otherwise providing services to ITxPT and accessing the Website in connection with the provision of such services.</Typography>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h4">Intellectual property and acceptable use</Typography>
            <ol>
              <li>All Content included on the Website, unless uploaded by Users, is the property of ITxPT, our affiliates or other relevant third parties. In these terms of use, Content means any text, graphics, images, audio, video, software, data compilations, page layout, underlying code and software and any other form of information capable of being stored in a computer that appears on or forms part of this Website, including any such content uploaded by Users. By continuing to use the Website you acknowledge that such Content is protected by copyright, trademarks, database rights and other intellectual property rights. Nothing on this site shall be construed as granting, by implication, estoppel, or otherwise, any license or right to use any trademark, logo or service mark displayed on the site without the owner{"'"}s prior written permission</li>
              <li>
                You may, for your own personal, non-commercial use only, do the following:
                <ol type="a">
                  <li>Retrieve, display and view the Content on a computer screen</li>
                  <li>Download and store the Content in electronic form on a disk (but not on any server or other storage device connected to a network)</li>
                  <li>Print one copy of the Content</li>
                </ol>
              </li>
              <li>You must not otherwise reproduce, modify, copy, distribute or use for commercial purposes any Content without the written permission of ITxPT.</li>
              <li>You acknowledge that you are responsible for any Content you may submit via the Website, including the legality, reliability, appropriateness, originality and copyright of any such Content. You may not upload to, distribute or otherwise publish through the Website any Content that (i) is confidential, proprietary, false, fraudolent, libellous, defamatory, obscene, threatening, invasive of privacy or publicity rights, infringing on intellectual property rights, abusive, illegal or otherwise objectionable; (ii) may constitute or encourage a criminal offence, violate the rights of any party or otherwise give rise to liability or violate any law; or (iii) may contain software viruses, political campaigning, chain letters, mass mailings, or any form of “spam.” You may not use a false email address or other identifying information, impersonate any person or entity or otherwise mislead as to the origin of any content. You may not upload commercial content onto the Website.</li>
              <li>You represent and warrant that you own or otherwise control all the rights to the Content you post; that the Content is accurate; that use of the Content you supply does not violate any provision of these terms of use and will not cause injury to any person; and that you will indemnify ITxPT for all claims resolting from Content you supply.</li>
            </ol>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h4">Prohibited use</Typography>
            <ol>
              <li>
                You may not use the Website for any of the following purposes:
                <ol type="a">
                  <li>In any way which causes, or may cause, damage to the Website or interferes with any other person{"'"}s use or enjoyment of the Website</li>
                  <li>In any way which is harmful, unlawful, illegal, abusive, harassing, threatening or otherwise objectionable or in breach of any applicable law, regulation, governmental order.</li>
                  <li>Making, transmitting or storing electronic copies of Content protected by copyright without the permission of the owner.</li>
                </ol>
              </li>
            </ol>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h4">Privacy Policy</Typography>
            <ol>
              <li>Use of the Website is also governed by our Privacy Policy, which is incorporated into these terms of use by this reference. To view the Privacy Policy, please click here.</li>
            </ol>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h4">Availability of the Website and disclaimers</Typography>
            <ol>
              <li>Any online facilities, tools, services or information that ITxPT makes available through the Website (the Service) is provided “as is” and on an “as available” basis. We give no warranty that the Service will be free of defects and/or faults. To the maximum extent permitted by the law, we provide no warranties (express or implied) of fitness for a particular purpose, accuracy of information, compatibility and satisfactory quality. ITxPT is under no obligation to update information on the Website.</li>
              <li>Whilst ITxPT uses reasonable endeavours to ensure that the Website is secure and free of errors, viruses and other malware, we give no warranty or guaranty in that regard and all Users take responsibility for their own security, that of their personal details and their computers.</li>
              <li>ITxPT accepts no liability for any disruption or non-availability of the Website.</li>
              <li>ITxPT reserves the right to alter, suspend or discontinue any part (or the whole of) the Website including, but not limited to, any products and/or services available. These terms of use shall continue to apply to any modified version of the Website unless it is expressly stated otherwise.</li>
            </ol>
          </Stack>
          <Stack spacing={2}>
            <Typography variant="h4">General</Typography>
            <ol>
              <li>You may not transfer any of your rights under these terms of use to any other person. We may transfer our rights under these terms of use where we reasonably believe your rights will not be affected.</li>
              <li>These terms of use may be varied by us from time to time. Such revised terms will apply to the Website from the date of publication. Users should check the terms of use regularly to ensure familiarity with the then current version.</li>
              <li>These terms of use together with the Privacy Policy contain the whole agreement between the parties relating to its subject matter and supersede all prior discussions, arrangements or agreements that might have taken place in relation to the terms of use.</li>
              <li>If any court or competent authority finds that any provision of these terms of use (or part of any provision) is invalid, illegal or unenforceable, that provision or part-provision will, to the extent required, be deemed to be deleted, and the validity and enforceability of the other provisions of these terms of use will not be affected.</li>
              <li>Unless otherwise agreed, no delay, act or omission by a party in exercising any right or remedy will be deemed a waiver of that, or any other, right or remedy.These terms of use will be governed by and interpreted according to Belgian law. All disputes arising under these terms of use will be subject to the exclusive jurisdiction of the Belgian courts.</li>
            </ol>
            <Typography>ITxPT details<br />ITxPT is an association incorporated in Belgium whose registered address is UITP, International Association of Public Transport, Rue Sainte-Marie 6, B-1080 Brussels, Belgium and it operates the <a href={siteUrl}>Website</a>. The registered VAT number is BE0656563009.</Typography>
            <Typography>You can contact ITxPT association by email at <a href="mailto:info@itxpt.org">info@itxpt.org</a></Typography>
          </Stack>
        </Stack>
      </Container>
    </App>
  )
}

export default Terms
