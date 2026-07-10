## Make WhatsApp number required + update privacy page

**src/routes/input.tsx**
- Update the WhatsApp field label from "Receive Insights via WhatsApp" to indicate it's required (add a red asterisk, e.g. "WhatsApp Number *" or "Receive Insights via WhatsApp (required)"), and add `required` to the tel input. Validation already blocks submit for <10 digits — keep as is.

**src/routes/privacy.tsx** (line 52)
- Change `<strong>Phone Number (optional):</strong> For customer support and order updates`
  to `<strong>Phone Number:</strong> Required to deliver your report via WhatsApp and for order updates`

No backend changes — `create-love-match-order` already requires phone (≥10 digits).